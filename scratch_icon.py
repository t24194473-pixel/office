import sys
import os

try:
    from PIL import Image, ImageDraw
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])
    from PIL import Image, ImageDraw

def create_gradient(width, height, start_color, end_color):
    base = Image.new('RGBA', (width, height), start_color)
    top = Image.new('RGBA', (width, height), end_color)
    mask = Image.new('L', (width, height))
    mask_data = []
    for y in range(height):
        # Diagonal gradient
        val = int(255 * ((x + y) / (width + height))) if 'x' in locals() else int(255 * (y / height))
        for x in range(width):
            mask_data.append(int(255 * ((x + y) / (width + height))))
    mask.putdata(mask_data)
    base.paste(top, (0, 0), mask)
    return base

def main():
    size = 512
    # orange-100 (#ffedd5) to orange-200 (#fed7aa)
    start_color = (255, 237, 213, 255)
    end_color = (254, 215, 170, 255)
    bg = create_gradient(size, size, start_color, end_color)
    
    mask = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle([(0,0), (size, size)], radius=120, fill=255)
    
    icon = Image.new('RGBA', (size, size), (0,0,0,0))
    icon.paste(bg, (0,0), mask)
    
    fg_path = r"E:\office\src\assets\علي بارجاء.png"
    if not os.path.exists(fg_path):
        print("Source image not found:", fg_path)
        return

    fg = Image.open(fg_path).convert("RGBA")
    
    bbox = fg.getbbox()
    if bbox:
        fg = fg.crop(bbox)
        
    target_size = int(size * 0.70)
    aspect = fg.width / fg.height
    if aspect > 1:
        new_w = target_size
        new_h = int(target_size / aspect)
    else:
        new_h = target_size
        new_w = int(target_size * aspect)
        
    fg = fg.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    pos = ((size - new_w) // 2, (size - new_h) // 2)
    icon.paste(fg, pos, fg)
    
    icon.save(r"E:\office\public\pwa-icon-bg.png")
    print("Done creating pwa-icon-bg.png")

if __name__ == '__main__':
    main()
