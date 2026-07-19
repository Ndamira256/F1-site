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

# Find parents
parent_map = {}
for idx, node in enumerate(nodes):
    for child_idx in node.get("children", []):
        parent_map[child_idx] = idx

def print_ancestry(node_idx):
    path = []
    curr = node_idx
    while curr in parent_map:
        parent = parent_map[curr]
        node = nodes[parent]
        safe_name = node.get("name", "unnamed").encode("ascii", "replace").decode("ascii")
        translation = node.get("translation", [0,0,0])
        rotation = node.get("rotation", [0,0,0,1])
        scale = node.get("scale", [1,1,1])
        path.append(f"Node {parent} '{safe_name}' (Pos: {translation}, Rot: {rotation}, Scale: {scale})")
        curr = parent
    print(f"Ancestry path for Node {node_idx}:")
    for step in reversed(path):
        print("  -> " + step)

print_ancestry(16) # Tire FL
print_ancestry(20) # Tire FR
print_ancestry(24) # Tire RL
print_ancestry(28) # Tire RR
