"""Simple in-memory job store for async chat jobs.

This is intentionally lightweight and process-local. If you scale tasks>1,
move to Redis/DB and use distributed locks.
"""
from __future__ import annotations

import threading
import time
from typing import Any, Dict, Optional


class JobStore:
    def __init__(self) -> None:
        self._jobs: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.Lock()

    def create_job(self, job_id: str) -> None:
        with self._lock:
            self._jobs[job_id] = {
                "status": "pending",
                "result": None,
                "error": None,
                "created_at": time.time(),
            }

    def set_job_result(self, job_id: str, result: Any) -> None:
        with self._lock:
            if job_id in self._jobs:
                self._jobs[job_id]["status"] = "succeeded"
                self._jobs[job_id]["result"] = result

    def set_job_running(self, job_id: str) -> None:
        with self._lock:
            if job_id in self._jobs:
                self._jobs[job_id]["status"] = "running"

    def set_job_error(self, job_id: str, error: str) -> None:
        with self._lock:
            if job_id in self._jobs:
                self._jobs[job_id]["status"] = "failed"
                self._jobs[job_id]["error"] = error

    def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            job = self._jobs.get(job_id)
            if not job:
                return None

            # auto-expire stuck pending jobs after 120s
            if job["status"] == "pending":
                created = job.get("created_at", 0)
                if time.time() - created > 120:
                    job["status"] = "failed"
                    job["error"] = "Job expired after waiting too long."

            return job


job_store = JobStore()
