#!/usr/bin/env python3
"""Rebuild blog with canonical tags and full SEO."""
import os, re, html as html_mod
from collections import Counter

BLOG_DIR = "/Users/alisafari/Downloads/PHD/UNT/2026/COMPS/alisafari-space/blog"
OUT_DIR = "/Users/alisafari/Projects/space/blog"
SITE = "https://alisafari.space"
PER_PAGE = 20

# ===== CANONICAL CATEGORY MAP (10 categories) =====
CATEGORY_MAP = {
    # IS Theory & Foundations
    "IS theory": "IS Theory",
    "information systems theory": "IS Theory",
    "theory building": "IS Theory",
    "research paradigms": "IS Theory",
    "variance vs process": "IS Theory",
    "causal structure": "IS Theory",
    "emergent perspective": "IS Theory",
    "mechanisms": "IS Theory",
    "Gregor": "IS Theory",
    "Whetten": "IS Theory",
    "Sutton and Staw": "IS Theory",
    "Burton-Jones and Grange": "IS Theory",
    "Burton-Jones et al.": "IS Theory",
    "Burton-Jones": "IS Theory",
    "Baird and Maruping": "IS Theory",
    "delegation theory": "IS Theory",
    "effective use": "IS Theory",
    "DeLone and McLean": "IS Theory",
    "IS success": "IS Theory",
    "IS success model": "IS Theory",
    "Markus and Robey": "IS Theory",
    "Orlikowski and Iacono": "IS Theory",
    "Orlikowski": "IS Theory",
    "Benbasat and Zmud": "IS Theory",
    "Weber": "IS Theory",
    "Weick": "IS Theory",
    "sensemaking": "IS Theory",
    "Mohr": "IS Theory",
    "Markus": "IS Theory",
    "Robey": "IS Theory",
    "Sarker": "IS Theory",
    "Brynjolfsson": "IS Theory",
    "Carr debate": "IS Theory",
    "strategic necessity hypothesis": "IS Theory",
    "IT value": "IS Theory",
    "IT business value": "IS Theory",
    "productivity paradox": "IS Theory",
    "Bharadwaj": "IS Theory",
    "Barney": "IS Theory",
    "Barney VRIN": "IS Theory",
    "technology determinism": "IS Theory",
    "information-systems": "IS Theory",
    "systems thinking": "IS Theory",
    "what is theory": "IS Theory",
    "Gregor and Hevner": "IS Theory",
    "Gregor and Jones": "IS Theory",
    "Beath": "IS Theory",
    "Berente": "IS Theory",
    "Lyytinen": "IS Theory",
    "Yoo": "IS Theory",
    "Boland": "IS Theory",
    "Lyytinen and Yoo": "IS Theory",
    "paradox theory": "IS Theory",
    "Smith Lewis": "IS Theory",
    "organizational tensions": "IS Theory",
    "affordance theory": "IS Theory",
    "boundary objects": "IS Theory",
    "identity theory": "IS Theory",
    "signaling theory": "IS Theory",
    "Spence": "IS Theory",

    # AI & Agentic Systems
    "AI adoption": "AI & Agentic Systems",
    "AI governance": "AI & Agentic Systems",
    "AI ethics": "AI & Agentic Systems",
    "agentic AI": "AI & Agentic Systems",
    "agentic systems": "AI & Agentic Systems",
    "generative AI": "AI & Agentic Systems",
    "machine learning": "AI & Agentic Systems",
    "AI policy": "AI & Agentic Systems",
    "AI regulation": "AI & Agentic Systems",
    "AI alignment": "AI & Agentic Systems",
    "AI safety": "AI & Agentic Systems",
    "AI security": "AI & Agentic Systems",
    "AI strategy": "AI & Agentic Systems",
    "AI implementation": "AI & Agentic Systems",
    "AI hallucination": "AI & Agentic Systems",
    "AI-native development": "AI & Agentic Systems",
    "AI training data": "AI & Agentic Systems",
    "AI chatbots": "AI & Agentic Systems",
    "AI coding tools": "AI & Agentic Systems",
    "AI deployment": "AI & Agentic Systems",
    "AI fairness": "AI & Agentic Systems",
    "AI in healthcare": "AI & Agentic Systems",
    "AI infrastructure": "AI & Agentic Systems",
    "AI literacy": "AI & Agentic Systems",
    "AI monitoring": "AI & Agentic Systems",
    "AI participants": "AI & Agentic Systems",
    "AI research": "AI & Agentic Systems",
    "AI ROI": "AI & Agentic Systems",
    "AI supercomputing": "AI & Agentic Systems",
    "AI sustainability": "AI & Agentic Systems",
    "AI systems": "AI & Agentic Systems",
    "AI training": "AI & Agentic Systems",
    "AI vendors": "AI & Agentic Systems",
    "AI champions": "AI & Agentic Systems",
    "AI agents": "AI & Agentic Systems",
    "AI": "AI & Agentic Systems",
    "Copilot": "AI & Agentic Systems",
    "multiagent systems": "AI & Agentic Systems",
    "vibe coding": "AI & Agentic Systems",
    "enterprise AI": "AI & Agentic Systems",
    "shadow AI": "AI & Agentic Systems",
    "responsible AI": "AI & Agentic Systems",
    "AI energy": "AI & Agentic Systems",
    "Bostrom and Heinen": "AI & Agentic Systems",
    "Liu et al.": "AI & Agentic Systems",
    "Stelmaszak et al.": "AI & Agentic Systems",
    "CARE theory": "AI & Agentic Systems",
    "preemptive security": "AI & Agentic Systems",

    # Technology Adoption
    "technology adoption": "Technology Adoption",
    "TAM": "Technology Adoption",
    "UTAUT": "Technology Adoption",
    "Rogers": "Technology Adoption",
    "diffusion": "Technology Adoption",
    "DOI": "Technology Adoption",
    "adoption frameworks": "Technology Adoption",
    "post-adoption": "Technology Adoption",
    "implementation": "Technology Adoption",
    "IS adoption": "Technology Adoption",
    "IT adoption": "Technology Adoption",
    "expectation confirmation": "Technology Adoption",
    "Bhattacherjee": "Technology Adoption",
    "S-curve": "Technology Adoption",
    "Compeau and Higgins": "Technology Adoption",
    "Bandura": "Technology Adoption",
    "self-efficacy": "Technology Adoption",
    "social cognitive theory": "Technology Adoption",
    "hype cycle": "Technology Adoption",
    "Sarker et al.": "Technology Adoption",
    "Davis": "Technology Adoption",
    "Venkatesh et al.": "Technology Adoption",
    "DeLone": "Technology Adoption",
    "McLean": "Technology Adoption",

    # Trust & Security
    "trust theory": "Trust & Security",
    "trust calibration": "Trust & Security",
    "Lee and See": "Trust & Security",
    "McKnight et al.": "Trust & Security",
    "cybersecurity": "Trust & Security",
    "zero-trust architecture": "Trust & Security",
    "preemptive security": "Trust & Security",
    "privacy": "Trust & Security",
    "data privacy": "Trust & Security",
    "privacy calculus": "Trust & Security",
    "GDPR": "Trust & Security",
    "Protection Motivation Theory": "Trust & Security",
    "AI trust": "Trust & Security",
    "AI security": "Trust & Security",
    "Colonial Pipeline": "Trust & Security",
    "CrowdStrike": "Trust & Security",
    "security": "Trust & Security",
    "zero-trust": "Trust & Security",
    "calibrated trust": "Trust & Security",

    # Sociotechnical Systems
    "sociotechnical": "Sociotechnical Systems",
    "sociotechnical systems": "Sociotechnical Systems",
    "STS": "Sociotechnical Systems",
    "joint optimization": "Sociotechnical Systems",
    "work system theory": "Sociotechnical Systems",
    "work system": "Sociotechnical Systems",
    "Leavitt": "Sociotechnical Systems",
    "Mumford": "Sociotechnical Systems",
    "Trist": "Sociotechnical Systems",
    "adaptive structuration theory": "Sociotechnical Systems",
    "AST": "Sociotechnical Systems",
    "Giddens": "Sociotechnical Systems",
    "structuration theory": "Sociotechnical Systems",
    "technology as structure": "Sociotechnical Systems",
    "duality of technology": "Sociotechnical Systems",
    "DeSanctis and Poole": "Sociotechnical Systems",
    "Orlikowski and Robey": "Sociotechnical Systems",
    "Lamb and Davidson": "Sociotechnical Systems",
    "Bostrom and Heinen": "Sociotechnical Systems",
    "human-computer interaction": "Sociotechnical Systems",
    "HCI": "Sociotechnical Systems",
    "workarounds": "Sociotechnical Systems",
    "coordination": "Sociotechnical Systems",
    "Conway's Law": "Sociotechnical Systems",
    "task-technology fit": "Sociotechnical Systems",
    "TTF": "Sociotechnical Systems",

    # Organizational Theory
    "institutional theory": "Organizational Theory",
    "isomorphism": "Organizational Theory",
    "coercive isomorphism": "Organizational Theory",
    "mimetic isomorphism": "Organizational Theory",
    "normative isomorphism": "Organizational Theory",
    "decoupling": "Organizational Theory",
    "legitimacy": "Organizational Theory",
    "Meyer and Rowan": "Organizational Theory",
    "DiMaggio and Powell": "Organizational Theory",
    "organizational change": "Organizational Theory",
    "organizational learning": "Organizational Theory",
    "organizational theory": "Organizational Theory",
    "organizational context": "Organizational Theory",
    "garbage can model": "Organizational Theory",
    "bounded rationality": "Organizational Theory",
    "agency theory": "Organizational Theory",
    "resource dependency theory": "Organizational Theory",
    "Cohen March Olsen": "Organizational Theory",
    "Cohen and Levinthal": "Organizational Theory",
    "absorptive capacity": "Organizational Theory",
    "Teece": "Organizational Theory",
    "Teece Pisano Shuen": "Organizational Theory",
    "dynamic capabilities": "Organizational Theory",
    "ambidexterity": "Organizational Theory",
    "exploration": "Organizational Theory",
    "exploitation": "Organizational Theory",
    "March": "Organizational Theory",
    "competency trap": "Organizational Theory",
    "change management": "Organizational Theory",
    "stakeholder theory": "Organizational Theory",
    "Freeman": "Organizational Theory",
    "strategic management": "Organizational Theory",
    "RBV": "Organizational Theory",
    "competitive advantage": "Organizational Theory",
    "core competence": "Organizational Theory",
    "Prahalad and Hamel": "Organizational Theory",
    "professional identity": "Organizational Theory",
    "Strich": "Organizational Theory",
    "nonprofit IT": "Organizational Theory",
    "organizational decision making": "Organizational Theory",
    "digital transformation": "Organizational Theory",
    "shadow IT": "Organizational Theory",

    # IT Governance & Strategy
    "IT governance": "IT Governance & Strategy",
    "IS governance": "IT Governance & Strategy",
    "platform governance": "IT Governance & Strategy",
    "data governance": "IT Governance & Strategy",
    "strategic alignment": "IT Governance & Strategy",
    "IT-business alignment": "IT Governance & Strategy",
    "IT strategy": "IT Governance & Strategy",
    "IS strategy": "IT Governance & Strategy",
    "Henderson Venkatraman": "IT Governance & Strategy",
    "COBIT": "IT Governance & Strategy",
    "DAMA": "IT Governance & Strategy",
    "IT capability": "IT Governance & Strategy",
    "IT leadership": "IT Governance & Strategy",
    "IT investment": "IT Governance & Strategy",
    "Chief Data Officer": "IT Governance & Strategy",
    "CIO": "IT Governance & Strategy",
    "business-IT alignment": "IT Governance & Strategy",
    "enterprise architecture": "IT Governance & Strategy",
    "strategic IT": "IT Governance & Strategy",
    "strategy": "IT Governance & Strategy",
    "technology resistance": "IT Governance & Strategy",
    "enterprise IT": "IT Governance & Strategy",
    "IT artifact": "IT Governance & Strategy",

    # IS Research Methods
    "IS research": "IS Research Methods",
    "IS research methods": "IS Research Methods",
    "IS methods": "IS Research Methods",
    "research methods": "IS Research Methods",
    "mixed methods": "IS Research Methods",
    "qualitative research": "IS Research Methods",
    "survey research": "IS Research Methods",
    "design science research": "IS Research Methods",
    "design science": "IS Research Methods",
    "interpretive research": "IS Research Methods",
    "positivism": "IS Research Methods",
    "critical realism": "IS Research Methods",
    "Bhaskar": "IS Research Methods",
    "Creswell": "IS Research Methods",
    "CB-SEM": "IS Research Methods",
    "CFA": "IS Research Methods",
    "CMV": "IS Research Methods",
    "SEM": "IS Research Methods",
    "PLS": "IS Research Methods",
    "methodology": "IS Research Methods",
    "theory testing": "IS Research Methods",
    "empirical research": "IS Research Methods",
    "conceptual research": "IS Research Methods",
    "design theory": "IS Research Methods",
    "ACM": "IS Research Methods",
    "MISQ": "IS Research Methods",
    "ISR": "IS Research Methods",
    "JAIS": "IS Research Methods",
    "EJIS": "IS Research Methods",
    "IS publishing": "IS Research Methods",
    "BPM": "IS Research Methods",
    "business process management": "IS Research Methods",
    "workflow": "IS Research Methods",
    "process mining": "IS Research Methods",
    "action research": "IS Research Methods",
    "ethnography": "IS Research Methods",
    "case study": "IS Research Methods",
    "experiment": "IS Research Methods",
    "longitudinal": "IS Research Methods",
    "cross-sectional": "IS Research Methods",
    "panel data": "IS Research Methods",
    "grounded theory": "IS Research Methods",
    "Strauss and Corbin": "IS Research Methods",
    "Charmaz": "IS Research Methods",

    # Platform & Digital Ecosystems
    "platform governance": "Platforms & Ecosystems",
    "gig economy": "Platforms & Ecosystems",
    "platform labor": "Platforms & Ecosystems",
    "algorithmic management": "Platforms & Ecosystems",
    "platform": "Platforms & Ecosystems",
    "two-sided market": "Platforms & Ecosystems",
    "network effects": "Platforms & Ecosystems",
    "multi-homing": "Platforms & Ecosystems",
    "ecosystem": "Platforms & Ecosystems",
    "complementor": "Platforms & Ecosystems",
    "SaaS": "Platforms & Ecosystems",
    "cloud computing": "Platforms & Ecosystems",
    "enterprise software": "Platforms & Ecosystems",
    "BYOD": "Platforms & Ecosystems",
    "API economy": "Platforms & Ecosystems",
    "DevOps": "Platforms & Ecosystems",
    "agile": "Platforms & Ecosystems",
    "software architecture": "Platforms & Ecosystems",
    "software development": "Platforms & Ecosystems",
    "digital divide": "Platforms & Ecosystems",
    "digital ethics": "Platforms & Ecosystems",
    "environmental impact": "Platforms & Ecosystems",
    "remote work": "Platforms & Ecosystems",
    "public sector IS": "Platforms & Ecosystems",
    "health IT": "Platforms & Ecosystems",
    "EHR": "Platforms & Ecosystems",
    "ERP implementation": "Platforms & Ecosystems",
    "BI tools": "Platforms & Ecosystems",
    "BI&A": "Platforms & Ecosystems",

    # Comps & Field Reflections
    "comps preparation": "Comps & Reflections",
    "comps": "Comps & Reflections",
    "comps prep": "Comps & Reflections",
    "PhD life": "Comps & Reflections",
    "IS and society": "Comps & Reflections",
    "IS ethics": "Comps & Reflections",
    "information systems": "Comps & Reflections",
    "COVID-19": "Comps & Reflections",
    "21st Century Cures Act": "Comps & Reflections",
    "compliance": "Comps & Reflections",
    "project management": "Comps & Reflections",
    "knowledge management": "Comps & Reflections",
    "Nonaka": "Comps & Reflections",
    "business intelligence": "Comps & Reflections",
}

def parse_fm(text):
    m = re.match(r'^---\s*\n(.*?)\n---\s*\n', text, re.DOTALL)
    if not m: return {}, text
    fm = {}
    for line in m.group(1).split('\n'):
        if ':' in line and not line.strip().startswith('-'):
            k,_,v = line.partition(':'); fm[k.strip()] = v.strip().strip('"').strip("'")
    if 'tags' in fm:
        tags = re.findall(r'"([^"]*)"', fm['tags'])
        if not tags: tags = [t.strip() for t in fm['tags'].strip('[]').split(',') if t.strip()]
        fm['tags'] = tags
    body = re.sub(r'\n---\s*\nverification:.*', '', text[m.end():], flags=re.DOTALL)
    return fm, body.strip()

def md_html(text):
    text = text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    parts = []
    for p in re.split(r'\n\n+', text):
        p = p.strip()
        if not p: continue
        if p in ('---', '***'): parts.append('<hr>'); continue
        lines = p.split('\n')
        if all(l.startswith('>') for l in lines if l.strip()):
            qt = '\n'.join(l.lstrip('> ').strip() for l in lines if l.strip())
            qt = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', qt)
            qt = re.sub(r'\*(.+?)\*', r'<em>\1</em>', qt)
            qt = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', qt)
            parts.append(f'<blockquote><p>{qt}</p></blockquote>'); continue
        p = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', p)
        p = re.sub(r'\*(.+?)\*', r'<em>\1</em>', p)
        p = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', p)
        parts.append(f'<p>{"<br>".join(lines)}</p>')
    return '\n'.join(parts)

def canonicalize(raw_tags):
    cats = set()
    for t in raw_tags:
        if t in CATEGORY_MAP: cats.add(CATEGORY_MAP[t])
    if not cats: cats.add("Comps & Reflections")
    return sorted(cats)

def get_posts():
    posts = []
    for fname in sorted(os.listdir(BLOG_DIR)):
        if not fname.endswith('.md') or 'PROMPT' in fname: continue
        with open(os.path.join(BLOG_DIR, fname), 'r', encoding='utf-8') as f:
            content = f.read()
        fm, body = parse_fm(content)
        raw_tags = fm.get('tags', [])
        if isinstance(raw_tags, str):
            raw_tags = [t.strip() for t in raw_tags.strip('[]').split(',') if t.strip()]
        canon = canonicalize(raw_tags)
        if not canon:
            tl = fm.get('title', '').lower()
            if any(w in tl for w in ['ai','agent','gpt','llm','copilot']): canon = ['AI & Agentic Systems']
            elif any(w in tl for w in ['trust','security','privacy','cyber']): canon = ['Trust & Security']
            elif any(w in tl for w in ['adoption','tam','utaut','diffusion']): canon = ['Technology Adoption']
            elif any(w in tl for w in ['theory','paradigm','causal']): canon = ['IS Theory']
            elif any(w in tl for w in ['governance','strategy','alignment']): canon = ['IT Governance & Strategy']
            elif any(w in tl for w in ['institutional','organizational','change']): canon = ['Organizational Theory']
            elif any(w in tl for w in ['sociotechnical','structuration','work system']): canon = ['Sociotechnical Systems']
            elif any(w in tl for w in ['platform','cloud','saas','gig']): canon = ['Platforms & Ecosystems']
            elif any(w in tl for w in ['method','research','survey','design science']): canon = ['IS Research Methods']
            else: canon = ['Comps & Reflections']
        slug = fm.get('slug', fname.replace('2026-05-14-', '').replace('.md', '') if fname.startswith('2026-05-14-') else fname.replace('.md', ''))
        posts.append({
            'slug': slug, 'title': fm.get('title', 'Untitled'),
            'date': fm.get('date', '2026-05-14'),
            'excerpt': fm.get('excerpt', ''), 'tags': canon,
            'reading_time': fm.get('readingTime', '5 min read'),
            'body': body, 'raw_tags': raw_tags,
        })
    posts.sort(key=lambda p: p['date'], reverse=True)
    return posts

def get_tag_counts(posts):
    c = Counter()
    for p in posts:
        for t in p['tags']: c[t] += 1
    return sorted(c.items(), key=lambda x: (-x[1], x[0]))

def related_posts(current, all_posts, n=3):
    cur_tags = set(current['tags'])
    scored = []
    for p in all_posts:
        if p['slug'] == current['slug']: continue
        shared = len(cur_tags & set(p['tags']))
        if shared > 0: scored.append((p, shared))
    scored.sort(key=lambda x: (-x[1], x[0]['date']), reverse=True)
    return [p for p,_ in scored[:n]]

# ===== SHARED COMPONENTS =====
HEAD = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
{meta}
<link rel="icon" type="image/png" href="/images/favicon.png">
<link rel="canonical" href="{canonical}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
<link rel="stylesheet" href="/css/style.css">
<link rel="stylesheet" href="/css/blog.css">
{json_ld}
</head>"""

NAV = """<nav class="navbar" id="navbar"><div class="nav-container">
<a href="/" class="nav-logo"><img src="/images/logo.png" alt="Ali Safari logo" class="logo-img"></a>
<ul class="nav-links">
<li><a href="/">Home</a></li>
<li><a href="/blog/" class="active">Blog</a></li>
<li><a href="/roadmap.html">AI Roadmap</a></li>
<li><a href="/conferences/">Conferences</a></li>
<li><a href="/#contact">Contact</a></li>
</ul>
<div class="nav-actions">
<button class="theme-toggle" id="themeToggle" aria-label="Toggle dark mode"><i class="fas fa-moon"></i></button>
<button class="mobile-menu-btn" id="mobileMenuBtn" aria-label="Toggle menu"><span></span><span></span><span></span></button>
</div>
</div></nav>"""

BREADCRUMB_LISTING = """<nav aria-label="breadcrumb" class="breadcrumb"><div class="breadcrumb-inner">
<ol itemscope itemtype="https://schema.org/BreadcrumbList">
<li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
<a itemprop="item" href="/"><span itemprop="name">Home</span></a><meta itemprop="position" content="1">
</li>
<li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
<span itemprop="name">Blog</span><meta itemprop="position" content="2">
</li>
</ol>
</div></nav>"""

BREADCRUMB_ARTICLE = """<nav aria-label="breadcrumb" class="breadcrumb"><div class="breadcrumb-inner">
<ol itemscope itemtype="https://schema.org/BreadcrumbList">
<li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
<a itemprop="item" href="/"><span itemprop="name">Home</span></a><meta itemprop="position" content="1">
</li>
<li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
<a itemprop="item" href="/blog/"><span itemprop="name">Blog</span></a><meta itemprop="position" content="2">
</li>
<li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
<span itemprop="name">{title}</span><meta itemprop="position" content="3">
</li>
</ol>
</div></nav>"""

FOOTER = """<footer class="footer"><div class="footer-content">
<div class="footer-logo"><span>Ali Safari</span><p>PhD Researcher | University of North Texas</p></div>
<ul class="footer-links">
<li><a href="/">Home</a></li>
<li><a href="/blog/">Blog</a></li>
<li><a href="/roadmap.html">AI Roadmap</a></li>
<li><a href="/conferences/">Conferences</a></li>
</ul>
<div class="footer-social">
<a href="https://linkedin.com/in/ali-safari" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><i class="fab fa-linkedin"></i></a>
<a href="https://scholar.google.com/citations?user=rCosT9sAAAAJ&hl=en" target="_blank" rel="noopener noreferrer" aria-label="Google Scholar"><i class="fas fa-graduation-cap"></i></a>
</div>
</div>
<div class="footer-bottom"><p>&copy; 2026 Ali Safari. All rights reserved.</p></div>
</footer>"""

SCRIPTS = """<script src="/js/blog.js"></script>
<button class="scroll-to-top" aria-label="Scroll to top"><i class="fas fa-chevron-up"></i></button>"""

def build_listing(posts, page=1, total_pages=1, tag_counts=None):
    start, end = (page-1)*PER_PAGE, page*PER_PAGE
    page_posts = posts[start:end]
    tag_chips = ['<a href="#" class="blog-tag-chip active" data-tag="all">All <span class="tag-count">{}</span></a>'.format(len(posts))]
    if tag_counts:
        for tag, count in tag_counts:
            tag_chips.append('<a href="#" class="blog-tag-chip" data-tag="{}">{} <span class="tag-count">{}</span></a>'.format(
                html_mod.escape(tag), html_mod.escape(tag), count))
    cards = []
    for p in page_posts:
        tags_csv = ','.join(p['tags'])
        tags_html = ''.join('<span class="tag">{}</span>'.format(html_mod.escape(t)) for t in p['tags'])
        excerpt = p['excerpt'][:160] + ('...' if len(p['excerpt']) > 160 else '')
        cards.append(f'''<div class="blog-grid-item" data-title="{html_mod.escape(p['title'].lower())}" data-excerpt="{html_mod.escape(p['excerpt'].lower())}" data-tags="{html_mod.escape(tags_csv)}" data-date="{p['date']}">
<article class="blog-post-card">
<div class="card-header">
<div class="card-meta"><span>{p['date']}</span><span class="reading-time"><i class="far fa-clock"></i> {p['reading_time']}</span></div>
<h2><a href="/blog/{p['slug']}/">{html_mod.escape(p['title'])}</a></h2>
</div>
<p class="card-excerpt">{html_mod.escape(excerpt)}</p>
<div class="card-footer">
<div class="card-tags">{tags_html}</div>
<a href="/blog/{p['slug']}/" class="read-link">Read <i class="fas fa-arrow-right"></i></a>
</div>
</article>
</div>''')
    pag = ''
    if total_pages > 1:
        pages = []
        for i in range(1, total_pages+1):
            if i == page: pages.append(f'<span class="current">{i}</span>')
            elif i == 1: pages.append(f'<a href="/blog/">{i}</a>')
            else: pages.append(f'<a href="/blog/page/{i}/">{i}</a>')
        pag = f'<div class="blog-pagination">{ "".join(pages) }</div>'
    meta = f'<title>Blog | Ali Safari</title><meta name="description" content="Ali Safari\'s blog on Information Systems research, AI, security, and theory. {len(posts)} posts covering IS theory, technology adoption, AI governance, and more."><meta name="keywords" content="information systems, IS theory, AI, technology adoption, trust, security, blog"><meta property="og:title" content="Blog | Ali Safari"><meta property="og:description" content="Information Systems research, AI, and theory — {len(posts)} posts."><meta property="og:type" content="website"><meta property="og:url" content="{SITE}/blog/"><meta property="og:site_name" content="Ali Safari"><meta name="twitter:card" content="summary"><meta name="twitter:site" content="@alisafari">'
    canonical = f'{SITE}/blog/'
    json_ld = f'<script type="application/ld+json">{{"@context":"https://schema.org","@type":"Blog","name":"Ali Safari Blog","description":"Thoughts on IS theory, AI, technology, and comps studying.","url":"{SITE}/blog/","author":{{"@type":"Person","name":"Ali Safari","url":"{SITE}"}}}}</script>'
    return f"""{HEAD.format(meta=meta, canonical=canonical, json_ld=json_ld)}
<body class="blog-page">
{NAV}
{BREADCRUMB_LISTING}
<header class="blog-header">
<h1>Blog</h1>
<p class="blog-subtitle">Thoughts on IS theory, AI, technology, and comps studying. No summaries, just honest reactions.</p>
<div class="blog-meta">
<span class="blog-meta-item"><i class="fas fa-pen-nib"></i> {len(posts)} posts</span>
<span class="blog-meta-item"><i class="fas fa-tags"></i> {len(tag_counts) if tag_counts else 0} topics</span>
</div>
</header>
<section class="blog-stats-bar">
<div class="blog-stat"><span class="blog-stat-value">{len(posts)}</span><div class="blog-stat-label">Posts</div></div>
<div class="blog-stat"><span class="blog-stat-value">{len(tag_counts) if tag_counts else 0}</span><div class="blog-stat-label">Topics</div></div>
<div class="blog-stat"><span class="blog-stat-value">{posts[0]['date'][:4] if posts else '2026'}</span><div class="blog-stat-label">Latest</div></div>
</section>
<div class="blog-controls">
<div class="blog-search-box"><i class="fas fa-search"></i><input type="text" id="blogSearch" placeholder="Search posts by title or content..."></div>
<div class="blog-filter-sort">
<button class="blog-filter-btn active" data-sort="newest"><i class="fas fa-sort-amount-down"></i> Newest</button>
<button class="blog-filter-btn" data-sort="oldest"><i class="fas fa-sort-amount-up"></i> Oldest</button>
</div>
</div>
<div class="blog-tag-filters">{''.join(tag_chips)}</div>
<div class="blog-grid" id="blogGrid">
{''.join(cards)}
<div class="blog-empty-state" style="display:none"><i class="fas fa-search"></i><h3>No posts found</h3><p>Try a different search term.</p></div>
</div>
{pag}
{FOOTER}
{SCRIPTS}
</body></html>"""

def build_article(post, all_posts):
    body_html = md_html(post['body'])
    tags_html = ''.join(f'<span class="tag">{html_mod.escape(t)}</span>' for t in post['tags'])
    primary = post['tags'][0] if post['tags'] else 'Research'
    related = related_posts(post, all_posts)
    rel_html = ''
    if related:
        rc = ''.join(f'<a href="/blog/{p["slug"]}/" class="blog-related-card"><h4>{html_mod.escape(p["title"])}</h4><div class="related-meta">{p["date"]} &middot; {p["reading_time"]}</div></a>' for p in related)
        rel_html = f'<section class="blog-related-posts"><h2><i class="fas fa-compass"></i> Related Posts</h2><div class="blog-related-grid">{rc}</div></section>'
    meta = f'<title>{html_mod.escape(post["title"])} | Ali Safari</title><meta name="description" content="{html_mod.escape(post["excerpt"])}"><meta name="keywords" content="{", ".join(post["tags"])}, information systems, research"><meta property="og:title" content="{html_mod.escape(post["title"])}"><meta property="og:description" content="{html_mod.escape(post["excerpt"])}"><meta property="og:type" content="article"><meta property="og:url" content="{SITE}/blog/{post["slug"]}/"><meta property="og:site_name" content="Ali Safari"><meta property="article:published_time" content="{post["date"]}"><meta property="article:tag" content="{", ".join(post["tags"])}"><meta name="twitter:card" content="summary"><meta name="twitter:site" content="@alisafari">'
    canonical = f'{SITE}/blog/{post["slug"]}/'
    json_ld = f'''<script type="application/ld+json">{{"@context":"https://schema.org","@type":"BlogPosting","headline":"{html_mod.escape(post["title"])}","description":"{html_mod.escape(post["excerpt"])}","url":"{SITE}/blog/{post["slug"]}/","datePublished":"{post["date"]}","author":{{"@type":"Person","name":"Ali Safari","url":"{SITE}"}},"publisher":{{"@type":"Organization","name":"Ali Safari","logo":{{"@type":"ImageObject","url":"{SITE}/images/logo.png"}}}},"articleSection":"{primary}","keywords":"{", ".join(post["tags"])}"}}</script>'''
    return f"""{HEAD.format(meta=meta, canonical=canonical, json_ld=json_ld)}
<body class="blog-page blog-article-page">
<div class="reading-progress-container"><div class="reading-progress-bar"></div></div>
{NAV}
{BREADCRUMB_ARTICLE.format(title=html_mod.escape(post['title']))}
<div class="blog-article-nav"><div class="blog-article-nav-inner">
<a href="/blog/" class="back-link"><i class="fas fa-arrow-left"></i> Blog</a>
<span class="nav-title">{html_mod.escape(post['title'])}</span>
<div class="nav-actions-right"><button class="nav-share-btn share-btn" data-platform="copy" title="Copy link"><i class="fas fa-link"></i></button></div>
</div></div>
<article class="blog-article-hero">
<span class="article-category">{html_mod.escape(primary)}</span>
<h1>{html_mod.escape(post['title'])}</h1>
<div class="article-meta-bar">
<span>{post['date']}</span><span class="meta-sep"></span>
<span class="meta-reading-time"><i class="far fa-clock"></i> {post['reading_time']}</span>
<span class="meta-sep"></span>
<div class="card-tags">{tags_html}</div>
</div>
</article>
<div class="blog-article-body">
{body_html}
</div>
<div class="author-card">
<img src="/images/profile.jpg" alt="Ali Safari - PhD student at UNT researching AI and IS" class="author-avatar" loading="lazy">
<div class="author-info">
<div class="author-name">Ali Safari</div>
<div class="author-title">PhD Student in Information Systems, University of North Texas</div>
<div class="author-bio">Researching AI security, trust in AI systems, and agentic intelligence. Writing while studying for comps.</div>
<div class="author-links">
<a href="https://linkedin.com/in/ali-safari" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><i class="fab fa-linkedin"></i></a>
<a href="https://scholar.google.com/citations?user=rCosT9sAAAAJ&hl=en" target="_blank" rel="noopener noreferrer" aria-label="Google Scholar"><i class="fas fa-graduation-cap"></i></a>
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
{rel_html}
{FOOTER}
{SCRIPTS}
</body></html>"""

def generate_robots_txt():
    return f"""User-agent: *
Allow: /
Disallow: /api/
Disallow: /debug-
Sitemap: {SITE}/sitemap.xml
"""

def generate_sitemap(posts):
    urls = [f'<url><loc>{SITE}/blog/</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>']
    total_pages = (len(posts) + PER_PAGE - 1) // PER_PAGE
    for i in range(2, total_pages + 1):
        urls.append(f'<url><loc>{SITE}/blog/page/{i}/</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>')
    for p in posts:
        urls.append(f'<url><loc>{SITE}/blog/{p["slug"]}/</loc><lastmod>{p["date"]}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>')
    return f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{ "".join(urls) }</urlset>'

def main():
    import shutil
    if os.path.exists(OUT_DIR): shutil.rmtree(OUT_DIR)
    os.makedirs(OUT_DIR, exist_ok=True)
    posts = get_posts()
    tag_counts = get_tag_counts(posts)
    print(f"Posts: {len(posts)}, Tags: {len(tag_counts)}")
    for tag, count in tag_counts:
        print(f"  {count:3d} | {tag}")
    for p in posts:
        d = os.path.join(OUT_DIR, p['slug'])
        os.makedirs(d, exist_ok=True)
        with open(os.path.join(d, 'index.html'), 'w', encoding='utf-8') as f:
            f.write(build_article(p, posts))
    total_pages = (len(posts) + PER_PAGE - 1) // PER_PAGE
    for page in range(1, total_pages + 1):
        if page == 1:
            path = os.path.join(OUT_DIR, 'index.html')
        else:
            pd = os.path.join(OUT_DIR, 'page', str(page))
            os.makedirs(pd, exist_ok=True)
            path = os.path.join(pd, 'index.html')
        with open(path, 'w', encoding='utf-8') as f:
            f.write(build_listing(posts, page, total_pages, tag_counts))
    # Write robots.txt
    with open(os.path.join(OUT_DIR, 'robots.txt'), 'w', encoding='utf-8') as f:
        f.write(generate_robots_txt())
    # Write sitemap.xml
    with open(os.path.join(OUT_DIR, 'sitemap.xml'), 'w', encoding='utf-8') as f:
        f.write(generate_sitemap(posts))
    print(f"Done: {len(posts)} articles, {total_pages} listing pages, robots.txt, sitemap.xml")

if __name__ == '__main__':
    main()
