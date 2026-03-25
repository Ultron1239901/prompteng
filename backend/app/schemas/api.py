from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator


class ScoreWeights(BaseModel):
    clarity: float = Field(default=0.25, ge=0, le=1)
    relevance: float = Field(default=0.25, ge=0, le=1)
    depth: float = Field(default=0.25, ge=0, le=1)
    creativity: float = Field(default=0.25, ge=0, le=1)

    @field_validator("clarity", "relevance", "depth", "creativity")
    @classmethod
    def finite(cls, v: float) -> float:
        if not (0 <= v <= 1):
            raise ValueError("weights must be between 0 and 1")
        return v

    def normalized(self) -> dict[str, float]:
        total = self.clarity + self.relevance + self.depth + self.creativity
        if total <= 0:
            return {"clarity": 0.25, "relevance": 0.25, "depth": 0.25, "creativity": 0.25}
        return {
            "clarity": self.clarity / total,
            "relevance": self.relevance / total,
            "depth": self.depth / total,
            "creativity": self.creativity / total,
        }


class VariationIn(BaseModel):
    label: str = Field(default="Prompt", max_length=256)
    prompt_text: str = Field(..., min_length=1, max_length=100_000)


class ExperimentCreate(BaseModel):
    title: str | None = Field(default=None, max_length=512)
    base_prompt: str = Field(..., min_length=1, max_length=100_000)
    variations: list[VariationIn] = Field(..., min_length=1, max_length=8)
    weights: ScoreWeights = Field(default_factory=ScoreWeights)
    provider: Literal["openrouter"] = "openrouter"
    model: str | None = None


class ExperimentRunRequest(ExperimentCreate):
    """Same as create; used for POST /experiments/run explicit naming."""

    pass


class MetricReasoning(BaseModel):
    clarity: str = ""
    relevance: str = ""
    depth: str = ""
    creativity: str = ""


class EvaluationDetail(BaseModel):
    clarity: float = Field(ge=0, le=10)
    relevance: float = Field(ge=0, le=10)
    depth: float = Field(ge=0, le=10)
    creativity: float = Field(ge=0, le=10)
    reasoning: MetricReasoning | dict[str, str] = Field(default_factory=MetricReasoning)


class BiasReport(BaseModel):
    severity: Literal["low", "medium", "high"] = "low"
    flags: list[str] = Field(default_factory=list)
    explanation: str = ""


class VariationResultOut(BaseModel):
    variation_id: int
    label: str
    prompt_text: str
    response_text: str
    evaluation: EvaluationDetail
    weighted_score: float
    strength_score: float
    bias: BiasReport
    is_winner: bool


class ConsistencyReport(BaseModel):
    overall_score: float = Field(ge=0, le=10, description="Higher means more consistent / aligned")
    contradictions: list[str] = Field(default_factory=list)
    themes_in_common: list[str] = Field(default_factory=list)
    summary: str = ""


class OptimizationSuggestion(BaseModel):
    original_prompt: str
    improved_prompt: str
    explanation: str


class ExperimentRunResponse(BaseModel):
    experiment_id: int
    status: str
    provider: str
    model_name: str
    results: list[VariationResultOut]
    winner_variation_id: int | None
    winner_explanation: str | None
    optimization: OptimizationSuggestion | None
    consistency: ConsistencyReport | None
    bias_summary: str | None


class ExperimentListItem(BaseModel):
    id: int
    created_at: datetime
    title: str | None
    status: str
    provider: str
    model_name: str
    variation_count: int


class ExperimentDetail(BaseModel):
    id: int
    created_at: datetime
    title: str | None
    status: str
    base_prompt: str
    provider: str
    model_name: str
    weights: ScoreWeights
    winner_variation_id: int | None
    winner_explanation: str | None
    optimization: OptimizationSuggestion | None
    consistency: ConsistencyReport | None
    bias_summary: str | None
    results: list[VariationResultOut]
    error_message: str | None = None
