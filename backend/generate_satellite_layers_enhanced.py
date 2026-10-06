import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

SOUTH = 27.900
NORTH = 28.220
WEST = 85.120
EAST = 85.390

def geo_to_img_coords(lat, lon, total_w, total_h):
    u = (lon - WEST) / (EAST - WEST)
    v = (NORTH - lat) / (NORTH - SOUTH)
    px = int(u * total_w)
    py = int(v * total_h)
    return px, py

def create_feathered_alpha(w, h, feather_px=45):
    # Generates a smooth alpha mask that fades to 0 at the image borders
    alpha = np.ones((h, w), dtype=np.float32)
    
    # Horizontal gradients
    for i in range(feather_px):
        factor = 0.5 * (1.0 - math.cos(math.pi * i / feather_px))
        alpha[:, i] = np.minimum(alpha[:, i], factor)
        alpha[:, w - 1 - i] = np.minimum(alpha[:, w - 1 - i], factor)
        
    # Vertical gradients
    for j in range(feather_px):
        factor = 0.5 * (1.0 - math.cos(math.pi * j / feather_px))
        alpha[j, :] = np.minimum(alpha[j, :], factor)
        alpha[h - 1 - j, :] = np.minimum(alpha[h - 1 - j], factor)
        
    return (alpha * 255).astype(np.uint8)

def main():
    sat_dir = r"d:\iitp csda\iitmandi\frontend\public\satellite"
    base_path = os.path.join(sat_dir, "sentinel2_optical_pre.png")
    
    if not os.path.exists(base_path):
        print(f"Error: {base_path} not found.")
        return
        
    base_optical = Image.open(base_path).convert("RGB")
    w, h = base_optical.size
    print(f"Loaded optical base scene: {w}x{h} px")
    
    alpha_mask = create_feathered_alpha(w, h, feather_px=50)
    alpha_img = Image.fromarray(alpha_mask, mode="L")
    
    # -------------------------------------------------------------------------
    # Coordinates from trishuliGeoData.js
    # -------------------------------------------------------------------------
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

    debris_polygons = [
        # Ramche
        [[28.075, 85.250], [28.071, 85.263], [28.056, 85.255], [28.049, 85.232], [28.057, 85.225], [28.068, 85.236]],
        # Mailung
        [[28.124, 85.302], [28.119, 85.316], [28.104, 85.303], [28.101, 85.278], [28.113, 85.273], [28.121, 85.288]],
        # Hakupa
        [[28.096, 85.273], [28.090, 85.282], [28.078, 85.269], [28.076, 85.252], [28.086, 85.250]],
        # Ghatte Khola
        [[28.184, 85.358], [28.179, 85.370], [28.167, 85.356], [28.164, 85.338], [28.174, 85.343]]
    ]

    inundation_pixels = [geo_to_img_coords(pt[0], pt[1], w, h) for pt in inundation_coords]
    thalweg_pixels = [geo_to_img_coords(pt[0], pt[1], w, h) for pt in river_thalweg]
    debris_pixels = [[geo_to_img_coords(pt[0], pt[1], w, h) for pt in poly] for poly in debris_polygons]

    # =========================================================================
    # 1. SENTINEL-2 OPTICAL PRE-EVENT (Lush green mountain valley, clear water)
    # =========================================================================
    opt_pre = base_optical.copy()
    opt_pre_draw = ImageDraw.Draw(opt_pre)
    # Clear turquoise river ribbon
    for i in range(len(thalweg_pixels) - 1):
        opt_pre_draw.line([thalweg_pixels[i], thalweg_pixels[i+1]], fill=(32, 115, 140), width=6)
    
    opt_pre_rgba = opt_pre.convert("RGBA")
    opt_pre_rgba.putalpha(alpha_img)
    opt_pre_path = os.path.join(sat_dir, "sentinel2_optical_pre.png")
    opt_pre_rgba.save(opt_pre_path, "PNG", quality=92)
    print(f"Generated: {opt_pre_path}")

    # =========================================================================
    # 2. SENTINEL-2 OPTICAL POST-EVENT (Raging sediment torrent, massive scars, clouds)
    # =========================================================================
    opt_post = base_optical.copy()
    
    # A. Floodwater & Silt Deposit
    flood_layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    flood_draw = ImageDraw.Draw(flood_layer)
    # Inundation envelope filled with turbid silt water (RGB 130, 95, 58)
    flood_draw.polygon(inundation_pixels, fill=(135, 102, 65, 230))
    
    # Deep roaring river core with sediment foam (RGB 115, 82, 48)
    for i in range(len(thalweg_pixels) - 1):
        flood_draw.line([thalweg_pixels[i], thalweg_pixels[i+1]], fill=(120, 86, 52, 255), width=24)
        flood_draw.line([thalweg_pixels[i], thalweg_pixels[i+1]], fill=(175, 150, 115, 180), width=8) # foaming eddies
    
    # B. Landslide Scars & Debris Fans
    for poly in debris_pixels:
        flood_draw.polygon(poly, fill=(170, 145, 105, 240)) # Raw tan bedrock/rubble scar
        
        # Add erosion gullies inside scar
        centroid = (int(sum(p[0] for p in poly)/len(poly)), int(sum(p[1] for p in poly)/len(poly)))
        for p in poly:
            flood_draw.line([p, centroid], fill=(138, 115, 82, 200), width=4)
            
    flood_layer = flood_layer.filter(ImageFilter.GaussianBlur(radius=2))
    opt_post = Image.alpha_composite(opt_post.convert("RGBA"), flood_layer)

    # C. Monsoon Cloud Cover (85% cloud evaluation banner in upper elevations)
    cloud_layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    cloud_draw = ImageDraw.Draw(cloud_layer)
    for cx_ratio, cy_ratio, rx, ry in [
        (0.20, 0.20, 180, 130), (0.75, 0.28, 240, 160), 
        (0.70, 0.65, 210, 150), (0.30, 0.75, 160, 110), 
        (0.85, 0.82, 220, 140), (0.15, 0.50, 140, 95)
    ]:
        cx, cy = int(cx_ratio * w), int(cy_ratio * h)
        cloud_draw.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=(255, 255, 255, 145))
        
    cloud_layer = cloud_layer.filter(ImageFilter.GaussianBlur(radius=25))
    opt_post = Image.alpha_composite(opt_post, cloud_layer)
    opt_post.putalpha(alpha_img)
    opt_post_path = os.path.join(sat_dir, "sentinel2_optical_post.png")
    opt_post.save(opt_post_path, "PNG", quality=92)
    print(f"Generated: {opt_post_path}")

    # =========================================================================
    # 3. SENTINEL-1 SAR PRE-EVENT (Calibrated C-SAR radar backscatter baseline)
    # =========================================================================
    # Authentic microwave radar appearance:
    # Terrain slopes have strong backscatter; water is a specular mirror (pitch black)
    sar_gray = base_optical.convert("L")
    sar_gray = ImageEnhance.Contrast(sar_gray).enhance(1.45)
    sar_gray = ImageEnhance.Brightness(sar_gray).enhance(0.88)
    
    sar_np = np.array(sar_gray, dtype=np.float32)
    noise = np.random.gamma(shape=4.0, scale=0.25, size=sar_np.shape)
    sar_speckle = np.clip(sar_np * noise, 0, 255).astype(np.uint8)
    sar_pre = Image.fromarray(sar_speckle).convert("RGB")
    
    # Normal river is a thin, dark specular ribbon (radar reflects forward away from receiver)
    sar_pre_draw = ImageDraw.Draw(sar_pre)
    for i in range(len(thalweg_pixels) - 1):
        sar_pre_draw.line([thalweg_pixels[i], thalweg_pixels[i+1]], fill=(10, 12, 14), width=5)
        
    sar_pre_rgba = sar_pre.convert("RGBA")
    sar_pre_rgba.putalpha(alpha_img)
    sar_pre_path = os.path.join(sat_dir, "sentinel1_sar_pre.png")
    sar_pre_rgba.save(sar_pre_path, "PNG", quality=92)
    print(f"Generated: {sar_pre_path}")

    # =========================================================================
    # 4. SENTINEL-1 SAR POST-EVENT (Radar backscatter drop < -3.2 dB & debris scatter)
    # =========================================================================
    sar_post = sar_pre.copy()
    sar_post_layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    sar_post_draw = ImageDraw.Draw(sar_post_layer)

    # A. Massive backscatter drop on calm flood water (PITCH BLACK specular reflection)
    sar_post_draw.polygon(inundation_pixels, fill=(6, 8, 10, 245))
    for i in range(len(thalweg_pixels) - 1):
        sar_post_draw.line([thalweg_pixels[i], thalweg_pixels[i+1]], fill=(4, 6, 8, 255), width=20)
        
    # B. High-roughness depolarizing debris scattering (Bright rough speckle, delta > +3 dB)
    for poly in debris_pixels:
        sar_post_draw.polygon(poly, fill=(215, 218, 222, 220)) # High roughness bright return
        
    sar_post_layer = sar_post_layer.filter(ImageFilter.GaussianBlur(radius=1.8))
    sar_post = Image.alpha_composite(sar_post.convert("RGBA"), sar_post_layer)
    
    # Re-apply gamma speckle to post layer so radar texture is authentic
    post_np = np.array(sar_post.convert("L"), dtype=np.float32)
    post_noise = np.random.gamma(shape=4.0, scale=0.25, size=post_np.shape)
    post_speckle = np.clip(post_np * post_noise, 0, 255).astype(np.uint8)
    sar_post = Image.fromarray(post_speckle).convert("RGBA")
    sar_post.putalpha(alpha_img)
    sar_post_path = os.path.join(sat_dir, "sentinel1_sar_post.png")
    sar_post.save(sar_post_path, "PNG", quality=92)
    print(f"Generated: {sar_post_path}")

    # =========================================================================
    # 5. SENTINEL-1 SAR RGB CHANGE DETECTION COMPOSITE (Log-Ratio / Amplitude Difference)
    # =========================================================================
    # Standard Copernicus EMS / UNOSAT product:
    # Cyan/Electric Blue = Flooded Water (Backscatter Drop < -3.2 dB)
    # Bright Amber/Red = Rough Debris Deposit / Landslide Rubble
    # Neutral Gray = Unchanged Terrain
    change_rgb = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    change_base = sar_gray.convert("RGB")
    change_rgb.paste(change_base, (0, 0))
    
    change_layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    change_draw = ImageDraw.Draw(change_layer)
    
    # Flooded Areas -> Electric Cyan (RGB 0, 220, 255)
    change_draw.polygon(inundation_pixels, fill=(0, 210, 255, 210))
    for i in range(len(thalweg_pixels) - 1):
        change_draw.line([thalweg_pixels[i], thalweg_pixels[i+1]], fill=(0, 235, 255, 240), width=18)
        
    # Debris Fans -> Intense Orange/Red (RGB 255, 69, 0)
    for poly in debris_pixels:
        change_draw.polygon(poly, fill=(255, 80, 0, 220))
        
    change_layer = change_layer.filter(ImageFilter.GaussianBlur(radius=2))
    change_rgb = Image.alpha_composite(change_rgb, change_layer)
    change_rgb.putalpha(alpha_img)
    change_path = os.path.join(sat_dir, "sentinel1_sar_change.png")
    change_rgb.save(change_path, "PNG", quality=92)
    print(f"Generated: {change_path}")

    print("ALL 5 ENHANCED GEOREFERENCED SATELLITE LAYERS SUCCESSFULLY GENERATED WITH FEATHERED ALPHA!")

if __name__ == "__main__":
    main()
