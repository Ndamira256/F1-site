import json

log_path = r"c:\Users\Pancr\Desktop\F1\car\ferrari_perf_log.json"
try:
    with open(log_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    print(f"Total log entries: {len(data)}")
    
    categories = {}
    for item in data:
        cat = item.get("category")
        categories[cat] = categories.get(cat, 0) + 1
    print("Categories distribution:")
    for cat, count in categories.items():
        print(f"  {cat}: {count}")

    print("\n--- FPS DROPS & THREAD BLOCKS ---")
    for item in data:
        if item.get("category") in ("FPS_Drop", "ThreadBlock"):
            print(f"[{item.get('category')}] {item.get('elapsedMs')}ms | Section: {item.get('activeSection')} | Message: {item.get('message')}")
            if item.get("details"):
                print(f"   Details: {item.get('details')}")
                
except Exception as e:
    print("Error reading log:", e)
