import struct
import json
import os

glb_path = r"c:\Users\Pancr\Desktop\F1\public\ferrari_f1_2019.glb"
with open(glb_path, "rb") as f:
    header = f.read(12)
    magic, version, length = struct.unpack("<III", header)
    chunk0_header = f.read(8)
    chunk0_len, chunk0_type = struct.unpack("<II", chunk0_header)
    json_bytes = f.read(chunk0_len)
    gltf = json.loads(json_bytes.decode("utf-8"))

images = gltf.get("images", [])
buffer_views = gltf.get("bufferViews", [])

print("Image BufferView details:")
total_img_size = 0
for idx, img in enumerate(images):
    bv_idx = img.get("bufferView")
    bv = buffer_views[bv_idx]
    offset = bv.get("byteOffset", 0)
    length = bv.get("byteLength", 0)
    total_img_size += length
    print(f"  Image {idx}: BufferView {bv_idx}, Offset: {offset}, Length: {length/1024/1024:.2f} MB")

print(f"Total image size in BIN chunk: {total_img_size/1024/1024:.2f} MB")
print(f"Remaining (geometry/animation) size: {(26.45*1024*1024 - total_img_size)/1024/1024:.2f} MB")
