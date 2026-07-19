from PIL import Image
import os

assets_dir = r"c:\Users\Pancr\Desktop\F1\src\assets"

def convert_to_jpg(png_name, jpg_name):
    png_path = os.path.join(assets_dir, png_name)
    jpg_path = os.path.join(assets_dir, jpg_name)
    if os.path.exists(png_path):
        img = Image.open(png_path)
        if img.mode in ('RGBA', 'LA'):
            background = Image.new('RGB', img.size, (17, 17, 17)) # Dark background matching site theme
            background.paste(img, mask=img.split()[3]) # 3 is alpha
            img = background
        img.save(jpg_path, "JPEG", quality=85, optimize=True)
        print(f"Converted {png_name} to JPG: {os.path.getsize(png_path)/1024:.1f} KB -> {os.path.getsize(jpg_path)/1024:.1f} KB")
        os.remove(png_path)

def quantize_png(png_name):
    png_path = os.path.join(assets_dir, png_name)
    if os.path.exists(png_path):
        orig_size = os.path.getsize(png_path)
        img = Image.open(png_path)
        
        # Convert to 8-bit palette mode using native adaptive quantization
        img_quant = img.convert('P', palette=Image.Palette.ADAPTIVE, colors=256)
        img_quant.save(png_path, "PNG", optimize=True)
        new_size = os.path.getsize(png_path)
        print(f"Quantized {png_name}: {orig_size/1024:.1f} KB -> {new_size/1024:.1f} KB ({((orig_size - new_size)/orig_size)*100:.1f}% reduction)")

# 1. Convert card_maranello.png to JPG
convert_to_jpg("card_maranello.png", "card_maranello.jpg")

# 2. Quantize remaining active PNGs
quantize_png("ferrari_helmet.png")
quantize_png("ferrari_sf26_side.png")
quantize_png("ferrari_sf26_split.png")

print("Asset optimization complete.")
