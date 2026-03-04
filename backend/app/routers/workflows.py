from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..services.analytics_service import log_event


router = APIRouter(prefix="/workflows", tags=["workflows"])


def get_current_user(db: Session = Depends(get_db)) -> models.User:
    user = db.query(models.User).filter(models.User.username == "demo.user").first()
    if not user:
        user = models.User(username="demo.user", email="demo@example.com")
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


def _create_workflow_if_missing(db: Session, name: str, description: str) -> models.Workflow:
    wf = db.query(models.Workflow).filter(models.Workflow.name == name).first()
    if not wf:
        wf = models.Workflow(name=name, description=description, is_active=True)
        db.add(wf)
        db.commit()
        db.refresh(wf)
    return wf


def _record_workflow_event(
    db: Session,
    *,
    run: models.WorkflowRun,
    kind: str,
) -> None:
    log_event(
        db,
        "WORKFLOW_EXECUTED",
        user_id=run.initiated_by_user_id,
        conversation_id=run.conversation_id,
        metadata={
            "workflow_name": kind,
            "workflow_run_id": run.id,
            "status": run.status.value if hasattr(run.status, "value") else str(run.status),
        },
    )


@router.post("/password-reset", response_model=schemas.WorkflowRunRead)
def password_reset(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> schemas.WorkflowRunRead:
    wf = _create_workflow_if_missing(
        db, "password_reset_ad", "Reset Active Directory password"
    )

    run = models.WorkflowRun(
        workflow_id=wf.id,
        conversation_id=conversation_id,
        initiated_by_user_id=current_user.id,
        status=models.WorkflowStatus.SUCCESS,
        input_payload_json={"conversation_id": conversation_id},
        output_payload_json={
            "message": "Password reset workflow stub executed. Integrate with AD here."
        },
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    _record_workflow_event(db, run=run, kind="password_reset_ad")

    return schemas.WorkflowRunRead.model_validate(run)


@router.post("/account-unlock", response_model=schemas.WorkflowRunRead)
def account_unlock(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> schemas.WorkflowRunRead:
    wf = _create_workflow_if_missing(
        db, "account_unlock_ad", "Unlock Active Directory account"
    )

    run = models.WorkflowRun(
        workflow_id=wf.id,
        conversation_id=conversation_id,
        initiated_by_user_id=current_user.id,
        status=models.WorkflowStatus.SUCCESS,
        input_payload_json={"conversation_id": conversation_id},
        output_payload_json={
            "message": "Account unlock workflow stub executed. Integrate with AD here."
        },
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    _record_workflow_event(db, run=run, kind="account_unlock_ad")

    return schemas.WorkflowRunRead.model_validate(run)


@router.post("/connectivity-diagnostics", response_model=schemas.WorkflowRunRead)
def connectivity_diagnostics(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> schemas.WorkflowRunRead:
    wf = _create_workflow_if_missing(
        db, "connectivity_diagnostics", "Run connectivity diagnostics via monitoring tools"
    )

    run = models.WorkflowRun(
        workflow_id=wf.id,
        conversation_id=conversation_id,
        initiated_by_user_id=current_user.id,
        status=models.WorkflowStatus.SUCCESS,
        input_payload_json={"conversation_id": conversation_id},
        output_payload_json={
            "message": "Connectivity diagnostics workflow stub executed. Integrate with monitoring here."
        },
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    _record_workflow_event(db, run=run, kind="connectivity_diagnostics")

    return schemas.WorkflowRunRead.model_validate(run)

