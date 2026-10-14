"""AetherFlood Backend Package."""
import os
import sys

_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
_PARENT_DIR = os.path.dirname(_BACKEND_DIR)
for _dir in [_PARENT_DIR, _BACKEND_DIR]:
    if _dir not in sys.path:
        sys.path.insert(0, _dir)
