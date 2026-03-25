from __future__ import annotations

import json

from app.models.experiment import Experiment
from app.schemas.api import (
    BiasReport,
    ConsistencyReport,
    EvaluationDetail,
    ExperimentDetail,
    ExperimentListItem,
    MetricReasoning,
    OptimizationSuggestion,
    ScoreWeights,
    VariationResultOut,
)


def experiment_to_detail(ex: Experiment) -> ExperimentDetail:
    weights_data = json.loads(ex.weights_json or "{}")
    weights = ScoreWeights.model_validate(weights_data)

    results: list[VariationResultOut] = []
    variations = sorted(ex.variations, key=lambda v: v.sort_order)
    for v in variations:
        vr = v.result
        if vr is None:
            continue
        reasoning_raw = {}
        if vr.eval_reasoning_json:
            try:
                reasoning_raw = json.loads(vr.eval_reasoning_json)
            except json.JSONDecodeError:
                reasoning_raw = {}
        reasoning = MetricReasoning.model_validate(
            {
                "clarity": reasoning_raw.get("clarity", ""),
                "relevance": reasoning_raw.get("relevance", ""),
                "depth": reasoning_raw.get("depth", ""),
                "creativity": reasoning_raw.get("creativity", ""),
            }
        )
        eval_ = EvaluationDetail(
            clarity=vr.clarity,
            relevance=vr.relevance,
            depth=vr.depth,
            creativity=vr.creativity,
            reasoning=reasoning,
        )
        bias = BiasReport()
        if vr.bias_json:
            try:
                bias = BiasReport.model_validate(json.loads(vr.bias_json))
            except json.JSONDecodeError:
                pass
        results.append(
            VariationResultOut(
                variation_id=v.id,
                label=v.label,
                prompt_text=v.prompt_text,
                response_text=vr.response_text,
                evaluation=eval_,
                weighted_score=vr.weighted_score,
                strength_score=vr.strength_score,
                bias=bias,
                is_winner=bool(ex.winner_variation_id and v.id == ex.winner_variation_id),
            )
        )

    consistency: ConsistencyReport | None = None
    if ex.consistency_json:
        try:
            consistency = ConsistencyReport.model_validate(json.loads(ex.consistency_json))
        except json.JSONDecodeError:
            consistency = None

    optimization: OptimizationSuggestion | None = None
    if ex.optimization_original and ex.optimization_improved:
        optimization = OptimizationSuggestion(
            original_prompt=ex.optimization_original,
            improved_prompt=ex.optimization_improved,
            explanation=ex.optimization_explanation or "",
        )

    bias_summary_text: str | None = None
    if ex.bias_summary_json:
        try:
            bias_summary_text = str(json.loads(ex.bias_summary_json).get("summary_text", ""))
        except json.JSONDecodeError:
            bias_summary_text = None

    return ExperimentDetail(
        id=ex.id,
        created_at=ex.created_at,
        title=ex.title,
        status=ex.status,
        base_prompt=ex.base_prompt,
        provider=ex.provider,
        model_name=ex.model_name,
        weights=weights,
        winner_variation_id=ex.winner_variation_id,
        winner_explanation=ex.winner_explanation,
        optimization=optimization,
        consistency=consistency,
        bias_summary=bias_summary_text,
        results=results,
        error_message=ex.error_message,
    )


def experiment_to_list_item(ex: Experiment) -> ExperimentListItem:
    n = len(ex.variations) if ex.variations else 0
    return ExperimentListItem(
        id=ex.id,
        created_at=ex.created_at,
        title=ex.title,
        status=ex.status,
        provider=ex.provider,
        model_name=ex.model_name,
        variation_count=n,
    )
