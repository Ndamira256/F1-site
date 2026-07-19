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

nodes = gltf.get("nodes", [])

print("Checking Nodes for 'matrix' field:")
for idx, node in enumerate(nodes):
    name = node.get("name", "")
    matrix = node.get("matrix")
    if matrix is not None:
        safe_name = name.encode("ascii", "replace").decode("ascii")
        print(f"Node {idx}: Name: '{safe_name}', Matrix: {matrix}")
