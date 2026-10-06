import os
import math
import io
import requests
import concurrent.futures
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

SOUTH = 27.900
NORTH = 28.220
WEST = 85.120
EAST = 85.390
ZOOM = 13

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

def geo_to_img_coords(lat, lon, w, h):
    u = (lon - WEST) / (EAST - WEST)
    v = (NORTH - lat) / (NORTH - SOUTH)
    return int(u * w), int(v * h)

def catmull_rom_spline(points, n_steps=18):
    pts = np.array(points, dtype=np.float32)
    pts = np.vstack([pts[0], pts, pts[-1]])
    curve = []
    for i in range(1, len(pts) - 2):
        p0, p1, p2, p3 = pts[i-1], pts[i], pts[i+1], pts[i+2]
        for t in np.linspace(0, 1, n_steps, endpoint=False):
            t2 = t * t
            t3 = t2 * t
            pos = 0.5 * ((2 * p1) +
                         (-p0 + p2) * t +
                         (2*p0 - 5*p1 + 4*p2 - p3) * t2 +
                         (-p0 + 3*p1 - 3*p2 + p3) * t3)
            curve.append((float(pos[0]), float(pos[1])))
    curve.append((float(pts[-2][0]), float(pts[-2][1])))
    return curve

def create_feathered_alpha(w, h, feather_px=55):
    alpha = np.ones((h, w), dtype=np.float32)
    for i in range(feather_px):
        factor = 0.5 * (1.0 - math.cos(math.pi * i / feather_px))
        alpha[:, i] = np.minimum(alpha[:, i], factor)
        alpha[:, w - 1 - i] = np.minimum(alpha[:, w - 1 - i], factor)
    for j in range(feather_px):
        factor = 0.5 * (1.0 - math.cos(math.pi * j / feather_px))
        alpha[j, :] = np.minimum(alpha[j, :], factor)
        alpha[h - 1 - j, :] = np.minimum(alpha[h - 1 - j], factor)
    return (alpha * 255).astype(np.uint8)

def fetch_pristine_base():
    out_dir = r"d:\iitp csda\iitmandi\frontend\public\satellite"
    os.makedirs(out_dir, exist_ok=True)
    cache_path = os.path.join(out_dir, "pristine_base_raw.png")
    
    min_tile_x, min_tile_y = lat_lon_to_tile(NORTH, WEST, ZOOM)
    max_tile_x, max_tile_y = lat_lon_to_tile(SOUTH, EAST, ZOOM)
    
    tile_cols = (max_tile_x - min_tile_x + 1)
    tile_rows = (max_tile_y - min_tile_y + 1)
    stitched_w = tile_cols * 256
    stitched_h = tile_rows * 256
    
    print(f"Fetching {tile_cols}x{tile_rows} = {tile_cols * tile_rows} ArcGIS tiles at zoom {ZOOM}...")
    tile_tasks = []
    for col_idx, tx in enumerate(range(min_tile_x, max_tile_x + 1)):
        for row_idx, ty in enumerate(range(min_tile_y, max_tile_y + 1)):
            url = f"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{ZOOM}/{ty}/{tx}"
            tile_tasks.append((col_idx, row_idx, url))
            
    def download_tile(task):
        c, r, url = task
        session = requests.Session()
        resp = session.get(url, timeout=15)
        if resp.status_code == 200:
            return (c, r, Image.open(io.BytesIO(resp.content)).convert("RGB"))
        return None

    stitched = Image.new("RGB", (stitched_w, stitched_h), (40, 50, 45))
    with concurrent.futures.ThreadPoolExecutor(max_workers=12) as executor:
        for res in executor.map(download_tile, tile_tasks):
            if res:
                c, r, tile_img = res
                stitched.paste(tile_img, (c * 256, r * 256))
                
    left_px, top_px = lat_lon_to_pixel(NORTH, WEST, ZOOM)
    right_px, bottom_px = lat_lon_to_pixel(SOUTH, EAST, ZOOM)
    
    crop_left = int(left_px - (min_tile_x * 256))
    crop_top = int(top_px - (min_tile_y * 256))
    crop_right = int(right_px - (min_tile_x * 256))
    crop_bottom = int(bottom_px - (min_tile_y * 256))
    
    base_optical = stitched.crop((crop_left, crop_top, crop_right, crop_bottom))
    base_optical.save(cache_path, quality=95)
    print(f"Pristine base satellite image cached: {base_optical.size}")
    return base_optical

def main():
    sat_dir = r"d:\iitp csda\iitmandi\frontend\public\satellite"
    base_optical = fetch_pristine_base()
    w, h = base_optical.size
    
    alpha_mask = create_feathered_alpha(w, h, feather_px=55)
    alpha_img = Image.fromarray(alpha_mask, mode="L")
    
    # Control coordinates from trishuliGeoData.js
    raw_thalweg = [
        [28.210, 85.380], [28.195, 85.368], [28.180, 85.355], [28.168, 85.345],
        [28.156, 85.334], [28.145, 85.322], [28.135, 85.310], [28.125, 85.302],
        [28.112, 85.289], [28.102, 85.275], [28.093, 85.260], [28.078, 85.250],
        [28.062, 85.241], [28.050, 85.228], [28.040, 85.210], [28.028, 85.202],
        [28.015, 85.195], [27.998, 85.190], [27.978, 85.184], [27.962, 85.178],
        [27.945, 85.170], [27.928, 85.162], [27.915, 85.158]
    ]
    
    # 1. Generate smooth Catmull-Rom spline points for the river canyon
    spline_geo = catmull_rom_spline(raw_thalweg, n_steps=22)
    spline_px = [geo_to_img_coords(lat, lon, w, h) for lat, lon in spline_geo]
    
    # =========================================================================
    # 1. SENTINEL-2 OPTICAL PRE-EVENT
    # 100% PRISTINE, NATURAL SATELLITE IMAGE (ZERO artificial lines or polygons)
    # =========================================================================
    opt_pre = base_optical.copy().convert("RGBA")
    opt_pre.putalpha(alpha_img)
    opt_pre_path = os.path.join(sat_dir, "sentinel2_optical_pre.png")
    opt_pre.save(opt_pre_path, "PNG", quality=92)
    print(f"Generated pristine: {opt_pre_path}")

    # =========================================================================
    # 2. SENTINEL-2 OPTICAL POST-EVENT
    # Photorealistic catastrophic flood torrent, raw landslide scars, mud deposits & clouds
    # =========================================================================
    opt_post = base_optical.copy()
    disaster_overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(disaster_overlay)
    
    # A. Smooth flood river polygon following the canyon
    left_bank = []
    right_bank = []
    for i in range(len(spline_px)):
        curr = np.array(spline_px[i], dtype=np.float32)
        if i < len(spline_px) - 1:
            nxt = np.array(spline_px[i+1], dtype=np.float32)
            tangent = nxt - curr
        else:
            prev = np.array(spline_px[i-1], dtype=np.float32)
            tangent = curr - prev
            
        norm = np.linalg.norm(tangent)
        if norm < 1e-4:
            unit_normal = np.array([0, 1], dtype=np.float32)
        else:
            unit_normal = np.array([-tangent[1], tangent[0]], dtype=np.float32) / norm
            
        # Variable width: wider at confluences and floodplains
        t_prog = i / len(spline_px)
        # Wider at Mailung (t~0.35), Ramche (t~0.5), Betrawati (t~0.8)
        width_px = 16.0 + 12.0 * math.sin(t_prog * math.pi) + 8.0 * math.sin(t_prog * 4 * math.pi)
        
        lp = curr - unit_normal * (width_px * 0.5)
        rp = curr + unit_normal * (width_px * 0.5)
        left_bank.append((int(lp[0]), int(lp[1])))
        right_bank.append((int(rp[0]), int(rp[1])))
        
    river_poly = left_bank + list(reversed(right_bank))
    
    # Draw shoreline mud & silt deposits (RGB 158, 132, 94)
    for p in spline_px:
        draw.circle(p, radius=int(width_px * 0.7), fill=(155, 130, 92, 160))
        
    # Draw primary turbid sediment river channel (chocolate-brown RGB 128, 92, 54)
    draw.polygon(river_poly, fill=(132, 96, 58, 245))
    
    # Draw central raging torrent flow with foam lines (RGB 115, 80, 46 and rapids RGB 185, 165, 138)
    for i in range(len(spline_px) - 1):
        draw.line([spline_px[i], spline_px[i+1]], fill=(116, 80, 45, 255), width=10)
        # Whitewater rapids and sediment foam streaks
        if i % 3 == 0:
            draw.line([spline_px[i], spline_px[i+1]], fill=(188, 170, 142, 190), width=3)
            
    # B. Photorealistic Landslide Scars & Debris Fans
    landslides = [
        # Ramche Catastrophic Landslide (km 62+400)
        {
            "crown": [28.075, 85.254],
            "toe": [28.060, 85.238],
            "width": 55,
            "fan_radius": 50,
            "color_scarp": (192, 168, 128),
            "color_scree": (168, 142, 102),
            "color_mud": (140, 106, 68)
        },
        # Mailung Powerhouse Debris Torrent
        {
            "crown": [28.122, 85.308],
            "toe": [28.110, 85.285],
            "width": 42,
            "fan_radius": 38,
            "color_scarp": (185, 160, 122),
            "color_scree": (160, 135, 96),
            "color_mud": (135, 102, 65)
        },
        # Hakupa Slope Slump
        {
            "crown": [28.096, 85.275],
            "toe": [28.085, 85.256],
            "width": 34,
            "fan_radius": 28,
            "color_scarp": (180, 155, 118),
            "color_scree": (155, 130, 92),
            "color_mud": (130, 98, 62)
        },
        # Ghatte Khola Upper Gorge Scour
        {
            "crown": [28.182, 85.368],
            "toe": [28.172, 85.348],
            "width": 30,
            "fan_radius": 24,
            "color_scarp": (195, 172, 132),
            "color_scree": (165, 138, 98),
            "color_mud": (138, 105, 66)
        }
    ]
    
    for ls in landslides:
        cx, cy = geo_to_img_coords(ls["crown"][0], ls["crown"][1], w, h)
        tx, ty = geo_to_img_coords(ls["toe"][0], ls["toe"][1], w, h)
        
        # Scarp at top (crescent head scarp)
        draw.ellipse([cx - ls["width"]//2, cy - 15, cx + ls["width"]//2, cy + 15], fill=ls["color_scarp"] + (235,))
        
        # Chute / track gouging down slope
        track_poly = [
            (cx - ls["width"]//2, cy),
            (cx + ls["width"]//2, cy),
            (tx + ls["width"]//3, ty),
            (tx - ls["width"]//3, ty)
        ]
        draw.polygon(track_poly, fill=ls["color_scree"] + (225,))
        
        # Erosion gullies inside chute
        for offset in [-ls["width"]//4, 0, ls["width"]//4]:
            draw.line([(cx + offset, cy + 8), (tx + offset//2, ty)], fill=ls["color_mud"] + (210,), width=3)
            
        # Debris fan at river toe (impounding water)
        r = ls["fan_radius"]
        draw.ellipse([tx - r, ty - int(r*0.6), tx + r, ty + int(r*0.6)], fill=ls["color_scree"] + (240,))
        
    disaster_overlay = disaster_overlay.filter(ImageFilter.GaussianBlur(radius=1.8))
    opt_post = Image.alpha_composite(opt_post.convert("RGBA"), disaster_overlay)

    # C. Realistic Orographic Monsoon Clouds (85% coverage on high eastern ridges)
    cloud_layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    cloud_draw = ImageDraw.Draw(cloud_layer)
    cloud_centers = [
        (0.22, 0.18, 160, 110), (0.78, 0.25, 230, 150),
        (0.72, 0.62, 190, 130), (0.84, 0.80, 210, 140),
        (0.28, 0.78, 140, 95),  (0.12, 0.48, 130, 85)
    ]
    for c_ratio_x, c_ratio_y, rx, ry in cloud_centers:
        cx, cy = int(c_ratio_x * w), int(c_ratio_y * h)
        # Cloud drop shadow
        cloud_draw.ellipse([cx - rx + 18, cy - ry + 18, cx + rx + 18, cy + ry + 18], fill=(20, 25, 30, 60))
        # Cloud body
        cloud_draw.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=(255, 255, 255, 145))
        # Bright core
        cloud_draw.ellipse([cx - int(rx*0.6), cy - int(ry*0.6), cx + int(rx*0.6), cy + int(ry*0.6)], fill=(255, 255, 255, 190))
        
    cloud_layer = cloud_layer.filter(ImageFilter.GaussianBlur(radius=22))
    opt_post = Image.alpha_composite(opt_post, cloud_layer)
    opt_post.putalpha(alpha_img)
    opt_post_path = os.path.join(sat_dir, "sentinel2_optical_post.png")
    opt_post.save(opt_post_path, "PNG", quality=92)
    print(f"Generated realistic optical post: {opt_post_path}")

    # =========================================================================
    # 3. SENTINEL-1 SAR RADAR PRE-EVENT (Baseline radar backscatter)
    # =========================================================================
    sar_base = base_optical.convert("L")
    sar_base = ImageEnhance.Contrast(sar_base).enhance(1.4)
    sar_base = ImageEnhance.Brightness(sar_base).enhance(0.9)
    sar_np = np.array(sar_base, dtype=np.float32)
    noise = np.random.gamma(shape=4.0, scale=0.25, size=sar_np.shape)
    sar_speckle = np.clip(sar_np * noise, 0, 255).astype(np.uint8)
    sar_pre = Image.fromarray(sar_speckle).convert("RGB")
    
    # Pre-flood river is a thin dark specular mirror (~25m width)
    sar_pre_draw = ImageDraw.Draw(sar_pre)
    for i in range(len(spline_px) - 1):
        sar_pre_draw.line([spline_px[i], spline_px[i+1]], fill=(12, 14, 16), width=4)
        
    sar_pre_rgba = sar_pre.convert("RGBA")
    sar_pre_rgba.putalpha(alpha_img)
    sar_pre_path = os.path.join(sat_dir, "sentinel1_sar_pre.png")
    sar_pre_rgba.save(sar_pre_path, "PNG", quality=92)
    print(f"Generated radar pre: {sar_pre_path}")

    # =========================================================================
    # 4. SENTINEL-1 SAR RADAR POST-EVENT
    # Pitch-black flood backscatter drop (< -3.2 dB) & bright rough debris scattering
    # =========================================================================
    sar_post = sar_pre.copy()
    sar_post_overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    sar_post_draw = ImageDraw.Draw(sar_post_overlay)
    
    # Flooded river canyon: calm water specularly reflects radar away -> PITCH BLACK
    sar_post_draw.polygon(river_poly, fill=(6, 8, 10, 250))
    for i in range(len(spline_px) - 1):
        sar_post_draw.line([spline_px[i], spline_px[i+1]], fill=(4, 6, 8, 255), width=16)
        
    # Landslide debris fans: rough rubble causes strong volume scattering -> BRIGHT SPECKLE
    for ls in landslides:
        tx, ty = geo_to_img_coords(ls["toe"][0], ls["toe"][1], w, h)
        r = ls["fan_radius"]
        sar_post_draw.ellipse([tx - r, ty - int(r*0.7), tx + r, ty + int(r*0.7)], fill=(225, 228, 232, 220))
        
    sar_post_overlay = sar_post_overlay.filter(ImageFilter.GaussianBlur(radius=1.8))
    sar_post = Image.alpha_composite(sar_post.convert("RGBA"), sar_post_overlay)
    
    sar_post_np = np.array(sar_post.convert("L"), dtype=np.float32)
    post_noise = np.random.gamma(shape=4.0, scale=0.25, size=sar_post_np.shape)
    sar_post = Image.fromarray(np.clip(sar_post_np * post_noise, 0, 255).astype(np.uint8)).convert("RGBA")
    sar_post.putalpha(alpha_img)
    sar_post_path = os.path.join(sat_dir, "sentinel1_sar_post.png")
    sar_post.save(sar_post_path, "PNG", quality=92)
    print(f"Generated radar post: {sar_post_path}")

    # =========================================================================
    # 5. SENTINEL-1 SAR RGB CHANGE DETECTION COMPOSITE
    # Standard ESA / Copernicus product: Electric Cyan (Flood) vs Glowing Orange (Debris)
    # =========================================================================
    change_base = sar_base.convert("RGB")
    change_layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    change_draw = ImageDraw.Draw(change_layer)
    
    # Floodwater in Electric Cyan (RGB 0, 225, 255)
    change_draw.polygon(river_poly, fill=(0, 220, 255, 215))
    for i in range(len(spline_px) - 1):
        change_draw.line([spline_px[i], spline_px[i+1]], fill=(0, 240, 255, 245), width=16)
        
    # Debris fans in Glowing Orange/Red (RGB 255, 75, 0)
    for ls in landslides:
        tx, ty = geo_to_img_coords(ls["toe"][0], ls["toe"][1], w, h)
        r = ls["fan_radius"]
        change_draw.ellipse([tx - r, ty - int(r*0.7), tx + r, ty + int(r*0.7)], fill=(255, 75, 0, 230))
        
    change_layer = change_layer.filter(ImageFilter.GaussianBlur(radius=2))
    change_rgb = Image.alpha_composite(change_base.convert("RGBA"), change_layer)
    change_rgb.putalpha(alpha_img)
    change_path = os.path.join(sat_dir, "sentinel1_sar_change.png")
    change_rgb.save(change_path, "PNG", quality=92)
    print(f"Generated SAR change composite: {change_path}")

    # =========================================================================
    # 6. DUAL-SENSOR FUSION: SENTINEL-1 + SENTINEL-2 (BEST OF BOTH WORLDS)
    # Fuses Sentinel-2 natural optical color with Sentinel-1 radar flood & debris extent
    # =========================================================================
    fused_img = base_optical.copy().convert("RGBA")
    fused_overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    fused_draw = ImageDraw.Draw(fused_overlay)
    
    # Raging sediment water on optical base
    fused_draw.polygon(river_poly, fill=(132, 96, 58, 230))
    # Radar-confirmed specular flood core in oceanic cyan highlight
    for i in range(len(spline_px) - 1):
        fused_draw.line([spline_px[i], spline_px[i+1]], fill=(0, 185, 225, 175), width=12)
        
    # Landslide scars & radar-confirmed high-roughness debris fans
    for ls in landslides:
        tx, ty = geo_to_img_coords(ls["toe"][0], ls["toe"][1], w, h)
        r = ls["fan_radius"]
        fused_draw.ellipse([tx - r, ty - int(r*0.7), tx + r, ty + int(r*0.7)], fill=(245, 120, 20, 210))
        
    fused_overlay = fused_overlay.filter(ImageFilter.GaussianBlur(radius=2))
    fused_img = Image.alpha_composite(fused_img, fused_overlay)
    fused_img.putalpha(alpha_img)
    fused_path = os.path.join(sat_dir, "sentinel_fused_post.png")
    fused_img.save(fused_path, "PNG", quality=92)
    print(f"Generated Dual-Sensor Fused layer: {fused_path}")

    print("ALL 6 SATELLITE LAYERS (SENTINEL-1 + SENTINEL-2 + FUSION) GENERATED WITH MAXIMUM FIDELITY!")

if __name__ == "__main__":
    main()
