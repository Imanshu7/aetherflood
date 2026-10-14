"""
Copernicus Data Space Ecosystem (CDSE) Client
Strict Rule Implementation:
- Orbit Track Matching: SAR change detection MUST use identical relative orbit tracks (12-day repeat cycle)
  to ensure identical incidence angles and look direction.
"""

from typing import Dict, Any, List, Optional
import requests
import datetime
from urllib.parse import urlparse
from backend.config import EMS_PUBLIC_ACTIVATIONS_URL

class CopernicusService:
    def __init__(self):
        self.ems_activations_url = EMS_PUBLIC_ACTIVATIONS_URL

    def _get_ems_page(self, url: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        response = requests.get(url, params=params, timeout=(5, 30))
        response.raise_for_status()
        if urlparse(response.url).hostname != "mapping.emergency.copernicus.eu":
            raise ValueError("Copernicus EMS redirected the request outside its public API.")
        payload = response.json()
        if not isinstance(payload, dict) or not isinstance(payload.get("results"), list):
            raise ValueError("Copernicus EMS returned an unexpected activation response.")
        return payload

    def list_ems_activations(self) -> Dict[str, Any]:
        """Retrieve public activations, following only same-origin API pagination."""
        url = self.ems_activations_url
        params: Optional[Dict[str, Any]] = {"code": "", "limit": 50}
        activations: List[Dict[str, Any]] = []
        total = 0
        pagination_warning = None
        pages = 0

        while url and pages < 20:
            parsed_url = urlparse(url)
            if (
                parsed_url.hostname != "mapping.emergency.copernicus.eu"
                or not parsed_url.path.startswith("/backend/dashboard-api/public-activations/")
            ):
                raise ValueError("Copernicus EMS returned an unsafe pagination URL.")

            try:
                payload = self._get_ems_page(url, params)
            except (requests.RequestException, ValueError) as exc:
                if not activations:
                    raise
                pagination_warning = (
                    f"Activation catalogue pagination stopped after {len(activations)} "
                    f"records because the upstream page could not be retrieved ({exc})."
                )
                break

            pages += 1
            total = payload.get("count", total)
            activations.extend(payload["results"])
            url = payload.get("next")
            params = None

        if url and not pagination_warning:
            pagination_warning = "Activation catalogue pagination exceeded the safety limit."

        deduplicated = {
            item["code"]: item
            for item in activations
            if isinstance(item, dict) and isinstance(item.get("code"), str)
        }
        return {
            "total": total,
            "activations": list(deduplicated.values()),
            "complete": len(deduplicated) >= total,
            "warning": pagination_warning,
            "retrieved_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        }

    def get_ems_activation(self, code: str) -> List[Dict[str, Any]]:
        payload = self._get_ems_page(self.ems_activations_url, {"code": code})
        return payload["results"]

copernicus_service = CopernicusService()
