from PIL import Image, ImageDraw, ImageFilter
import os

def enhance_and_extract_car(bg_path, output_path):
    print(f"Loading background image from {bg_path}...")
    if not os.path.exists(bg_path):
        print(f"File not found: {bg_path}")
        return
        
    img = Image.open(bg_path)
    w, h = img.size
    print(f"Original size: {w}x{h}")
    
    # Target size: let's scale it up to a high resolution (height = 3840px)
    target_height = 3840
    target_width = int((w / h) * target_height)
    print(f"Scaling to: {target_width}x{target_height}")
    
    # Upscale using Lanczos
    img_upscaled = img.resize((target_width, target_height), resample=Image.Resampling.LANCZOS).convert("RGBA")
    
    # Apply UnsharpMask to aggressively sharpen edges and enhance local resolution details
    # radius=2 to target edge transitions, percent=200 to boost edge contrast, threshold=1 to preserve flat areas
    print("Applying edge sharpening filter (UnsharpMask)...")
    img_sharpened = img_upscaled.filter(ImageFilter.UnsharpMask(radius=2, percent=200, threshold=1))
    
    # Crop the F1 car region (same coords as extract_side_view.py)
    car_y1 = int(0.55 * target_height)
    car_y2 = int(0.80 * target_height)
    car_x1 = int(0.05 * target_width)
    car_x2 = int(0.95 * target_width)
    
    car_img = img_sharpened.crop((car_x1, car_y1, car_x2, car_y2))
    car_w, car_h = car_img.size
    print(f"Cropped car size: {car_w}x{car_h}")
    
    # Flood-fill borders to transparent
    print("Performing border extraction flood-fill...")
    for x in range(car_w):
        for y in [0, car_h - 1]:
            r, g, b, a = car_img.getpixel((x, y))
            if a > 0 and (r > 180 and g > 180 and b > 180):
                ImageDraw.floodfill(car_img, (x, y), (0, 0, 0, 0), thresh=65)
    for y in range(car_h):
        for x in [0, car_w - 1]:
            r, g, b, a = car_img.getpixel((x, y))
            if a > 0 and (r > 180 and g > 180 and b > 180):
                ImageDraw.floodfill(car_img, (x, y), (0, 0, 0, 0), thresh=65)
                
    # Crop tightly to the non-transparent bounding box
    bbox = car_img.getbbox()
    if bbox:
        car_img = car_img.crop(bbox)
        
    # Save the resulting transparent PNG
    car_img.save(output_path, "PNG")
    print(f"Successfully saved enhanced transparent car watermark to {output_path} with size {car_img.size}")

assets_dir = r"c:\Users\Pancr\Desktop\F1\src\assets"
enhance_and_extract_car(
    r"C:\Users\Pancr\.gemini\antigravity\brain\edabb397-a55b-44d6-a99f-9b57199afc20\media__1784422111075.jpg",
    os.path.join(assets_dir, "website_bg_transparent.png")
)
print("Done.")
