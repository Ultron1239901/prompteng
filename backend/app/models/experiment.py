from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Experiment(Base):
    __tablename__ = "experiments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    title: Mapped[str | None] = mapped_column(String(512), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="draft")

    base_prompt: Mapped[str] = mapped_column(Text, default="")
    provider: Mapped[str] = mapped_column(String(64), default="openrouter")
    model_name: Mapped[str] = mapped_column(String(128), default="openai/gpt-4o")

    weights_json: Mapped[str] = mapped_column(Text, default="{}")  # JSON string
    consistency_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    bias_summary_json: Mapped[str | None] = mapped_column(Text, nullable=True)

    winner_variation_id: Mapped[int | None] = mapped_column(ForeignKey("variations.id"), nullable=True)
    winner_explanation: Mapped[str | None] = mapped_column(Text, nullable=True)

    optimization_original: Mapped[str | None] = mapped_column(Text, nullable=True)
    optimization_improved: Mapped[str | None] = mapped_column(Text, nullable=True)
    optimization_explanation: Mapped[str | None] = mapped_column(Text, nullable=True)

    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    variations: Mapped[list[Variation]] = relationship(
        "Variation",
        back_populates="experiment",
        foreign_keys="Variation.experiment_id",
        cascade="all, delete-orphan",
        order_by="Variation.sort_order",
        overlaps="winner_variation",
    )
    winner_variation: Mapped[Variation | None] = relationship(
        "Variation",
        foreign_keys=[winner_variation_id],
        post_update=True,
        overlaps="variations",
    )


class Variation(Base):
    __tablename__ = "variations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    experiment_id: Mapped[int] = mapped_column(ForeignKey("experiments.id", ondelete="CASCADE"))
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    label: Mapped[str] = mapped_column(String(256), default="Variation")
    prompt_text: Mapped[str] = mapped_column(Text, default="")

    experiment: Mapped[Experiment] = relationship(
        "Experiment",
        back_populates="variations",
        foreign_keys=[experiment_id],
    )
    result: Mapped[VariationResult | None] = relationship(
        "VariationResult",
        back_populates="variation",
        uselist=False,
        cascade="all, delete-orphan",
    )


class VariationResult(Base):
    __tablename__ = "variation_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    variation_id: Mapped[int] = mapped_column(ForeignKey("variations.id", ondelete="CASCADE"), unique=True)

    response_text: Mapped[str] = mapped_column(Text, default="")
    clarity: Mapped[float] = mapped_column(Float, default=0.0)
    relevance: Mapped[float] = mapped_column(Float, default=0.0)
    depth: Mapped[float] = mapped_column(Float, default=0.0)
    creativity: Mapped[float] = mapped_column(Float, default=0.0)
    weighted_score: Mapped[float] = mapped_column(Float, default=0.0)
    strength_score: Mapped[float] = mapped_column(Float, default=0.0)

    eval_reasoning_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    bias_json: Mapped[str | None] = mapped_column(Text, nullable=True)

    variation: Mapped[Variation] = relationship("Variation", back_populates="result")
