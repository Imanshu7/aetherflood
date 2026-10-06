import os
import math
import io
import requests
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

# Bounds matching TRISHULI_AOI in trishuliGeoData.js
SOUTH = 27.900
NORTH = 28.220
WEST = 85.120
EAST = 85.390

ZOOM = 13  # Zoom 13 provides crisp high-resolution detail

def lat_lon_to_tile(lat, lon, zoom):
    lat_rad = math.radians(lat)
    n = 2.0 ** zoom
    x = int((lon + 180.0) / 360.0 * n)
    y = int((1.0 - math.asinh(math.tan(lat_rad)) / math.pi) / 2.0 * n)
    return x, y

def lat_lon_to_pixel(lat, lon, zoom):
    lat_rad = math.radians(lat)
    n = 2.0 ** zoom
    x = (lon + 180.0) / 360.0 * n * 256.0
    y = (1.0 - math.asinh(math.tan(lat_rad)) / math.pi) / 2.0 * n * 256.0
    return x, y

def geo_to_img_coords(lat, lon, min_px_x, min_px_y, total_w, total_h, max_px_x, max_px_y):
    # Map lat/lon directly into cropped image pixel dimensions
    u = (lon - WEST) / (EAST - WEST)
    v = (NORTH - lat) / (NORTH - SOUTH)
    px = int(u * total_w)
    py = int(v * total_h)
    return px, py

def main():
    out_dir = r"d:\iitp csda\iitmandi\frontend\public\satellite"
    os.makedirs(out_dir, exist_ok=True)

    print(f"Calculating tiles for Trishuli AOI: lat [{SOUTH}, {NORTH}], lon [{WEST}, {EAST}] at zoom {ZOOM}...")
    min_tile_x, min_tile_y = lat_lon_to_tile(NORTH, WEST, ZOOM)
    max_tile_x, max_tile_y = lat_lon_to_tile(SOUTH, EAST, ZOOM)

    tile_cols = (max_tile_x - min_tile_x + 1)
    tile_rows = (max_tile_y - min_tile_y + 1)
    print(f"Tile grid: x [{min_tile_x}..{max_tile_x}] ({tile_cols} cols), y [{min_tile_y}..{max_tile_y}] ({tile_rows} rows). Total {tile_cols * tile_rows} tiles.")

    stitched_w = tile_cols * 256
    stitched_h = tile_rows * 256
    stitched_img = Image.new("RGB", (stitched_w, stitched_h), (35, 45, 55))

    session = requests.Session()
    session.headers.update({"User-Agent": "AetherFlood-Copilot/1.0 (Emergency Response)"})

    for col_idx, tx in enumerate(range(min_tile_x, max_tile_x + 1)):
        for row_idx, ty in enumerate(range(min_tile_y, max_tile_y + 1)):
            url = f"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{ZOOM}/{ty}/{tx}"
            try:
                resp = session.get(url, timeout=12)
                if resp.status_code == 200:
                    tile_img = Image.open(io.BytesIO(resp.content)).convert("RGB")
                    stitched_img.paste(tile_img, (col_idx * 256, row_idx * 256))
                else:
                    print(f"Warning: Tile {tx},{ty} returned {resp.status_code}")
            except Exception as e:
                print(f"Error fetching tile {tx},{ty}: {e}")

    # Crop exactly to TRISHULI_AOI bounding box
    left_px, top_px = lat_lon_to_pixel(NORTH, WEST, ZOOM)
    right_px, bottom_px = lat_lon_to_pixel(SOUTH, EAST, ZOOM)

    crop_left = int(left_px - (min_tile_x * 256))
    crop_top = int(top_px - (min_tile_y * 256))
    crop_right = int(right_px - (min_tile_x * 256))
    crop_bottom = int(bottom_px - (min_tile_y * 256))

    base_optical = stitched_img.crop((crop_left, crop_top, crop_right, crop_bottom))
    w, h = base_optical.size
    print(f"Base satellite image cropped: {w}x{h} px")

    # Save 1: Sentinel-2 Optical Pre-Event (Pristine pre-flood scene)
    opt_pre_path = os.path.join(out_dir, "sentinel2_optical_pre.png")
    base_optical.save(opt_pre_path, quality=92)
    print(f"Saved: {opt_pre_path}")

    # Coordinates from trishuliGeoData.js
    inundation_coords = [
        [28.212, 85.375], [28.192, 85.358], [28.176, 85.342], [28.160, 85.326],
        [28.140, 85.302], [28.122, 85.282], [28.105, 85.270], [28.085, 85.245],
        [28.066, 85.230], [28.048, 85.218], [28.032, 85.200], [28.010, 85.184],
        [27.982, 85.172], [27.960, 85.166], [27.940, 85.158], [27.915, 85.152],
        [27.914, 85.164], [27.938, 85.174], [27.958, 85.182], [27.980, 85.192],
        [28.012, 85.204], [28.038, 85.225], [28.055, 85.242], [28.068, 85.255],
        [28.088, 85.272], [28.115, 85.302], [28.136, 85.320], [28.158, 85.342],
        [28.178, 85.360], [28.196, 85.375], [28.214, 85.385]
    ]

    river_thalweg = [
        [28.210, 85.380], [28.190, 85.365], [28.175, 85.350], [28.156, 85.334],
        [28.145, 85.322], [28.135, 85.310], [28.120, 85.295], [28.112, 85.289],
        [28.093, 85.260], [28.078, 85.250], [28.062, 85.241], [28.050, 85.228],
        [28.040, 85.210], [28.015, 85.195], [27.990, 85.188], [27.978, 85.184],
        [27.955, 85.176], [27.935, 85.168], [27.915, 85.158]
    ]

    # Convert coordinates to pixel polygons
    inundation_pixels = [
        geo_to_img_coords(pt[0], pt[1], crop_left, crop_top, w, h, crop_right, crop_bottom)
        for pt in inundation_coords
    ]
    thalweg_pixels = [
        geo_to_img_coords(pt[0], pt[1], crop_left, crop_top, w, h, crop_right, crop_bottom)
        for pt in river_thalweg
    ]

    # -------------------------------------------------------------
    # Save 2: Sentinel-2 Optical Post-Event (Muddy torrent, raw landslide scars, clouds)
    # -------------------------------------------------------------
    opt_post = base_optical.copy()
    
    # 1. Overlay muddy brown turbid floodwater and silt across inundation zone
    mud_overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    mud_draw = ImageDraw.Draw(mud_overlay)
    
    # Fill inundation corridor with turbid river mud color (Ochre-brown RGB 128, 98, 64)
    mud_draw.polygon(inundation_pixels, fill=(125, 96, 62, 210))
    
    # River center line carries heavy chocolate silt torrent
    for i in range(len(thalweg_pixels) - 1):
        mud_draw.line([thalweg_pixels[i], thalweg_pixels[i+1]], fill=(140, 105, 68, 240), width=16)

    # 2. Landslide scars at Ramche (28.062, 85.241) and Mailung (28.112, 85.289)
    ramche_px = geo_to_img_coords(28.062, 85.241, crop_left, crop_top, w, h, crop_right, crop_bottom)
    mailung_px = geo_to_img_coords(28.112, 85.289, crop_left, crop_top, w, h, crop_right, crop_bottom)
    
    # Ramche catastrophic slope failure scar (fan of pulverized rock & mud)
    rx, ry = ramche_px
    mud_draw.polygon([
        (rx - 25, ry - 75), (rx + 40, ry - 65), (rx + 65, ry + 15), 
        (rx + 20, ry + 50), (rx - 45, ry + 30), (rx - 55, ry - 30)
    ], fill=(168, 142, 108, 235))
    
    # Mailung slope failure scar
    mx, my = mailung_px
    mud_draw.polygon([
        (mx - 30, my - 60), (mx + 35, my - 50), (mx + 50, my + 25), 
        (mx + 10, ry + 40 if False else my + 45), (mx - 40, my + 20)
    ], fill=(162, 136, 102, 230))

    # Apply soft blur to blend debris edges naturally into terrain
    mud_overlay = mud_overlay.filter(ImageFilter.GaussianBlur(radius=2))
    opt_post.paste(Image.alpha_composite(opt_post.convert("RGBA"), mud_overlay).convert("RGB"), (0, 0))

    # 3. Monsoon cloud cover wisps (illustrating 85% cloud cover evaluated by SCL)
    cloud_overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    cloud_draw = ImageDraw.Draw(cloud_overlay)
    
    # Cloud clusters in upper gorges and eastern ridges
    for cx_ratio, cy_ratio, r in [(0.25, 0.25, 140), (0.75, 0.35, 190), (0.65, 0.70, 160), (0.35, 0.80, 120), (0.80, 0.85, 150)]:
        cx, cy = int(cx_ratio * w), int(cy_ratio * h)
        cloud_draw.ellipse([cx - r, cy - r*0.7, cx + r, cy + r*0.7], fill=(255, 255, 255, 135))
    
    cloud_overlay = cloud_overlay.filter(ImageFilter.GaussianBlur(radius=24))
    opt_post = Image.alpha_composite(opt_post.convert("RGBA"), cloud_overlay).convert("RGB")

    opt_post_path = os.path.join(out_dir, "sentinel2_optical_post.png")
    opt_post.save(opt_post_path, quality=92)
    print(f"Saved: {opt_post_path}")

    # -------------------------------------------------------------
    # Save 3: Sentinel-1 SAR Pre-Event (Radar backscatter: thin dark river, textured mountain relief)
    # -------------------------------------------------------------
    # Convert optical base to high-contrast radar backscatter
    # Radar is grayscale: mountain slopes facing radar are bright; flat water specularly reflects away (dark)
    sar_base = base_optical.convert("L")
    sar_enhancer = ImageEnhance.Contrast(sar_base)
    sar_base = sar_enhancer.enhance(1.4)
    sar_bright = ImageEnhance.Brightness(sar_base)
    sar_base = sar_bright.enhance(0.85)

    # Add realistic radar speckle noise (Gamma distributed / multiplicative speckle)
    sar_np = np.array(sar_base, dtype=np.float32)
    noise = np.random.gamma(shape=4.0, scale=0.25, size=sar_np.shape)
    sar_speckle = np.clip(sar_np * noise, 0, 255).astype(np.uint8)
    sar_pre = Image.fromarray(sar_speckle).convert("RGB")

    # Draw thin specular dark line for normal river (calm water bounces radar forward = pitch black)
    sar_draw = ImageDraw.Draw(sar_pre)
    for i in range(len(thalweg_pixels) - 1):
        sar_draw.line([thalweg_pixels[i], thalweg_pixels[i+1]], fill=(12, 14, 16), width=5)

    sar_pre_path = os.path.join(out_dir, "sentinel1_sar_pre.png")
    sar_pre.save(sar_pre_path, quality=92)
    print(f"Saved: {sar_pre_path}")

    # -------------------------------------------------------------
    # Save 4: Sentinel-1 SAR Post-Event (Massive backscatter drop on water + bright debris roughness)
    # -------------------------------------------------------------
    sar_post = sar_pre.copy()
    sar_post_overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    sar_post_draw = ImageDraw.Draw(sar_post_overlay)

    # 1. Calibrated Backscatter Drop (< -3.2 dB): Inundated water is PITCH BLACK (specular mirror)
    sar_post_draw.polygon(inundation_pixels, fill=(8, 10, 14, 235))

    # 2. Mud & Debris Deposits: High roughness cross-polarization (bright diffuse scatter)
    # Border along debris corridor edges and Ramche landslide fan has bright radar speckle
    for i in range(len(thalweg_pixels) - 1):
        sar_post_draw.line([thalweg_pixels[i], thalweg_pixels[i+1]], fill=(6, 8, 10, 255), width=18)

    # Bright rough debris fan at Ramche & Mailung (depolarizes radar signal = bright pixels)
    for pt in [ramche_px, mailung_px]:
        px, py = pt
        sar_post_draw.ellipse([px - 45, py - 35, px + 45, py + 35], fill=(215, 220, 225, 180))

    sar_post_overlay = sar_post_overlay.filter(ImageFilter.GaussianBlur(radius=1.5))
    sar_post.paste(Image.alpha_composite(sar_post.convert("RGBA"), sar_post_overlay).convert("RGB"), (0, 0))

    # Apply refined radar speckle across the flooded debris zone
    sar_post_np = np.array(sar_post.convert("L"), dtype=np.float32)
    post_noise = np.random.gamma(shape=4.0, scale=0.25, size=sar_post_np.shape)
    sar_post_speckle = np.clip(sar_post_np * post_noise, 0, 255).astype(np.uint8)
    sar_post = Image.fromarray(sar_post_speckle).convert("RGB")

    sar_post_path = os.path.join(out_dir, "sentinel1_sar_post.png")
    sar_post.save(sar_post_path, quality=92)
    print(f"Saved: {sar_post_path}")

    print("Successfully built all 4 georeferenced satellite layers!")

if __name__ == "__main__":
    main()
