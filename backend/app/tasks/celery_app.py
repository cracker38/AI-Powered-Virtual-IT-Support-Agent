from __future__ import annotations

import os

from celery import Celery

from ..config import get_settings


settings = get_settings()

broker_url = settings.celery_broker_url or f"redis://{settings.redis_host}:{settings.redis_port}/1"
result_backend = settings.celery_result_backend or broker_url

celery_app = Celery(
    "cypadi_virtual_it_support",
    broker=broker_url,
    backend=result_backend,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)


@celery_app.task(name="workflows.execute")
def execute_workflow(workflow_name: str, payload: dict) -> dict:  # pragma: no cover - integration stub
    # This is a stub. In production, delegate to workflows.engine.WorkflowEngine.
    return {"workflow": workflow_name, "status": "SUCCESS", "payload": payload}

