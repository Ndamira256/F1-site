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

print("Listing Nodes that might be wheels:")
for idx, node in enumerate(nodes):
    name = node.get("name", "")
    mesh_idx = node.get("mesh")
    translation = node.get("translation", [0,0,0])
    rotation = node.get("rotation", [0,0,0,1])
    scale = node.get("scale", [1,1,1])
    
    name_lower = name.lower()
    if any(k in name_lower for k in ["wheel", "tire", "rim", "tyre"]):
        safe_name = name.encode("ascii", "replace").decode("ascii")
        print(f"Node {idx}: Name: '{safe_name}', Mesh: {mesh_idx}, Pos: {translation}, Rot: {rotation}, Scale: {scale}")

for idx, node in enumerate(nodes):
    children = node.get("children", [])
    name = node.get("name", "")
    if len(children) > 0 and any(k in name.lower() for k in ["wheel", "tire"]):
        safe_name = name.encode("ascii", "replace").decode("ascii")
        print(f"Parent Node {idx} '{safe_name}' has children: {children}")
