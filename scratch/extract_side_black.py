from PIL import Image, ImageDraw, ImageFilter
import os

def extract_car_from_black_bg(input_path, output_path):
    print(f"Loading side-view car image from {input_path}...")
    if not os.path.exists(input_path):
        print(f"File not found: {input_path}")
        return
        
    img = Image.open(input_path).convert("RGBA")
    w, h = img.size
    print(f"Original size: {w}x{h}")
    
    # 1. Upscale to 4K first (width = 3840px, keeping aspect ratio)
    target_width = 3840
    target_height = int((h / w) * target_width)
    print(f"Upscaling to: {target_width}x{target_height}")
    
    img_upscaled = img.resize((target_width, target_height), resample=Image.Resampling.LANCZOS)
    
    # Apply subtle sharpening after upscale to keep edges extremely crisp
    img_sharpened = img_upscaled.filter(ImageFilter.UnsharpMask(radius=1.5, percent=150, threshold=1))
    
    car_w, car_h = img_sharpened.size
    
    # 2. Perform border flood-fill with black color key (thresh=20)
    # This turns the contiguous outer black background transparent, but leaves the car's internal black tires/details intact
    print("Performing border flood-fill for black background...")
    
    # Corners to start flood-filling
    starts = [(0, 0), (0, car_h - 1), (car_w - 1, 0), (car_w - 1, car_h - 1)]
    for start in starts:
        r, g, b, a = img_sharpened.getpixel(start)
        if a > 0 and (r < 25 and g < 25 and b < 25):
            ImageDraw.floodfill(img_sharpened, start, (0, 0, 0, 0), thresh=25)
            
    # Also scan top/bottom/left/right borders to catch any isolated background pockets
    for x in range(car_w):
        for y in [0, car_h - 1]:
            r, g, b, a = img_sharpened.getpixel((x, y))
            if a > 0 and (r < 25 and g < 25 and b < 25):
                ImageDraw.floodfill(img_sharpened, (x, y), (0, 0, 0, 0), thresh=25)
    for y in range(car_h):
        for x in [0, car_w - 1]:
            r, g, b, a = img_sharpened.getpixel((x, y))
            if a > 0 and (r < 25 and g < 25 and b < 25):
                ImageDraw.floodfill(img_sharpened, (x, y), (0, 0, 0, 0), thresh=25)
                
    # 3. Crop tightly to the non-transparent bounding box
    bbox = img_sharpened.getbbox()
    if bbox:
        img_sharpened = img_sharpened.crop(bbox)
        
    # Save the resulting transparent PNG
    img_sharpened.save(output_path, "PNG")
    print(f"Successfully saved high-quality transparent car watermark to {output_path} with size {img_sharpened.size}")

assets_dir = r"c:\Users\Pancr\Desktop\F1\src\assets"
extract_car_from_black_bg(
    os.path.join(assets_dir, "ferrari_sf26_side.png"),
    os.path.join(assets_dir, "website_bg_transparent.png")
)
print("Done.")
