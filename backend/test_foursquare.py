import httpx
import json
import urllib.parse

city = "Paris"
overpass_url = "https://overpass-api.de/api/interpreter"
overpass_query = f"""
[out:json];
area[name="{city}"]->.searchArea;
(
  node["shop"~"mall|department_store|clothes|boutique"](area.searchArea);
  way["shop"~"mall|department_store|clothes|boutique"](area.searchArea);
);
out center 15;
"""

print(f"Testing Overpass for {city}...")
params = {'data': overpass_query}
headers = {'User-Agent': 'Breeze.AI Hackathon Project'}
res = httpx.get(overpass_url, params=params, headers=headers, timeout=30.0)
print(res.status_code)
data = res.json()
print(f"Found {len(data.get('elements', []))} elements")
for e in data.get('elements', [])[:3]:
    tags = e.get('tags', {})
    print("-", tags.get('name', 'Unknown'), "Shop:", tags.get('shop'))
