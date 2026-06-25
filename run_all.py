import os
import subprocess
import sys
import time
from pathlib import Path


ROOT = Path(__file__).resolve().parent
BACKEND_DIR = ROOT / "backend"
FRONTEND_DIR = ROOT / "frontend"


def run_backend():
    # Uses the same Python interpreter that runs this script
    cmd = [sys.executable, "-m", "uvicorn", "backend.app.main:app", "--reload", "--port", "8000"]
    return subprocess.Popen(cmd, cwd=ROOT)


def run_frontend():
    # Assumes Node.js and npm are installed and available in PATH
    cmd = ["npm", "run", "dev", "--", "--port", "5173"]
    return subprocess.Popen(cmd, cwd=FRONTEND_DIR, shell=os.name == "nt")


def main() -> None:
    print("Starting AI IT Support Agent stack...")
    print(f"Project root: {ROOT}")

    backend_proc = None
    frontend_proc = None

    try:
        if not BACKEND_DIR.exists():
            print("ERROR: backend directory not found.")
            return
        if not FRONTEND_DIR.exists():
            print("ERROR: frontend directory not found.")
            return

        print("Starting backend (FastAPI + Uvicorn) on http://localhost:8000 ...")
        backend_proc = run_backend()

        # Give backend a moment to start
        time.sleep(2)

        print("Starting frontend (React + Vite) on http://localhost:5173 ...")
        frontend_proc = run_frontend()

        print("\nBoth backend and frontend are starting.")
        print("You can open the app in your browser after Vite prints the local URL.")
        print("Press Ctrl+C to stop everything.\n")

        # Wait until user interrupts
        while True:
            time.sleep(1)
            # If either process exits unexpectedly, stop the other
            if backend_proc.poll() is not None:
                print("Backend process exited. Stopping frontend...")
                break
            if frontend_proc.poll() is not None:
                print("Frontend process exited. Stopping backend...")
                break

    except KeyboardInterrupt:
        print("\nReceived Ctrl+C. Shutting down...")
    finally:
        for proc in (backend_proc, frontend_proc):
            if proc and proc.poll() is None:
                try:
                    proc.terminate()
                except Exception:
                    pass


if __name__ == "__main__":
    main()

