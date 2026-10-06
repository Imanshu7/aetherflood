"""
Single-Command Project Runner for AetherFlood Copilot
Launches both the FastAPI backend and Vite frontend concurrently.
Handles graceful shutdown on Ctrl+C.
Automatically cleans up occupied ports (8000, 5173) before launch to prevent [Errno 10048].
"""

import sys
import os
import subprocess
import signal
import time
import threading

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(ROOT_DIR, "frontend")

processes = []

def free_port(port):
    """
    Checks if a port is in use and terminates the occupying process to prevent [Errno 10048].
    """
    if sys.platform == "win32":
        try:
            output = subprocess.check_output(f'netstat -ano | findstr :{port}', shell=True, text=True, stderr=subprocess.DEVNULL)
            for line in output.strip().splitlines():
                parts = line.split()
                if len(parts) >= 5 and "LISTENING" in line:
                    pid = parts[-1]
                    if pid.isdigit() and int(pid) != os.getpid() and int(pid) != 0:
                        print(f"[*] Releasing port {port} (Terminating stale PID {pid})...")
                        subprocess.call(f'taskkill /F /T /PID {pid}', shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                        time.sleep(0.5)
        except Exception:
            pass

def stream_output(pipe, prefix, color_code):
    try:
        for line in iter(pipe.readline, ''):
            if not line:
                break
            sys.stdout.write(f"\033[{color_code}m{prefix}\033[0m {line}")
            sys.stdout.flush()
    except Exception:
        pass
    finally:
        pipe.close()

def shutdown(signum=None, frame=None):
    print("\n\033[1;33m[SHUTDOWN] Terminating backend and frontend services...\033[0m")
    for p in processes:
        if p and p.poll() is None:
            try:
                if sys.platform == "win32":
                    subprocess.call(['taskkill', '/F', '/T', '/PID', str(p.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                else:
                    p.terminate()
            except Exception:
                pass
    sys.exit(0)

def main():
    signal.signal(signal.SIGINT, shutdown)
    if hasattr(signal, "SIGTERM"):
        signal.signal(signal.SIGTERM, shutdown)

    print("\033[1;32m====================================================\033[0m")
    print("\033[1;32m       AETHERFLOOD COPILOT - UNIFIED LAUNCHER       \033[0m")
    print("\033[1;32m====================================================\033[0m")
    print(f"[*] Root Directory: {ROOT_DIR}")
    print(f"[*] Backend:        http://127.0.0.1:8000")
    print(f"[*] Frontend:       http://localhost:5173")
    print("[*] Press Ctrl+C at any time to stop all services.\n")

    # Clean up any stale processes holding port 8000 or 5173
    free_port(8000)
    free_port(5173)

    # 1. Start FastAPI Backend
    backend_cmd = [sys.executable, "-m", "uvicorn", "backend.main:app", "--host", "127.0.0.1", "--port", "8000"]
    backend_proc = subprocess.Popen(
        backend_cmd,
        cwd=ROOT_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )
    processes.append(backend_proc)

    t_backend = threading.Thread(target=stream_output, args=(backend_proc.stdout, "[BACKEND]", "36"), daemon=True)
    t_backend.start()

    # 2. Start Vite Frontend
    npm_bin = "npm.cmd" if sys.platform == "win32" else "npm"
    frontend_cmd = [npm_bin, "run", "dev"]
    frontend_proc = subprocess.Popen(
        frontend_cmd,
        cwd=FRONTEND_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )
    processes.append(frontend_proc)

    t_frontend = threading.Thread(target=stream_output, args=(frontend_proc.stdout, "[FRONTEND]", "35"), daemon=True)
    t_frontend.start()

    # Keep alive until interrupt or any process dies
    try:
        while True:
            time.sleep(1)
            if backend_proc.poll() is not None:
                print("\n\033[1;31m[ERROR] Backend process terminated unexpectedly.\033[0m")
                shutdown()
            if frontend_proc.poll() is not None:
                print("\n\033[1;31m[ERROR] Frontend process terminated unexpectedly.\033[0m")
                shutdown()
    except KeyboardInterrupt:
        shutdown()

if __name__ == "__main__":
    main()
