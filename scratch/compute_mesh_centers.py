import struct
import json
import os
import numpy as np

glb_path = r"c:\Users\Pancr\Desktop\F1\public\ferrari_f1_2019.glb"
with open(glb_path, "rb") as f:
    header = f.read(12)
    magic, version, length = struct.unpack("<III", header)
    chunk0_header = f.read(8)
    chunk0_len, chunk0_type = struct.unpack("<II", chunk0_header)
    json_bytes = f.read(chunk0_len)
    gltf = json.loads(json_bytes.decode("utf-8"))
    
    # Read Chunk 1 (BIN)
    chunk1_header = f.read(8)
    chunk1_len, chunk1_type = struct.unpack("<II", chunk1_header)
    bin_bytes = f.read(chunk1_len)

# Retrieve accessors, bufferViews, buffers
accessors = gltf.get("accessors", [])
buffer_views = gltf.get("bufferViews", [])
buffers = gltf.get("buffers", [])

def get_accessor_data(accessor_idx):
    if accessor_idx is None:
        return None
    acc = accessors[accessor_idx]
    bv_idx = acc["bufferView"]
    bv = buffer_views[bv_idx]
    
    offset = bv.get("byteOffset", 0) + acc.get("byteOffset", 0)
    count = acc["count"]
    component_type = acc["componentType"]
    type_str = acc["type"]
    
    # Map component types
    # 5126 is float (4 bytes)
    if component_type == 5126:
        fmt = "f"
        stride = 4
    elif component_type == 5123: # unsigned short
        fmt = "H"
        stride = 2
    else:
        return None
        
    num_components = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4}[type_str]
    element_size = stride * num_components
    
    # Read from bin_bytes
    data = []
    for i in range(count):
        start = offset + i * element_size
        elem = bin_bytes[start : start + element_size]
        vals = struct.unpack(f"<{num_components}{fmt}", elem)
        data.append(vals)
    return np.array(data)

nodes = gltf.get("nodes", [])
meshes = gltf.get("meshes", [])

print("Computing Bounding Box Center for Wheel Meshes:")
for idx, node in enumerate(nodes):
    name = node.get("name", "")
    mesh_idx = node.get("mesh")
    if mesh_idx is not None:
        mesh = meshes[mesh_idx]
        name_lower = name.lower()
        if any(k in name_lower for k in ["wheel", "tire", "rim", "tyre"]):
            # Get POSITION accessor (usually attribute "POSITION" in primitive)
            prim = mesh["primitives"][0]
            pos_accessor_idx = prim["attributes"]["POSITION"]
            pos_data = get_accessor_data(pos_accessor_idx)
            
            if pos_data is not None:
                min_coords = np.min(pos_data, axis=0)
                max_coords = np.max(pos_data, axis=0)
                center = (min_coords + max_coords) / 2
                safe_name = name.encode("ascii", "replace").decode("ascii")
                print(f"Node {idx}: Name: '{safe_name}' -> Center: {center.tolist()}, Min: {min_coords.tolist()}, Max: {max_coords.tolist()}")
