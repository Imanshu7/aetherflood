import sys
import os

_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
_PARENT_DIR = os.path.dirname(_BACKEND_DIR)

for _dir in [_PARENT_DIR, _BACKEND_DIR]:
    if _dir not in sys.path:
        sys.path.insert(0, _dir)

if "backend" not in sys.modules:
    import types
    _pkg = types.ModuleType("backend")
    _pkg.__path__ = [_BACKEND_DIR]
    sys.modules["backend"] = _pkg

try:
    from backend.main import app
except ImportError:
    from main import app

__all__ = ["app"]
