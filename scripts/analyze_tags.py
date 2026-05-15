#!/usr/bin/env python3
"""Analyze all tags and generate canonical mapping."""
import os
import re
import json
from collections import Counter, defaultdict

BLOG_DIR = "/Users/alisafari/Downloads/PHD/UNT/2026/COMPS/alisafari-space/blog"

def parse_frontmatter(text):
    m = re.match(r'^---\s*\n(.*?)\n---\s*\n', text, re.DOTALL)
    if not m:
        return {}
    fm = {}
    for line in m.group(1).split('\n'):
        if ':' in line and not line.strip().startswith('-'):
            key, _, val = line.partition(':')
            key = key.strip()
            val = val.strip().strip('"').strip("'")
            fm[key] = val
    if 'tags' in fm:
        tags_str = fm['tags']
        tags = re.findall(r'"([^"]*)"', tags_str)
        if not tags:
            tags = [t.strip() for t in tags_str.strip('[]').split(',') if t.strip()]
        fm['tags'] = tags
    return fm

# Collect all tags with their source posts
all_tags = Counter()
tag_to_posts = defaultdict(list)

for fname in sorted(os.listdir(BLOG_DIR)):
    if not fname.endswith('.md') or 'PROMPT' in fname or '.claims.' in fname or '.review.' in fname:
        continue
    with open(os.path.join(BLOG_DIR, fname), 'r', encoding='utf-8') as f:
        content = f.read()
    fm = parse_frontmatter(content)
    tags = fm.get('tags', [])
    for t in tags:
        all_tags[t] += 1
        tag_to_posts[t].append(fname)

print(f"Total unique tags: {len(all_tags)}")
print(f"Total tag instances: {sum(all_tags.values())}")
print(f"Tags used once: {sum(1 for c in all_tags.values() if c == 1)}")
print(f"Tags used 2+ times: {sum(1 for c in all_tags.values() if c >= 2)}")
print()

# Show all tags for reference
print("=== ALL TAGS (for building mapping) ===")
for tag, count in sorted(all_tags.items(), key=lambda x: (-x[1], x[0])):
    print(f"  {count:3d} | {tag}")
