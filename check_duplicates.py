#!/usr/bin/env python3
from bs4 import BeautifulSoup
from collections import Counter

path = "/Users/alisafari/Projects/space/theories.html"
html = open(path, "r", encoding="utf-8", errors="ignore").read()
soup = BeautifulSoup(html, "html.parser")

# Duplicate ids
ids = [t["id"] for t in soup.select("[id]")]
dups = {k: v for k, v in Counter(ids).items() if v > 1}
print(f"Duplicate ids: {len(dups)}")
for k, v in sorted(dups.items(), key=lambda x: -x[1])[:50]:
    print(f"  {v}x {k}")

# Broken or ambiguous hash links
targets = Counter()
for a in soup.select('a[href^="#"]'):
    h = a.get("href", "")
    if len(h) > 1:
        targets[h[1:]] += 1

broken = []
ambiguous = []
for tid, _ in targets.items():
    hits = len(soup.select(f'#{tid}'))
    if hits == 0:
        broken.append(tid)
    elif hits > 1:
        ambiguous.append((tid, hits))

print(f"\nBroken anchors: {len(broken)}")
if broken:
    for tid in broken[:20]:
        print(f"  {tid}")

print(f"\nAmbiguous anchors: {len(ambiguous)}")
for tid, hits in ambiguous[:50]:
    print(f"  {hits}x {tid}")
