import sys
import os

_ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_BACKEND_DIR = os.path.join(_ROOT_DIR, "backend")

for _dir in [_ROOT_DIR, _BACKEND_DIR]:
    if _dir not in sys.path:
        sys.path.insert(0, _dir)

from backend.main import app

__all__ = ["app"]
