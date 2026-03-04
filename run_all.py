import os
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent
BACKEND_DIR = ROOT / "backend"
FRONTEND_DIR = ROOT / "frontend"
VENV_PYTHON = BACKEND_DIR / ".venv" / "Scripts" / "python.exe"


def main() -> None:
    """
    Run FastAPI backend and React frontend together.

    - Assumes:
      - backend/.venv exists with dependencies installed
      - frontend node_modules installed (npm install)
    """
    backend_cmd = [
        str(VENV_PYTHON if VENV_PYTHON.exists() else sys.executable),
        "-m",
        "uvicorn",
        "app.main:app",
        "--reload",
        "--host",
        "0.0.0.0",
        "--port",
        "8000",
    ]

    # On Windows, npm is usually npm.cmd
    npm_exe = "npm.cmd" if os.name == "nt" else "npm"
    frontend_cmd = [npm_exe, "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]

    print("Starting backend:", " ".join(backend_cmd))
    backend_proc = subprocess.Popen(backend_cmd, cwd=str(BACKEND_DIR))

    print("Starting frontend:", " ".join(frontend_cmd))
    try:
        frontend_proc = subprocess.Popen(frontend_cmd, cwd=str(FRONTEND_DIR))
    except FileNotFoundError:
        print("Could not find npm. Please ensure Node.js/npm is installed and on PATH.")
        frontend_proc = None

    try:
        backend_proc.wait()
    except KeyboardInterrupt:
        print("\nShutting down processes...")
    finally:
        for proc in (backend_proc, frontend_proc):
            if proc and proc.poll() is None:
                proc.terminate()


if __name__ == "__main__":
    main()

