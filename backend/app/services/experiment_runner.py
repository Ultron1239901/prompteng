from __future__ import annotations

import asyncio
import json
import logging
from dataclasses import dataclass
from typing import Any

from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.experiment import Experiment, Variation, VariationResult
from app.schemas.api import (
    BiasReport,
    ConsistencyReport,
    EvaluationDetail,
    ExperimentRunResponse,
    MetricReasoning,
    OptimizationSuggestion,
    ScoreWeights,
    VariationResultOut,
)
from app.services.ai_protocol import ChatMessage
from app.services.openrouter_provider import OpenRouterProvider

logger = logging.getLogger(__name__)

GENERATION_MAX_TOKENS = 900
JSON_ANALYSIS_MAX_TOKENS = 350
WINNER_EXPLANATION_MAX_TOKENS = 220
OPTIMIZATION_MAX_TOKENS = 400


def _clamp_score(x: float) -> float:
    return max(0.0, min(10.0, float(x)))


def _safe_json_loads(text: str) -> dict[str, Any]:
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines)
    return json.loads(text)


def _weighted_total(eval_: EvaluationDetail, w: dict[str, float]) -> float:
    return (
        eval_.clarity * w["clarity"]
        + eval_.relevance * w["relevance"]
        + eval_.depth * w["depth"]
        + eval_.creativity * w["creativity"]
    )


def _strength_score(weighted: float) -> float:
    # weighted uses 0-10 scale per dimension → max ~10
    return max(0.0, min(100.0, (weighted / 10.0) * 100.0))


async def _generate_response(ai: OpenRouterProvider, model: str, user_prompt: str) -> str:
    messages = [
        ChatMessage(
            role="system",
            content=(
                "You are a careful assistant. Follow the user's instructions precisely. "
                "Produce substantive, accurate answers."
            ),
        ),
        ChatMessage(role="user", content=user_prompt),
    ]
    result = await ai.complete(
        messages,
        model,
        json_mode=False,
        max_tokens=GENERATION_MAX_TOKENS,
    )
    return result.text.strip()


EVAL_SYSTEM = """You are an expert prompt-engineering evaluator.
Score each dimension from 0-10 (decimals allowed).
Return STRICT JSON with this shape:
{
  "clarity": number,
  "relevance": number,
  "depth": number,
  "creativity": number,
  "reasoning": {
    "clarity": "string",
    "relevance": "string",
    "depth": "string",
    "creativity": "string"
  }
}
Be concise in reasoning (1-3 sentences each)."""


async def _evaluate_response(
    ai: OpenRouterProvider,
    model: str,
    *,
    original_prompt: str,
    model_response: str,
) -> EvaluationDetail:
    user = json.dumps(
        {
            "user_prompt": original_prompt,
            "model_response": model_response,
        },
        ensure_ascii=False,
    )
    messages = [
        ChatMessage(role="system", content=EVAL_SYSTEM),
        ChatMessage(
            role="user",
            content=f"Evaluate this pair:\n{user}",
        ),
    ]
    raw = await ai.complete(
        messages,
        model,
        json_mode=True,
        max_tokens=JSON_ANALYSIS_MAX_TOKENS,
    )
    data = _safe_json_loads(raw.text)
    reasoning_raw = data.get("reasoning") or {}
    reasoning = MetricReasoning(
        clarity=str(reasoning_raw.get("clarity", "")),
        relevance=str(reasoning_raw.get("relevance", "")),
        depth=str(reasoning_raw.get("depth", "")),
        creativity=str(reasoning_raw.get("creativity", "")),
    )
    return EvaluationDetail(
        clarity=_clamp_score(float(data.get("clarity", 0))),
        relevance=_clamp_score(float(data.get("relevance", 0))),
        depth=_clamp_score(float(data.get("depth", 0))),
        creativity=_clamp_score(float(data.get("creativity", 0))),
        reasoning=reasoning,
    )


BIAS_SYSTEM = """You analyze assistant outputs for potential bias (stereotyping, political skew,
unsupported demographic claims, toxic generalizations).
Return STRICT JSON:
{
  "severity": "low" | "medium" | "high",
  "flags": ["short label", ...],
  "explanation": "1-4 sentences"
}"""


async def _bias_scan(ai: OpenRouterProvider, model: str, response_text: str) -> BiasReport:
    messages = [
        ChatMessage(role="system", content=BIAS_SYSTEM),
        ChatMessage(
            role="user",
            content=json.dumps({"assistant_response": response_text}, ensure_ascii=False),
        ),
    ]
    raw = await ai.complete(
        messages,
        model,
        json_mode=True,
        max_tokens=JSON_ANALYSIS_MAX_TOKENS,
    )
    data = _safe_json_loads(raw.text)
    sev = data.get("severity", "low")
    if sev not in ("low", "medium", "high"):
        sev = "low"
    return BiasReport(
        severity=sev,
        flags=list(data.get("flags") or []),
        explanation=str(data.get("explanation", "")),
    )


CONSISTENCY_SYSTEM = """You compare multiple AI answers to the same class of prompts.
Return STRICT JSON:
{
  "overall_score": number,
  "contradictions": ["string", ...],
  "themes_in_common": ["string", ...],
  "summary": "string"
}
overall_score: 0-10 where 10 means highly consistent / compatible, 0 means major contradictions."""


async def _consistency_check(
    ai: OpenRouterProvider,
    model: str,
    labeled_responses: list[dict[str, str]],
) -> ConsistencyReport:
    payload = {"responses": labeled_responses}
    messages = [
        ChatMessage(role="system", content=CONSISTENCY_SYSTEM),
        ChatMessage(role="user", content=json.dumps(payload, ensure_ascii=False)),
    ]
    raw = await ai.complete(
        messages,
        model,
        json_mode=True,
        max_tokens=JSON_ANALYSIS_MAX_TOKENS,
    )
    data = _safe_json_loads(raw.text)
    return ConsistencyReport(
        overall_score=_clamp_score(float(data.get("overall_score", 5))),
        contradictions=[str(x) for x in (data.get("contradictions") or [])],
        themes_in_common=[str(x) for x in (data.get("themes_in_common") or [])],
        summary=str(data.get("summary", "")),
    )


OPT_SYSTEM = """You improve prompts for clarity, constraints, and reliability.
Return STRICT JSON:
{
  "improved_prompt": "string",
  "explanation": "bullet-style or short paragraphs ok"
}"""


async def _optimize_prompt(
    ai: OpenRouterProvider, model: str, winning_prompt: str, winning_response: str
) -> OptimizationSuggestion:
    context = json.dumps(
        {
            "winning_prompt": winning_prompt,
            "example_response_excerpt": winning_response[:8000],
        },
        ensure_ascii=False,
    )
    messages = [
        ChatMessage(role="system", content=OPT_SYSTEM),
        ChatMessage(role="user", content=f"Suggest an improved version:\n{context}"),
    ]
    raw = await ai.complete(
        messages,
        model,
        json_mode=True,
        max_tokens=OPTIMIZATION_MAX_TOKENS,
    )
    data = _safe_json_loads(raw.text)
    improved = str(data.get("improved_prompt", "")).strip()
    explanation = str(data.get("explanation", "")).strip()
    return OptimizationSuggestion(
        original_prompt=winning_prompt,
        improved_prompt=improved or winning_prompt,
        explanation=explanation,
    )


async def _winner_explanation(
    ai: OpenRouterProvider,
    model: str,
    summaries: list[dict[str, Any]],
    winner_id: str,
) -> str:
    system = (
        "You summarize why one prompt variant won across scored criteria. "
        "Return STRICT JSON: {\"explanation\": \"markdown-friendly plain text, 2-5 sentences\"}"
    )
    messages = [
        ChatMessage(role="system", content=system),
        ChatMessage(
            role="user",
            content=json.dumps({"candidates": summaries, "winner_label": winner_id}, ensure_ascii=False),
        ),
    ]
    raw = await ai.complete(
        messages,
        model,
        json_mode=True,
        max_tokens=WINNER_EXPLANATION_MAX_TOKENS,
    )
    data = _safe_json_loads(raw.text)
    return str(data.get("explanation", "")).strip()


@dataclass
class RunContext:
    db: Session
    experiment: Experiment
    weights: ScoreWeights


async def run_experiment_async(ctx: RunContext) -> ExperimentRunResponse:
    settings = get_settings()
    ex = ctx.experiment
    wmap = ctx.weights.normalized()

    model = ex.model_name or settings.default_model

    try:
        ai = OpenRouterProvider()
    except ValueError as e:
        ex.status = "failed"
        ex.error_message = str(e)
        ctx.db.commit()
        raise

    variations: list[Variation] = sorted(ex.variations, key=lambda v: v.sort_order)

    async def gen_one(v: Variation) -> tuple[int, str]:
        text = await _generate_response(ai, model, v.prompt_text)
        return v.id, text

    gen_results = await asyncio.gather(*[gen_one(v) for v in variations], return_exceptions=True)
    responses_by_vid: dict[int, str] = {}
    for i, v in enumerate(variations):
        gr = gen_results[i]
        if isinstance(gr, BaseException):
            logger.exception("Generation failed for variation %s", v.id)
            ex.status = "failed"
            ex.error_message = f"Generation failed: {gr}"
            ctx.db.commit()
            raise gr
        vid, rtext = gr
        responses_by_vid[vid] = rtext

    async def eval_pipeline(v: Variation) -> tuple[EvaluationDetail, BiasReport]:
        rtext = responses_by_vid[v.id]
        ev, bias = await asyncio.gather(
            _evaluate_response(
                ai,
                model,
                original_prompt=v.prompt_text,
                model_response=rtext,
            ),
            _bias_scan(ai, model, rtext),
        )
        return ev, bias

    pipe_results = await asyncio.gather(*[eval_pipeline(v) for v in variations], return_exceptions=True)

    built_results: list[tuple[Variation, str, EvaluationDetail, BiasReport]] = []
    for i, v in enumerate(variations):
        pr = pipe_results[i]
        if isinstance(pr, BaseException):
            ex.status = "failed"
            ex.error_message = f"Evaluation failed: {pr}"
            ctx.db.commit()
            raise pr
        ev, bias = pr
        built_results.append((v, responses_by_vid[v.id], ev, bias))

    scored: list[tuple[Variation, str, EvaluationDetail, BiasReport, float, float]] = []
    for v, rtext, ev, bias in built_results:
        wt = _weighted_total(ev, wmap)
        strength = _strength_score(wt)
        scored.append((v, rtext, ev, bias, wt, strength))

    winner: tuple[Variation, str, EvaluationDetail, BiasReport, float, float] | None = None
    for row in scored:
        if winner is None or row[4] > winner[4]:
            winner = row

    winner_variation_id: int | None = winner[0].id if winner else None

    labeled = [
        {"label": v.label, "prompt_excerpt": v.prompt_text[:2000], "response_excerpt": responses_by_vid[v.id][:4000]}
        for v in variations
    ]
    consistency = await _consistency_check(ai, model, labeled)

    summaries = [
        {
            "label": v.label,
            "variation_id": v.id,
            "weighted_score": round(next(x[4] for x in scored if x[0].id == v.id), 4),
            "scores": {
                "clarity": next(x[2].clarity for x in scored if x[0].id == v.id),
                "relevance": next(x[2].relevance for x in scored if x[0].id == v.id),
                "depth": next(x[2].depth for x in scored if x[0].id == v.id),
                "creativity": next(x[2].creativity for x in scored if x[0].id == v.id),
            },
        }
        for v in variations
    ]
    win_label = winner[0].label if winner else ""
    winner_expl = await _winner_explanation(ai, model, summaries, win_label)

    optimization: OptimizationSuggestion | None = None
    if winner:
        optimization = await _optimize_prompt(ai, model, winner[0].prompt_text, winner[1])

    bias_notes = [f"{v.label}: {b.severity} — {'; '.join(b.flags)}" for v, _, _, b, _, _ in scored]
    bias_summary = "\n".join(bias_notes)

    out_results: list[VariationResultOut] = []
    for v, rtext, ev, bias, wt, strength in scored:
        vr = ctx.db.query(VariationResult).filter(VariationResult.variation_id == v.id).one_or_none()
        if vr is None:
            vr = VariationResult(variation_id=v.id)
            ctx.db.add(vr)
        vr.response_text = rtext
        vr.clarity = ev.clarity
        vr.relevance = ev.relevance
        vr.depth = ev.depth
        vr.creativity = ev.creativity
        vr.weighted_score = wt
        vr.strength_score = strength
        vr.eval_reasoning_json = json.dumps(ev.reasoning.model_dump(), ensure_ascii=False)
        vr.bias_json = json.dumps(bias.model_dump(), ensure_ascii=False)

        out_results.append(
            VariationResultOut(
                variation_id=v.id,
                label=v.label,
                prompt_text=v.prompt_text,
                response_text=rtext,
                evaluation=ev,
                weighted_score=wt,
                strength_score=strength,
                bias=bias,
                is_winner=bool(winner_variation_id and v.id == winner_variation_id),
            )
        )

    ex.winner_variation_id = winner_variation_id
    ex.winner_explanation = winner_expl
    if optimization:
        ex.optimization_original = optimization.original_prompt
        ex.optimization_improved = optimization.improved_prompt
        ex.optimization_explanation = optimization.explanation
    ex.consistency_json = json.dumps(consistency.model_dump(), ensure_ascii=False)
    ex.bias_summary_json = json.dumps({"summary_text": bias_summary, "per_label": bias_notes}, ensure_ascii=False)
    ex.status = "completed"
    ex.error_message = None

    ctx.db.commit()

    return ExperimentRunResponse(
        experiment_id=ex.id,
        status=ex.status,
        provider=ex.provider,
        model_name=ex.model_name,
        results=out_results,
        winner_variation_id=winner_variation_id,
        winner_explanation=winner_expl,
        optimization=optimization,
        consistency=consistency,
        bias_summary=bias_summary or None,
    )


def build_experiment_record(
    db: Session,
    *,
    title: str | None,
    base_prompt: str,
    variation_inputs: list[tuple[str, str]],
    weights: ScoreWeights,
    provider: str,
    model_name: str,
) -> Experiment:
    ex = Experiment(
        title=title,
        status="running",
        base_prompt=base_prompt,
        provider=provider,
        model_name=model_name,
        weights_json=json.dumps(weights.model_dump(), ensure_ascii=False),
    )
    db.add(ex)
    db.flush()

    for idx, (label, text) in enumerate(variation_inputs):
        db.add(
            Variation(
                experiment_id=ex.id,
                sort_order=idx,
                label=label,
                prompt_text=text,
            )
        )
    db.commit()
    db.refresh(ex)
    return ex
