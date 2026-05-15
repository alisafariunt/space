#!/usr/bin/env python3
"""Build blog HTML pages from Markdown files with enhanced UI/UX."""
import os
import re
import html as html_mod
import random

BLOG_MD_DIR = "/Users/alisafari/Downloads/PHD/UNT/2026/COMPS/alisafari-space/blog"
OUTPUT_DIR = "/Users/alisafari/Projects/space/blog"
SITE_URL = "https://alisafari.space"
POSTS_PER_PAGE = 20

# ===== Shared Head Template =====
HEAD = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    {meta}
    <link rel="icon" type="image/png" href="/images/favicon.png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="/css/style.css">
    <link rel="stylesheet" href="/css/blog.css">
</head>
"""

# ===== Navigation Template =====
NAV = """<nav class="navbar" id="navbar">
    <div class="nav-container">
        <a href="/" class="nav-logo">
            <img src="/images/logo.png" alt="Ali Safari" class="logo-img">
        </a>
        <ul class="nav-links">
            <li><a href="/">Home</a></li>
            <li><a href="/blog/" class="active">Blog</a></li>
            <li><a href="/roadmap.html">AI Roadmap</a></li>
            <li><a href="/conferences/">Conferences</a></li>
            <li><a href="/#contact">Contact</a></li>
        </ul>
        <div class="nav-actions">
            <button class="theme-toggle" id="themeToggle" aria-label="Toggle dark mode">
                <i class="fas fa-moon"></i>
            </button>
            <button class="mobile-menu-btn" id="mobileMenuBtn" aria-label="Toggle menu">
                <span></span><span></span><span></span>
            </button>
        </div>
    </div>
</nav>
"""

# ===== Footer Template =====
FOOTER = """<footer class="footer">
    <div class="footer-content">
        <div class="footer-logo">
            <span>Ali Safari</span>
            <p>PhD Researcher | University of North Texas</p>
        </div>
        <ul class="footer-links">
            <li><a href="/">Home</a></li>
            <li><a href="/blog/">Blog</a></li>
            <li><a href="/roadmap.html">AI Roadmap</a></li>
            <li><a href="/conferences/">Conferences</a></li>
        </ul>
        <div class="footer-social">
            <a href="https://linkedin.com/in/ali-safari" target="_blank" aria-label="LinkedIn"><i class="fab fa-linkedin"></i></a>
            <a href="https://scholar.google.com/citations?user=rCosT9sAAAAJ&hl=en" target="_blank" aria-label="Google Scholar"><i class="fas fa-graduation-cap"></i></a>
        </div>
    </div>
    <div class="footer-bottom">
        <p>&copy; 2026 Ali Safari. All rights reserved.</p>
    </div>
</footer>
"""

# ===== Scripts =====
SCRIPTS = """<script src="/js/blog.js"></script>
"""

def parse_frontmatter(text):
    """Parse YAML frontmatter from markdown file."""
    m = re.match(r'^---\s*\n(.*?)\n---\s*\n(.*)', text, re.DOTALL)
    if not m:
        return {}, text
    fm = {}
    for line in m.group(1).split('\n'):
        if ':' in line:
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
    body = m.group(2)
    body = re.sub(r'\n---\s*\nverification:.*', '', body, flags=re.DOTALL)
    return fm, body.strip()

def md_to_html(text):
    """Markdown to HTML with semantic elements."""
    text = text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    paragraphs = re.split(r'\n\n+', text)
    html_parts = []
    in_blockquote = False
    for p in paragraphs:
        p = p.strip()
        if not p:
            continue
        if p == '---' or p == '***':
            html_parts.append('<hr>')
            continue
        # blockquote
        lines = p.split('\n')
        if all(line.startswith('>') for line in lines if line.strip()):
            quote_text = '\n'.join(line.lstrip('> ').strip() for line in lines if line.strip())
            quote_text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', quote_text)
            quote_text = re.sub(r'\*(.+?)\*', r'<em>\1</em>', quote_text)
            quote_text = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', quote_text)
            html_parts.append(f'<blockquote><p>{quote_text}</p></blockquote>')
            continue
        p = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', p)
        p = re.sub(r'\*(.+?)\*', r'<em>\1</em>', p)
        p = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', p)
        html_parts.append(f'<p>{"<br>".join(lines)}</p>')
    return '\n'.join(html_parts)

def get_all_posts():
    """Get all blog posts sorted by date (newest first)."""
    posts = []
    for fname in os.listdir(BLOG_MD_DIR):
        if not fname.endswith('.md') or 'PROMPT' in fname or '.claims.' in fname or '.review.' in fname:
            continue
        path = os.path.join(BLOG_MD_DIR, fname)
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        fm, body = parse_frontmatter(content)
        slug = fm.get('slug', fname.replace('2026-05-14-', '').replace('.md', '') if fname.startswith('2026-05-14-') else fname.replace('.md', ''))
        tags = fm.get('tags', [])
        # Ensure tags are list
        if isinstance(tags, str):
            tags = [t.strip() for t in tags.strip('[]').split(',') if t.strip()]
        posts.append({
            'slug': slug,
            'title': fm.get('title', 'Untitled'),
            'date': fm.get('date', '2026-05-14'),
            'excerpt': fm.get('excerpt', ''),
            'tags': tags,
            'reading_time': fm.get('readingTime', '5 min read'),
            'body': body,
            'fm': fm,
        })
    posts.sort(key=lambda p: p['date'], reverse=True)
    return posts

def get_all_tags(posts):
    """Extract all unique tags with counts."""
    tag_counts = {}
    for p in posts:
        for t in p['tags']:
            tag_counts[t] = tag_counts.get(t, 0) + 1
    return sorted(tag_counts.items(), key=lambda x: -x[1])

def get_related_posts(current_post, all_posts, count=3):
    """Find related posts by shared tags."""
    current_tags = set(current_post['tags'])
    scored = []
    for p in all_posts:
        if p['slug'] == current_post['slug']:
            continue
        shared = len(current_tags & set(p['tags']))
        if shared > 0:
            scored.append((p, shared))
    scored.sort(key=lambda x: (-x[1], x[0]['date']), reverse=False)
    scored.sort(key=lambda x: (-x[1], x[0]['date']), reverse=True)
    return [p for p, _ in scored[:count]]

def build_listing_html(posts, page=1, total_pages=1, all_tags=None):
    """Build blog listing page with grid, search, filters."""
    start = (page-1) * POSTS_PER_PAGE
    end = start + POSTS_PER_PAGE
    page_posts = posts[start:end]

    # Tag chips
    tag_chips = []
    tag_chips.append(f'<a href="#" class="blog-tag-chip active" data-tag="all">All <span class="tag-count">{len(posts)}</span></a>')
    if all_tags:
        for tag, count in all_tags[:15]:
            tag_chips.append(f'<a href="#" class="blog-tag-chip" data-tag="{html_mod.escape(tag)}">{html_mod.escape(tag)} <span class="tag-count">{count}</span></a>')

    # Grid cards
    cards = []
    for p in page_posts:
        tags_str = ','.join(p['tags'])
        tags_html = ''.join(f'<span class="tag">{html_mod.escape(t)}</span>' for t in p['tags'][:3])
        excerpt = p['excerpt'][:160] + ('...' if len(p['excerpt']) > 160 else '')
        cards.append(f'''
        <div class="blog-grid-item" data-title="{html_mod.escape(p['title'].lower())}" data-excerpt="{html_mod.escape(p['excerpt'].lower())}" data-tags="{html_mod.escape(tags_str)}" data-date="{p['date']}">
            <article class="blog-post-card">
                <div class="card-header">
                    <div class="card-meta">
                        <span>{p['date']}</span>
                        <span class="reading-time"><i class="far fa-clock"></i> {p['reading_time']}</span>
                    </div>
                    <h2><a href="/blog/{p['slug']}/">{html_mod.escape(p['title'])}</a></h2>
                </div>
                <p class="card-excerpt">{html_mod.escape(excerpt)}</p>
                <div class="card-footer">
                    <div class="card-tags">{tags_html}</div>
                    <a href="/blog/{p['slug']}/" class="read-link">Read <i class="fas fa-arrow-right"></i></a>
                </div>
            </article>
        </div>''')

    # Pagination
    pagination_html = ''
    if total_pages > 1:
        pages = []
        for i in range(1, total_pages + 1):
            if i == page:
                pages.append(f'<span class="current">{i}</span>')
            elif i == 1:
                pages.append(f'<a href="/blog/">{i}</a>')
            else:
                pages.append(f'<a href="/blog/page/{i}/">{i}</a>')
        pagination_html = f'<div class="blog-pagination">{"".join(pages)}</div>'

    meta = f'''<title>Blog | Ali Safari</title>
    <meta name="description" content="Ali Safari's blog on Information Systems research, AI, security, and theory. {len(posts)} posts.">
    <meta property="og:title" content="Blog | Ali Safari">
    <meta property="og:description" content="Information Systems research, AI, and theory.">
    <meta property="og:type" content="website">
    <meta property="og:url" content="{SITE_URL}/blog/">
    <meta property="og:site_name" content="Ali Safari">
    <meta name="twitter:card" content="summary">'''

    return f'''{HEAD.format(meta=meta)}
<body class="blog-page">
{NAV}

<header class="blog-header">
    <h1>Blog</h1>
    <p class="blog-subtitle">Thoughts on IS theory, AI, technology, and comps studying. No summaries, just honest reactions.</p>
    <div class="blog-meta">
        <span class="blog-meta-item"><i class="fas fa-pen-nib"></i> {len(posts)} posts</span>
        <span class="blog-meta-item"><i class="fas fa-tags"></i> {len(all_tags) if all_tags else 0} topics</span>
    </div>
</header>

<section class="blog-stats-bar">
    <div class="blog-stat"><span class="blog-stat-value">{len(posts)}</span><div class="blog-stat-label">Posts</div></div>
    <div class="blog-stat"><span class="blog-stat-value">{len(all_tags) if all_tags else 0}</span><div class="blog-stat-label">Topics</div></div>
    <div class="blog-stat"><span class="blog-stat-value">{posts[0]['date'][:4] if posts else '2026'}</span><div class="blog-stat-label">Latest</div></div>
</section>

<div class="blog-controls">
    <div class="blog-search-box">
        <i class="fas fa-search"></i>
        <input type="text" id="blogSearch" placeholder="Search posts by title, content, or tag...">
    </div>
    <div class="blog-filter-sort">
        <button class="blog-filter-btn active" data-sort="newest"><i class="fas fa-sort-amount-down"></i> Newest</button>
        <button class="blog-filter-btn" data-sort="oldest"><i class="fas fa-sort-amount-up"></i> Oldest</button>
    </div>
</div>

<div class="blog-tag-filters">
    {"".join(tag_chips)}
</div>

<div class="blog-grid" id="blogGrid">
    {"".join(cards)}
    <div class="blog-empty-state" style="display:none">
        <i class="fas fa-search"></i>
        <h3>No posts found</h3>
        <p>Try a different search term or tag.</p>
    </div>
</div>

{pagination_html}

{FOOTER}

{SCRIPTS}
<button class="scroll-to-top" aria-label="Scroll to top"><i class="fas fa-chevron-up"></i></button>
</body>
</html>'''

def build_article_html(post, all_posts):
    """Build individual article page with hero, body, author, related."""
    body_html = md_to_html(post['body'])
    tags_html = ''.join(f'<span class="tag">{html_mod.escape(t)}</span>' for t in post['tags'])
    primary_tag = post['tags'][0] if post['tags'] else 'Research'

    # Related posts
    related = get_related_posts(post, all_posts)
    related_html = ''
    if related:
        related_cards = []
        for rp in related:
            related_cards.append(f'''
            <a href="/blog/{rp['slug']}/" class="blog-related-card">
                <h4>{html_mod.escape(rp['title'])}</h4>
                <div class="related-meta">{rp['date']} &middot; {rp['reading_time']}</div>
            </a>''')
        related_html = f'''
        <section class="blog-related-posts">
            <h2><i class="fas fa-compass"></i> Related Posts</h2>
            <div class="blog-related-grid">{''.join(related_cards)}</div>
        </section>'''

    meta = f'''<title>{html_mod.escape(post['title'])} | Ali Safari</title>
    <meta name="description" content="{html_mod.escape(post['excerpt'])}">
    <meta property="og:title" content="{html_mod.escape(post['title'])}">
    <meta property="og:description" content="{html_mod.escape(post['excerpt'])}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="{SITE_URL}/blog/{post['slug']}/">
    <meta property="og:site_name" content="Ali Safari">
    <meta property="article:published_time" content="{post['date']}">
    <meta property="article:tag" content="{', '.join(post['tags'])}">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="{html_mod.escape(post['title'])}">
    <meta name="twitter:description" content="{html_mod.escape(post['excerpt'])}">'''

    return f'''{HEAD.format(meta=meta)}
<body class="blog-page blog-article-page">
<div class="reading-progress-container"><div class="reading-progress-bar"></div></div>

{NAV}

<div class="blog-article-nav">
    <div class="blog-article-nav-inner">
        <a href="/blog/" class="back-link"><i class="fas fa-arrow-left"></i> Blog</a>
        <span class="nav-title">{html_mod.escape(post['title'])}</span>
        <div class="nav-actions-right">
            <button class="nav-share-btn share-btn" data-platform="copy" title="Copy link"><i class="fas fa-link"></i></button>
        </div>
    </div>
</div>

<article class="blog-article-hero">
    <span class="article-category">{html_mod.escape(primary_tag)}</span>
    <h1>{html_mod.escape(post['title'])}</h1>
    <div class="article-meta-bar">
        <span>{post['date']}</span>
        <span class="meta-sep"></span>
        <span class="meta-reading-time"><i class="far fa-clock"></i> {post['reading_time']}</span>
        <span class="meta-sep"></span>
        <div class="card-tags">{tags_html}</div>
    </div>
</article>

<div class="blog-article-body">
    {body_html}
</div>

<div class="author-card">
    <img src="/images/profile.jpg" alt="Ali Safari" class="author-avatar">
    <div class="author-info">
        <div class="author-name">Ali Safari</div>
        <div class="author-title">PhD Student in Information Systems, University of North Texas</div>
        <div class="author-bio">Researching AI security, trust in AI systems, and agentic intelligence. Writing these posts while studying for comps.</div>
        <div class="author-links">
            <a href="https://linkedin.com/in/ali-safari" target="_blank" aria-label="LinkedIn"><i class="fab fa-linkedin"></i></a>
            <a href="https://scholar.google.com/citations?user=rCosT9sAAAAJ&hl=en" target="_blank" aria-label="Google Scholar"><i class="fas fa-graduation-cap"></i></a>
        </div>
    </div>
</div>

<div class="blog-share-section">
    <h3>Share this post</h3>
    <div class="blog-share-buttons">
        <a href="#" class="blog-share-btn twitter share-btn" data-platform="twitter" aria-label="Share on Twitter"><i class="fab fa-twitter"></i></a>
        <a href="#" class="blog-share-btn linkedin share-btn" data-platform="linkedin" aria-label="Share on LinkedIn"><i class="fab fa-linkedin-in"></i></a>
        <button class="blog-share-btn copy share-btn" data-platform="copy" aria-label="Copy link"><i class="fas fa-link"></i></button>
    </div>
</div>

{related_html}

{FOOTER}

{SCRIPTS}
<button class="scroll-to-top" aria-label="Scroll to top"><i class="fas fa-chevron-up"></i></button>
</body>
</html>'''

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    posts = get_all_posts()
    print(f"Found {len(posts)} posts")

    all_tags = get_all_tags(posts)

    # Write individual article pages
    for p in posts:
        slug_dir = os.path.join(OUTPUT_DIR, p['slug'])
        os.makedirs(slug_dir, exist_ok=True)
        html = build_article_html(p, posts)
        with open(os.path.join(slug_dir, 'index.html'), 'w', encoding='utf-8') as f:
            f.write(html)

    # Write listing pages
    total_pages = (len(posts) + POSTS_PER_PAGE - 1) // POSTS_PER_PAGE
    for page in range(1, total_pages + 1):
        if page == 1:
            path = os.path.join(OUTPUT_DIR, 'index.html')
        else:
            page_dir = os.path.join(OUTPUT_DIR, 'page', str(page))
            os.makedirs(page_dir, exist_ok=True)
            path = os.path.join(page_dir, 'index.html')
        html = build_listing_html(posts, page, total_pages, all_tags)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(html)

    print(f"Generated {len(posts)} article pages + {total_pages} listing pages in {OUTPUT_DIR}")
    print(f"Tags: {len(all_tags)}")

if __name__ == '__main__':
    main()
