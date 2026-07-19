from PIL import Image
import os

def optimize_jpg(filepath):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return
    
    orig_size = os.path.getsize(filepath)
    img = Image.open(filepath)
    
    # Save with optimized settings
    img.save(filepath, "JPEG", quality=85, optimize=True)
    new_size = os.path.getsize(filepath)
    print(f"Optimized {os.path.basename(filepath)}: {orig_size/1024:.1f} KB -> {new_size/1024:.1f} KB ({((orig_size - new_size)/orig_size)*100:.1f}% reduction)")

assets_dir = r"c:\Users\Pancr\Desktop\F1\src\assets"
optimize_jpg(os.path.join(assets_dir, "hero_car_1.jpg"))
optimize_jpg(os.path.join(assets_dir, "hero_car_3.jpg"))
print("Done.")
