"""
Elevation-based downstream path tracing on public Terrarium tiles.

Source: AWS Terrain Tiles (elevation-tiles-prod, Terrarium encoding), public
access without credentials. Tile elevations derive from SRTM/ETOPO-class
public DEMs — this is NOT Copernicus WorldDEM-30, and results are labelled
as terrain-derived potential flow paths, never as hydraulic flood simulation
or measured flood extent.
"""

import io
import math
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import requests
from PIL import Image

TILE_URL = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"
TIMEOUT = (10, 60)
MAX_TILES = 16
MAX_STEPS = 3000
MIN_SLOPE = 0.0005  # stop when descent flattens below ~0.05%


def lonlat_to_tile(lon: float, lat: float, z: int) -> Tuple[int, int]:
    n = 2 ** z
    xtile = int((lon + 180.0) / 360.0 * n)
    lat_r = math.radians(max(min(lat, 85.0511), -85.0511))
    ytile = int(((1.0 - math.log(math.tan(lat_r) + 1.0 / math.cos(lat_r)) / math.pi) / 2.0) * n)
    return xtile, ytile


def tile_bounds(x: int, y: int, z: int) -> Tuple[float, float, float, float]:
    """Return (west, south, east, north) in degrees."""
    n = 2 ** z

    def tx2lon(v: int) -> float:
        return v / n * 360.0 - 180.0

    def ty2lat(v: int) -> float:
        return math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * v / n))))

    return tx2lon(x), ty2lat(y + 1), tx2lon(x + 1), ty2lat(y)


def _download_tile(z: int, x: int, y: int) -> np.ndarray:
    url = TILE_URL.format(z=z, x=x, y=y)
    response = requests.get(url, timeout=TIMEOUT)
    response.raise_for_status()
    image = Image.open(io.BytesIO(response.content)).convert("RGB")
    arr = np.asarray(image).astype(np.float64)
    return arr[:, :, 0] * 256.0 + arr[:, :, 1] + arr[:, :, 2] / 256.0 - 32768.0


def build_grid(bbox: List[float], z: int = 12) -> Dict[str, Any]:
    min_lon, min_lat, max_lon, max_lat = bbox
    x0, y0 = lonlat_to_tile(min_lon, max_lat, z)  # NW corner tile
    x1, y1 = lonlat_to_tile(max_lon, min_lat, z)  # SE corner tile
    if (x1 - x0 + 1) * (y1 - y0 + 1) > MAX_TILES:
        raise ValueError(
            f"AOI needs {(x1 - x0 + 1) * (y1 - y0 + 1)} elevation tiles; "
            f"maximum is {MAX_TILES}. Shrink the AOI or trace a smaller area."
        )
    rows = []
    for y in range(y0, y1 + 1):
        row = np.hstack([_download_tile(z, x, y) for x in range(x0, x1 + 1)])
        rows.append(row)
    grid = np.vstack(rows)
    west, south, east, north = tile_bounds(x0, y0, z)[0], tile_bounds(x0, y1, z)[1], \
        tile_bounds(x1, y0, z)[2], tile_bounds(x0, y0, z)[3]
    return {
        "grid": grid,
        "bounds": [west, south, east, north],
        "z": z,
        "tiles": [[x, y] for y in range(y0, y1 + 1) for x in range(x0, x1 + 1)],
    }


def trace_downstream(
    grid: np.ndarray, bounds: List[float], start_lat: float, start_lon: float
) -> Dict[str, Any]:
    """D8 steepest-descent trace. Returns path + statistics."""
    west, south, east, north = bounds
    nrows, ncols = grid.shape
    col = int((start_lon - west) / (east - west) * ncols)
    row = int((north - start_lat) / (north - south) * nrows)
    col = max(1, min(ncols - 2, col))
    row = max(1, min(nrows - 2, row))

    mean_lat = math.radians((north + south) / 2)
    cell_x_m = (east - west) / ncols * 111320.0 * math.cos(mean_lat)
    cell_y_m = (north - south) / nrows * 110540.0

    path = [(row, col)]
    r, c = row, col
    for _ in range(MAX_STEPS):
        elev = float(grid[r, c])
        best = None
        for dr in (-1, 0, 1):
            for dc in (-1, 0, 1):
                if dr == 0 and dc == 0:
                    continue
                nr, nc = r + dr, c + dc
                if not (0 <= nr < nrows and 0 <= nc < ncols):
                    continue
                dist = math.hypot(dr * cell_y_m, dc * cell_x_m)
                slope = (elev - float(grid[nr, nc])) / dist
                if best is None or slope > best[0]:
                    best = (slope, nr, nc)
        if best is None or best[0] < MIN_SLOPE:
            break
        r, c = best[1], best[2]
        path.append((r, c))
        if r in (0, nrows - 1) or c in (0, ncols - 1):
            break

    coords = []
    length_m = 0.0
    prev = None
    for r, c in path:
        lon = west + (c + 0.5) / ncols * (east - west)
        lat = north - (r + 0.5) / nrows * (north - south)
        coords.append([lat, lon])
        if prev is not None:
            dlat = math.radians(lat - prev[0])
            dlon = math.radians(lon - prev[1])
            a = (math.sin(dlat / 2) ** 2
                 + math.cos(math.radians(prev[0])) * math.cos(math.radians(lat))
                 * math.sin(dlon / 2) ** 2)
            length_m += 2 * 6371000.0 * math.asin(math.sqrt(a))
        prev = (lat, lon)

    start_elev = float(grid[path[0][0], path[0][1]])
    end_elev = float(grid[path[-1][0], path[-1][1]])
    return {
        "path_coordinates": [[round(lat, 5), round(lon, 5)] for lat, lon in coords],
        "points": len(coords),
        "length_km": round(length_m / 1000.0, 2),
        "start_elevation_m": round(start_elev, 1),
        "end_elevation_m": round(end_elev, 1),
        "drop_m": round(start_elev - end_elev, 1),
        "reached_edge": path[-1][0] in (0, nrows - 1) or path[-1][1] in (0, ncols - 1),
        "cell_size_m": [round(cell_x_m, 1), round(cell_y_m, 1)],
    }
