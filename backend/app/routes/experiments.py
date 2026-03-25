from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session, joinedload, selectinload

from app.config import get_settings
from app.database import get_db
from app.models.experiment import Experiment, Variation
from app.schemas.api import ExperimentCreate, ExperimentDetail, ExperimentListItem, ExperimentRunResponse
from app.serialization import experiment_to_detail, experiment_to_list_item
from app.services.experiment_runner import RunContext, build_experiment_record, run_experiment_async

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/run", response_model=ExperimentRunResponse)
async def run_experiment(
    body: ExperimentCreate,
    db: Session = Depends(get_db),
) -> ExperimentRunResponse:
    settings = get_settings()
    if not settings.openrouter_api_key:
        raise HTTPException(
            status_code=400,
            detail="OPENROUTER_API_KEY is not configured on the server.",
        )
    provider = body.provider
    model = (body.model or "").strip() or settings.default_model

    variation_inputs: list[tuple[str, str]] = [("Base", body.base_prompt.strip())]
    for i, v in enumerate(body.variations):
        variation_inputs.append((v.label.strip() or f"Variation {i + 1}", v.prompt_text.strip()))

    ex = build_experiment_record(
        db,
        title=body.title,
        base_prompt=body.base_prompt.strip(),
        variation_inputs=variation_inputs,
        weights=body.weights,
        provider=provider,
        model_name=model,
    )

    db.expire_all()
    ex_loaded = (
        db.query(Experiment)
        .options(joinedload(Experiment.variations))
        .filter(Experiment.id == ex.id)
        .one()
    )

    try:
        return await run_experiment_async(RunContext(db=db, experiment=ex_loaded, weights=body.weights))
    except Exception as e:  # noqa: BLE001
        logger.exception("Experiment run failed")
        ex_loaded.status = "failed"
        ex_loaded.error_message = str(e)
        db.commit()
        raise HTTPException(status_code=502, detail=f"AI pipeline failed: {e}") from e


@router.get("", response_model=list[ExperimentListItem])
def list_experiments(db: Session = Depends(get_db)) -> list[ExperimentListItem]:
    rows = (
        db.query(Experiment)
        .options(selectinload(Experiment.variations))
        .order_by(Experiment.created_at.desc())
        .limit(200)
        .all()
    )
    return [experiment_to_list_item(r) for r in rows]


@router.get("/{experiment_id}", response_model=ExperimentDetail)
def get_experiment(experiment_id: int, db: Session = Depends(get_db)) -> ExperimentDetail:
    ex = (
        db.query(Experiment)
        .options(joinedload(Experiment.variations).joinedload(Variation.result))
        .filter(Experiment.id == experiment_id)
        .one_or_none()
    )
    if ex is None:
        raise HTTPException(status_code=404, detail="Experiment not found")
    return experiment_to_detail(ex)


@router.delete("/{experiment_id}", status_code=204, response_class=Response)
def delete_experiment(experiment_id: int, db: Session = Depends(get_db)) -> Response:
    ex = db.query(Experiment).filter(Experiment.id == experiment_id).one_or_none()
    if ex is None:
        raise HTTPException(status_code=404, detail="Experiment not found")
    db.delete(ex)
    db.commit()
    return Response(status_code=204)
