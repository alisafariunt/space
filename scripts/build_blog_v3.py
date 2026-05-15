#!/usr/bin/env python3
"""Comprehensive blog builder with all 10 enhancements."""
import os, re, html as html_mod, json
from collections import Counter, defaultdict
from datetime import datetime

BLOG_DIR = "/Users/alisafari/Downloads/PHD/UNT/2026/COMPS/alisafari-space/blog"
OUT_DIR = "/Users/alisafari/Projects/space/blog"
SITE = "https://alisafari.space"
PER_PAGE = 20

CATEGORY_MAP = {  # (same canonical mapping as v2)
    "IS theory": "IS Theory", "information systems theory": "IS Theory", "theory building": "IS Theory",
    "research paradigms": "IS Theory", "variance vs process": "IS Theory", "causal structure": "IS Theory",
    "emergent perspective": "IS Theory", "mechanisms": "IS Theory", "Gregor": "IS Theory",
    "Whetten": "IS Theory", "Sutton and Staw": "IS Theory", "Burton-Jones and Grange": "IS Theory",
    "Burton-Jones et al.": "IS Theory", "Burton-Jones": "IS Theory", "Baird and Maruping": "IS Theory",
    "delegation theory": "IS Theory", "effective use": "IS Theory", "DeLone and McLean": "IS Theory",
    "IS success": "IS Theory", "IS success model": "IS Theory", "Markus and Robey": "IS Theory",
    "Orlikowski and Iacono": "IS Theory", "Orlikowski": "IS Theory", "Benbasat and Zmud": "IS Theory",
    "Weber": "IS Theory", "Weick": "IS Theory", "sensemaking": "IS Theory", "Mohr": "IS Theory",
    "Markus": "IS Theory", "Robey": "IS Theory", "Sarker": "IS Theory", "Brynjolfsson": "IS Theory",
    "Carr debate": "IS Theory", "strategic necessity hypothesis": "IS Theory", "IT value": "IS Theory",
    "IT business value": "IS Theory", "productivity paradox": "IS Theory", "Bharadwaj": "IS Theory",
    "Barney": "IS Theory", "Barney VRIN": "IS Theory", "technology determinism": "IS Theory",
    "information-systems": "IS Theory", "systems thinking": "IS Theory", "what is theory": "IS Theory",
    "Gregor and Hevner": "IS Theory", "Gregor and Jones": "IS Theory", "Beath": "IS Theory",
    "Berente": "IS Theory", "Lyytinen": "IS Theory", "Yoo": "IS Theory", "Boland": "IS Theory",
    "Lyytinen and Yoo": "IS Theory", "paradox theory": "IS Theory", "Smith Lewis": "IS Theory",
    "organizational tensions": "IS Theory", "affordance theory": "IS Theory", "boundary objects": "IS Theory",
    "identity theory": "IS Theory", "signaling theory": "IS Theory", "Spence": "IS Theory",
    "AI adoption": "AI & Agentic Systems", "AI governance": "AI & Agentic Systems", "AI ethics": "AI & Agentic Systems",
    "agentic AI": "AI & Agentic Systems", "agentic systems": "AI & Agentic Systems", "generative AI": "AI & Agentic Systems",
    "machine learning": "AI & Agentic Systems", "AI policy": "AI & Agentic Systems", "AI regulation": "AI & Agentic Systems",
    "AI alignment": "AI & Agentic Systems", "AI safety": "AI & Agentic Systems", "AI security": "AI & Agentic Systems",
    "AI strategy": "AI & Agentic Systems", "AI implementation": "AI & Agentic Systems", "AI hallucination": "AI & Agentic Systems",
    "AI-native development": "AI & Agentic Systems", "AI training data": "AI & Agentic Systems", "AI chatbots": "AI & Agentic Systems",
    "AI coding tools": "AI & Agentic Systems", "AI deployment": "AI & Agentic Systems", "AI fairness": "AI & Agentic Systems",
    "AI in healthcare": "AI & Agentic Systems", "AI infrastructure": "AI & Agentic Systems", "AI literacy": "AI & Agentic Systems",
    "AI monitoring": "AI & Agentic Systems", "AI participants": "AI & Agentic Systems", "AI research": "AI & Agentic Systems",
    "AI ROI": "AI & Agentic Systems", "AI supercomputing": "AI & Agentic Systems", "AI sustainability": "AI & Agentic Systems",
    "AI systems": "AI & Agentic Systems", "AI training": "AI & Agentic Systems", "AI vendors": "AI & Agentic Systems",
    "AI champions": "AI & Agentic Systems", "AI agents": "AI & Agentic Systems", "AI": "AI & Agentic Systems",
    "Copilot": "AI & Agentic Systems", "multiagent systems": "AI & Agentic Systems", "vibe coding": "AI & Agentic Systems",
    "enterprise AI": "AI & Agentic Systems", "shadow AI": "AI & Agentic Systems", "responsible AI": "AI & Agentic Systems",
    "AI energy": "AI & Agentic Systems", "Bostrom and Heinen": "AI & Agentic Systems", "Liu et al.": "AI & Agentic Systems",
    "Stelmaszak et al.": "AI & Agentic Systems", "CARE theory": "AI & Agentic Systems", "preemptive security": "AI & Agentic Systems",
    "technology adoption": "Technology Adoption", "TAM": "Technology Adoption", "UTAUT": "Technology Adoption",
    "Rogers": "Technology Adoption", "diffusion": "Technology Adoption", "DOI": "Technology Adoption",
    "adoption frameworks": "Technology Adoption", "post-adoption": "Technology Adoption", "implementation": "Technology Adoption",
    "IS adoption": "Technology Adoption", "IT adoption": "Technology Adoption", "expectation confirmation": "Technology Adoption",
    "Bhattacherjee": "Technology Adoption", "S-curve": "Technology Adoption", "Compeau and Higgins": "Technology Adoption",
    "Bandura": "Technology Adoption", "self-efficacy": "Technology Adoption", "social cognitive theory": "Technology Adoption",
    "hype cycle": "Technology Adoption", "Sarker et al.": "Technology Adoption", "Davis": "Technology Adoption",
    "Venkatesh et al.": "Technology Adoption", "DeLone": "Technology Adoption", "McLean": "Technology Adoption",
    "trust theory": "Trust & Security", "trust calibration": "Trust & Security", "Lee and See": "Trust & Security",
    "McKnight et al.": "Trust & Security", "cybersecurity": "Trust & Security", "zero-trust architecture": "Trust & Security",
    "preemptive security": "Trust & Security", "privacy": "Trust & Security", "data privacy": "Trust & Security",
    "privacy calculus": "Trust & Security", "GDPR": "Trust & Security", "Protection Motivation Theory": "Trust & Security",
    "AI trust": "Trust & Security", "AI security": "Trust & Security", "Colonial Pipeline": "Trust & Security",
    "CrowdStrike": "Trust & Security", "security": "Trust & Security", "zero-trust": "Trust & Security", "calibrated trust": "Trust & Security",
    "sociotechnical": "Sociotechnical Systems", "sociotechnical systems": "Sociotechnical Systems", "STS": "Sociotechnical Systems",
    "joint optimization": "Sociotechnical Systems", "work system theory": "Sociotechnical Systems", "work system": "Sociotechnical Systems",
    "Leavitt": "Sociotechnical Systems", "Mumford": "Sociotechnical Systems", "Trist": "Sociotechnical Systems",
    "adaptive structuration theory": "Sociotechnical Systems", "AST": "Sociotechnical Systems", "Giddens": "Sociotechnical Systems",
    "structuration theory": "Sociotechnical Systems", "technology as structure": "Sociotechnical Systems",
    "duality of technology": "Sociotechnical Systems", "DeSanctis and Poole": "Sociotechnical Systems",
    "Orlikowski and Robey": "Sociotechnical Systems", "Lamb and Davidson": "Sociotechnical Systems",
    "Bostrom and Heinen": "Sociotechnical Systems", "human-computer interaction": "Sociotechnical Systems",
    "HCI": "Sociotechnical Systems", "workarounds": "Sociotechnical Systems", "coordination": "Sociotechnical Systems",
    "Conway's Law": "Sociotechnical Systems", "task-technology fit": "Sociotechnical Systems", "TTF": "Sociotechnical Systems",
    "institutional theory": "Organizational Theory", "isomorphism": "Organizational Theory", "coercive isomorphism": "Organizational Theory",
    "mimetic isomorphism": "Organizational Theory", "normative isomorphism": "Organizational Theory", "decoupling": "Organizational Theory",
    "legitimacy": "Organizational Theory", "Meyer and Rowan": "Organizational Theory", "DiMaggio and Powell": "Organizational Theory",
    "organizational change": "Organizational Theory", "organizational learning": "Organizational Theory",
    "organizational theory": "Organizational Theory", "organizational context": "Organizational Theory",
    "garbage can model": "Organizational Theory", "bounded rationality": "Organizational Theory", "agency theory": "Organizational Theory",
    "resource dependency theory": "Organizational Theory", "Cohen March Olsen": "Organizational Theory",
    "Cohen and Levinthal": "Organizational Theory", "absorptive capacity": "Organizational Theory", "Teece": "Organizational Theory",
    "Teece Pisano Shuen": "Organizational Theory", "dynamic capabilities": "Organizational Theory", "ambidexterity": "Organizational Theory",
    "exploration": "Organizational Theory", "exploitation": "Organizational Theory", "March": "Organizational Theory",
    "competency trap": "Organizational Theory", "change management": "Organizational Theory", "stakeholder theory": "Organizational Theory",
    "Freeman": "Organizational Theory", "strategic management": "Organizational Theory", "RBV": "Organizational Theory",
    "competitive advantage": "Organizational Theory", "core competence": "Organizational Theory",
    "Prahalad and Hamel": "Organizational Theory", "professional identity": "Organizational Theory",
    "Strich": "Organizational Theory", "nonprofit IT": "Organizational Theory", "organizational decision making": "Organizational Theory",
    "digital transformation": "Organizational Theory", "shadow IT": "Organizational Theory",
    "IT governance": "IT Governance & Strategy", "IS governance": "IT Governance & Strategy", "platform governance": "IT Governance & Strategy",
    "data governance": "IT Governance & Strategy", "strategic alignment": "IT Governance & Strategy",
    "IT-business alignment": "IT Governance & Strategy", "IT strategy": "IT Governance & Strategy", "IS strategy": "IT Governance & Strategy",
    "Henderson Venkatraman": "IT Governance & Strategy", "COBIT": "IT Governance & Strategy", "DAMA": "IT Governance & Strategy",
    "IT capability": "IT Governance & Strategy", "IT leadership": "IT Governance & Strategy", "IT investment": "IT Governance & Strategy",
    "Chief Data Officer": "IT Governance & Strategy", "CIO": "IT Governance & Strategy", "business-IT alignment": "IT Governance & Strategy",
    "enterprise architecture": "IT Governance & Strategy", "strategic IT": "IT Governance & Strategy", "strategy": "IT Governance & Strategy",
    "technology resistance": "IT Governance & Strategy", "enterprise IT": "IT Governance & Strategy", "IT artifact": "IT Governance & Strategy",
    "IS research": "IS Research Methods", "IS research methods": "IS Research Methods", "IS methods": "IS Research Methods",
    "research methods": "IS Research Methods", "mixed methods": "IS Research Methods", "qualitative research": "IS Research Methods",
    "survey research": "IS Research Methods", "design science research": "IS Research Methods", "design science": "IS Research Methods",
    "interpretive research": "IS Research Methods", "positivism": "IS Research Methods", "critical realism": "IS Research Methods",
    "Bhaskar": "IS Research Methods", "Creswell": "IS Research Methods", "CB-SEM": "IS Research Methods", "CFA": "IS Research Methods",
    "CMV": "IS Research Methods", "SEM": "IS Research Methods", "PLS": "IS Research Methods", "methodology": "IS Research Methods",
    "theory testing": "IS Research Methods", "empirical research": "IS Research Methods", "conceptual research": "IS Research Methods",
    "design theory": "IS Research Methods", "ACM": "IS Research Methods", "MISQ": "IS Research Methods", "ISR": "IS Research Methods",
    "JAIS": "IS Research Methods", "EJIS": "IS Research Methods", "IS publishing": "IS Research Methods", "BPM": "IS Research Methods",
    "business process management": "IS Research Methods", "workflow": "IS Research Methods", "process mining": "IS Research Methods",
    "action research": "IS Research Methods", "ethnography": "IS Research Methods", "case study": "IS Research Methods",
    "experiment": "IS Research Methods", "longitudinal": "IS Research Methods", "cross-sectional": "IS Research Methods",
    "panel data": "IS Research Methods", "grounded theory": "IS Research Methods", "Strauss and Corbin": "IS Research Methods",
    "Charmaz": "IS Research Methods",
    "platform governance": "Platforms & Ecosystems", "gig economy": "Platforms & Ecosystems", "platform labor": "Platforms & Ecosystems",
    "algorithmic management": "Platforms & Ecosystems", "platform": "Platforms & Ecosystems", "two-sided market": "Platforms & Ecosystems",
    "network effects": "Platforms & Ecosystems", "multi-homing": "Platforms & Ecosystems", "ecosystem": "Platforms & Ecosystems",
    "complementor": "Platforms & Ecosystems", "SaaS": "Platforms & Ecosystems", "cloud computing": "Platforms & Ecosystems",
    "enterprise software": "Platforms & Ecosystems", "BYOD": "Platforms & Ecosystems", "API economy": "Platforms & Ecosystems",
    "DevOps": "Platforms & Ecosystems", "agile": "Platforms & Ecosystems", "software architecture": "Platforms & Ecosystems",
    "software development": "Platforms & Ecosystems", "digital divide": "Platforms & Ecosystems", "digital ethics": "Platforms & Ecosystems",
    "environmental impact": "Platforms & Ecosystems", "remote work": "Platforms & Ecosystems", "public sector IS": "Platforms & Ecosystems",
    "health IT": "Platforms & Ecosystems", "EHR": "Platforms & Ecosystems", "ERP implementation": "Platforms & Ecosystems",
    "BI tools": "Platforms & Ecosystems", "BI&A": "Platforms & Ecosystems",
    "comps preparation": "Comps & Reflections", "comps": "Comps & Reflections", "comps prep": "Comps & Reflections",
    "PhD life": "Comps & Reflections", "IS and society": "Comps & Reflections", "IS ethics": "Comps & Reflections",
    "information systems": "Comps & Reflections", "COVID-19": "Comps & Reflections", "21st Century Cures Act": "Comps & Reflections",
    "compliance": "Comps & Reflections", "project management": "Comps & Reflections", "knowledge management": "Comps & Reflections",
    "Nonaka": "Comps & Reflections", "business intelligence": "Comps & Reflections",
}

CATEGORY_DESCRIPTIONS = {
    "IS Theory": "Core theoretical foundations of the Information Systems discipline — theory building, variance vs. process, causal structure, and the evolution of IS constructs.",
    "AI & Agentic Systems": "Artificial intelligence, generative AI, agentic systems, and the governance, trust, and adoption challenges they create for organizations.",
    "Technology Adoption": "Frameworks and empirical research on how individuals and organizations adopt, use, and continue using information technologies.",
    "Trust & Security": "Trust calibration, cybersecurity, privacy, and the human factors that determine whether people rely on secure systems.",
    "Sociotechnical Systems": "The interplay between social and technical subsystems — structuration theory, work systems, joint optimization, and adaptive design.",
    "Organizational Theory": "Institutional theory, dynamic capabilities, organizational learning, ambidexterity, and how organizations change and adapt.",
    "IT Governance & Strategy": "Strategic alignment, IT governance, data governance, platform governance, and how organizations make technology investment decisions.",
    "IS Research Methods": "Design science, empirical methods, mixed methods, SEM, survey design, and the methodological foundations of IS scholarship.",
    "Platforms & Ecosystems": "Digital platforms, SaaS, cloud ecosystems, gig economy, multi-sided markets, and the governance of digital infrastructure.",
    "Comps & Reflections": "Personal reflections, comps preparation notes, PhD life, and field-level observations on the practice of IS research.",
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
        parts.append(f'<p>{"<br>".join(p.split("\n"))}</p>')
    return '\n'.join(parts)

def slugify(text):
    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')

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

def detect_series(posts):
    """Detect post series by slug prefix (e.g., 'comps-*', 'ai-adoption-*')."""
    prefix_groups = defaultdict(list)
    for p in posts:
        parts = p['slug'].split('-')
        if len(parts) >= 2:
            prefix = parts[0]
            prefix_groups[prefix].append(p)
    
    series_map = {}
    for prefix, group in prefix_groups.items():
        if len(group) >= 3 and prefix not in ('the', 'a', 'an', 'is', 'it', 'to', 'of', 'in', 'for', 'on', 'with', 'by', 'from', 'at', 'as', 'and', 'or', 'not', 'but', 'this', 'that', 'what', 'when', 'where', 'why', 'how', 'who', 'which', 'all', 'if', 'one', 'two', 'my', 'new', 'stop', 'big', 'does', 'can', 'will', 'has', 'had', 'get', 'go', 'do', 'up', 'out', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'every', 'some', 'any', 'no', 'each', 'few', 'more', 'most', 'other', 'such', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'now', 'way', 'may', 'use', 'make', 'over', 'still', 'its', 'also', 'back', 'after', 'first', 'well', 'water', 'been', 'call', 'who', 'oil', 'sit', 'set', 'run', 'eat', 'far', 'sea', 'eye', 'ago', 'off', 'old', 'tell', 'very', 'put', 'end', 'why', 'did', 'keep', 'let', 'help', 'show', 'house', 'try', 'ask', 'men', 'change', 'went', 'light', 'kind', 'need', 'feel', 'seem', 'turn', 'hand', 'high', 'sure', 'upon', 'head', 'open', 'case', 'show', 'live', 'play', 'went', 'told', 'seen', 'heard', 'began', 'given', 'found', 'taken', 'known', 'thought', 'brought', 'held', 'felt', 'left', 'kept', 'sent', 'built', 'spent', 'meant', 'learnt', 'dealt', 'lost', 'grown', 'drawn', 'broken', 'chosen', 'frozen', 'spoken', 'stolen', 'woken', 'driven', 'risen', 'shaken', 'written', 'ridden', 'hidden', 'bitten', 'smelt', 'spelt'):
            group.sort(key=lambda p: p['slug'])
            series_name = prefix.replace('-', ' ').title()
            for i, p in enumerate(group):
                series_map[p['slug']] = {
                    'name': series_name,
                    'current': i + 1,
                    'total': len(group),
                    'posts': group
                }
    return series_map

def generate_toc(body_html):
    """Extract h2 headings, return (<li> items string, anchored body_html)."""
    headings = re.findall(r'<h2>([^<]+)</h2>', body_html)
    if not headings: return "", body_html

    toc_items = []
    for i, heading in enumerate(headings, 1):
        anchor = slugify(heading)
        num = f'{i:02d}'
        toc_items.append(
            f'<li><span class="toc-n">{num}</span>'
            f'<span class="toc-t"><a href="#{anchor}">{html_mod.escape(heading)}</a></span></li>'
        )
        body_html = body_html.replace(
            f'<h2>{heading}</h2>',
            f'<h2 id="{anchor}">{html_mod.escape(heading)}</h2>', 1
        )

    return ''.join(toc_items), body_html

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
<html lang="en" data-palette="paper">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
{meta}
<link rel="icon" type="image/png" href="/images/favicon.png">
<link rel="canonical" href="{canonical}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,300;1,6..72,400;1,6..72,500&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/style.css">
<link rel="stylesheet" href="/css/blog.css">
{json_ld}
</head>"""

NAV = """<nav class="nav">
<a href="/" class="nav-brand">Ali Safari</a>
<ul class="nav-links">
<li><a href="/">Home</a></li>
<li><a href="/blog/" class="active">Field Notes.</a></li>
<li><a href="/roadmap.html">Roadmap</a></li>
<li><a href="/conferences/">Conferences</a></li>
<li><a href="/#contact">Contact</a></li>
</ul>
</nav>"""

FOOTER = """<footer class="footer-simple">
<span class="footer-brand">Ali Safari.</span>
<nav class="footer-links">
<a href="/">Home</a>
<a href="/blog/">Field Notes.</a>
<a href="/roadmap.html">Roadmap</a>
<a href="/conferences/">Conferences</a>
<a href="/#contact">Contact</a>
</nav>
<div class="footer-copy">
<span>&copy; 2026 Ali Safari &middot; University of North Texas</span>
<span>Set in Nunito &amp; JetBrains Mono</span>
</div>
</footer>"""

SCRIPTS = """<script src="/js/blog.js"></script>
<script src="/js/tweaks.js"></script>"""

def build_listing(posts, page=1, total_pages=1, tag_counts=None, active_tag=None):
    start, end = (page-1)*PER_PAGE, page*PER_PAGE
    page_posts = posts[start:end]

    # Tag chips
    chips = [f'<button class="tag-chip{" on" if not active_tag else ""}" data-tag="all">All <span class="n">{len(posts)}</span></button>']
    for t, c in tag_counts:
        on = ' on' if t == active_tag else ''
        chips.append(f'<button class="tag-chip{on}" data-tag="{html_mod.escape(t)}">{html_mod.escape(t)} <span class="n">{c}</span></button>')

    # Hero post (first item on page 1)
    hero_html = ''
    row_posts = page_posts
    if page == 1 and page_posts:
        hp = page_posts[0]
        row_posts = page_posts[1:]
        excerpt = hp['excerpt'][:200] + ('…' if len(hp['excerpt']) > 200 else '')
        tag0 = html_mod.escape(hp['tags'][0]) if hp['tags'] else 'Research'
        hero_html = f'''<div class="hero-post" data-slug="{hp['slug']}">
<div class="hero-eyebrow">{hp['date']}</div>
<h2 class="hero-title"><a href="/blog/{hp['slug']}/">{html_mod.escape(hp['title'])}</a></h2>
<p class="hero-excerpt">{html_mod.escape(excerpt)}</p>
<div class="hero-foot">
<div class="hero-meta"><span>{hp['reading_time']}</span><span class="dot">&middot;</span><span>{tag0}</span></div>
<a href="/blog/{hp['slug']}/" class="hero-cta">Read &#8594;</a>
</div>
</div>'''

    # Post rows
    offset = 1 if (page == 1 and page_posts) else 0
    rows = []
    for i, p in enumerate(row_posts, start + offset + 1):
        tags_csv = ','.join(p['tags'])
        tag0 = html_mod.escape(p['tags'][0]) if p['tags'] else ''
        rows.append(
            f'<div class="post-row" data-title="{html_mod.escape(p["title"].lower())}"'
            f' data-tags="{html_mod.escape(tags_csv)}" data-date="{p["date"]}" data-slug="{p["slug"]}"'
            f' onclick="location.href=\'/blog/{p["slug"]}/\'">'
            f'<div class="pr-n">{i:02d}</div>'
            f'<div class="pr-body">'
            f'<div class="pr-title"><a href="/blog/{p["slug"]}/">{html_mod.escape(p["title"])}</a></div>'
            f'<div class="pr-meta"><span>{p["date"]}</span><span class="mdot">&middot;</span><span>{tag0}</span></div>'
            f'</div>'
            f'<div class="pr-side"><span class="pr-rt">{p["reading_time"]}</span></div>'
            f'</div>'
        )

    # Pagination
    pag = ''
    if total_pages > 1:
        prev_btn = f'<a href="{"/blog/" if page==2 else f"/blog/page/{page-1}/"}" class="pgn-step">&#8592; Prev</a>' if page > 1 else '<span></span>'
        next_btn = f'<a href="/blog/page/{page+1}/" class="pgn-step">Next &#8594;</a>' if page < total_pages else '<span></span>'
        nums = []
        for i in range(1, total_pages+1):
            if i == page:
                nums.append(f'<span class="cur">{i}</span>')
            elif i == 1:
                nums.append(f'<button onclick="location.href=\'/blog/\'">{i}</button>')
            else:
                nums.append(f'<button onclick="location.href=\'/blog/page/{i}/\'">{i}</button>')
        pag = f'<div class="pgn">{prev_btn}<div class="pgn-nums">{"".join(nums)}</div>{next_btn}</div>'

    meta = f'<title>Field Notes | Ali Safari</title><meta name="description" content="Ali Safari\'s notes on Information Systems research, AI, and theory. {len(posts)} posts covering IS theory, technology adoption, AI governance, and more."><meta name="keywords" content="information systems, IS theory, AI, technology adoption, trust, security, blog"><meta property="og:title" content="Field Notes | Ali Safari"><meta property="og:description" content="Notes on IS research, AI, and theory — {len(posts)} posts."><meta property="og:type" content="website"><meta property="og:url" content="{SITE}/blog/"><meta property="og:site_name" content="Ali Safari"><meta name="twitter:card" content="summary"><meta name="twitter:site" content="@alisafari">'
    canonical = f'{SITE}/blog/'
    json_ld = f'<script type="application/ld+json">{{"@context":"https://schema.org","@type":"Blog","name":"Field Notes — Ali Safari","description":"Notes on IS theory, AI, technology, and comps studying.","url":"{SITE}/blog/","author":{{"@type":"Person","name":"Ali Safari","url":"{SITE}"}}}}</script>'

    return f"""{HEAD.format(meta=meta, canonical=canonical, json_ld=json_ld)}
<body>
{NAV}
<div class="index">
<header class="masthead">
<div class="masthead-kicker">Field Notes &mdash; Ali Safari &mdash; {len(posts)} notes</div>
<h1 class="masthead-title">Field<br>Notes.</h1>
<div class="masthead-bottom">
<p class="masthead-dek">Honest reactions to IS research, AI, and the theory I'm studying for comps. No summaries.</p>
<div class="masthead-stats">
<div><b>{len(posts)}</b> Posts</div>
<div><b>{len(tag_counts)}</b> Topics</div>
</div>
</div>
</header>
<div class="controls">
<div class="search-wrap">
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
<input type="text" id="blogSearch" placeholder="Search notes…" autocomplete="off">
</div>
<div class="seg">
<button class="on" data-sort="newest">Newest</button>
<button data-sort="oldest">Oldest</button>
</div>
</div>
<div class="tags" id="tagFilters">{''.join(chips)}</div>
{hero_html}
<div class="post-list" id="postList">
{''.join(rows)}
<div id="emptyState" style="display:none;padding:64px 0;font-family:var(--f-mono);font-size:13px;color:var(--ink-4);letter-spacing:.07em;text-transform:uppercase;">No notes found</div>
{pag}
</div>
{FOOTER}
{SCRIPTS}
</body></html>"""

def build_article(post, all_posts, series_map):
    body_html_raw = md_html(post['body'])
    toc_li_items, body_html = generate_toc(body_html_raw)
    tags_html = ''.join(f'<span class="tag">{html_mod.escape(t)}</span>' for t in post['tags'])
    art_tags_html = ''.join(f'<span class="art-tag">{html_mod.escape(t)}</span>' for t in post['tags'][:3])
    primary = post['tags'][0] if post['tags'] else 'Research'
    
    # Series badge
    series_badge = ''
    if post['slug'] in series_map:
        s = series_map[post['slug']]
        series_links = []
        for sp in s['posts']:
            if sp['slug'] == post['slug']:
                series_links.append(f'<span class="series-current">{s["current"]}</span>')
            else:
                series_links.append(f'<a href="/blog/{sp["slug"]}/">{sp["slug"].replace("-", " ").title()[:20]}</a>')
        series_badge = f'<div class="series-badge"><span class="series-label">{html_mod.escape(s["name"])}</span><span class="series-counter">Part {s["current"]} of {s["total"]}</span><div class="series-nav">{" &rsaquo; ".join(series_links)}</div></div>'
    
    # Prev / Next
    idx = next((i for i, p in enumerate(all_posts) if p['slug'] == post['slug']), -1)
    prev_next = ''
    if idx >= 0:
        prev_link = ''
        next_link = ''
        if idx < len(all_posts) - 1:
            np = all_posts[idx + 1]
            prev_link = f'<a href="/blog/{np["slug"]}/" class="pn-link"><div class="pn-dir">&#8592; Previous</div><div class="pn-title">{html_mod.escape(np["title"])}</div></a>'
        if idx > 0:
            pp = all_posts[idx - 1]
            next_link = f'<a href="/blog/{pp["slug"]}/" class="pn-link right"><div class="pn-dir">Next &#8594;</div><div class="pn-title">{html_mod.escape(pp["title"])}</div></a>'
        if prev_link or next_link:
            prev_next = f'<p class="end-label">More notes</p><div class="prev-next">{prev_link}{next_link}</div>'
    
    related = related_posts(post, all_posts)
    rel_html = ''
    if related:
        rc = ''.join(
            f'<a href="/blog/{p["slug"]}/" class="related-item">'
            f'<div><div class="related-cat">{html_mod.escape(p["tags"][0] if p["tags"] else "Research")}</div>'
            f'<div class="related-title">{html_mod.escape(p["title"])}</div></div>'
            f'<span class="related-rt">{p["reading_time"]}</span></a>'
            for p in related
        )
        rel_html = f'<p class="end-label">Related notes</p><div class="related-list">{rc}</div>'
    
    meta = f'<title>{html_mod.escape(post["title"])} | Ali Safari</title><meta name="description" content="{html_mod.escape(post["excerpt"])}"><meta name="keywords" content={", ".join(post["tags"])}, information systems, research"><meta property="og:title" content="{html_mod.escape(post["title"])}"><meta property="og:description" content="{html_mod.escape(post["excerpt"])}"><meta property="og:type" content="article"><meta property="og:url" content="{SITE}/blog/{post["slug"]}/"><meta property="og:site_name" content="Ali Safari"><meta property="article:published_time" content="{post["date"]}"><meta property="article:tag" content={", ".join(post["tags"])}"><meta name="twitter:card" content="summary"><meta name="twitter:site" content="@alisafari">'
    canonical = f'{SITE}/blog/{post["slug"]}/'
    json_ld = f'''<script type="application/ld+json">{{"@context":"https://schema.org","@type":"BlogPosting","headline":"{html_mod.escape(post["title"])}","description":"{html_mod.escape(post["excerpt"])}","url":"{SITE}/blog/{post["slug"]}/","datePublished":"{post["date"]}","author":{{"@type":"Person","name":"Ali Safari","url":"{SITE}"}},"publisher":{{"@type":"Organization","name":"Ali Safari","logo":{{"@type":"ImageObject","url":"{SITE}/images/logo.png"}}}},"articleSection":"{primary}","keywords":"{", ".join(post["tags"])}"}}</script>
    <link rel="manifest" href="/manifest.json">
    <script>
    if ('serviceWorker' in navigator) {{
        navigator.serviceWorker.register('/sw.js', {{ scope: '/' }}).catch(() => {{}});
    }}
    </script>'''
    
    art_class = 'article-page'
    if toc_li_items:
        toc_rail = f'''<div class="article-toc-rail">
<div class="article-toc-sticky">
<div class="art-toc">
<div class="art-toc-label">Contents</div>
<ol>{toc_li_items}</ol>
</div>
</div>
</div>'''
        art_body_wrap = f'<div class="article-with-toc">{toc_rail}<div class="art-body drop-cap">{body_html}</div></div>'
    else:
        art_body_wrap = f'<div class="art-body drop-cap" style="max-width:var(--col);margin:0 auto;">{body_html}</div>'

    return f"""{HEAD.format(meta=meta, canonical=canonical, json_ld=json_ld)}
<body class="{art_class}">
<div class="reading-progress"><div class="reading-progress-bar" id="rpb"></div></div>
{NAV}
<nav class="crumbs" aria-label="Breadcrumb">
<a href="/blog/">Field Notes</a>
<span class="sep">/</span>
<span>{html_mod.escape(primary)}</span>
</nav>
<header class="art-header">
<div class="art-cat">{html_mod.escape(primary)}</div>
<h1 class="art-title">{html_mod.escape(post['title'])}</h1>
{f'<p class="art-dek">{html_mod.escape(post["excerpt"])}</p>' if post['excerpt'] else ''}
<div class="art-meta">
<span>{post['date']}</span>
<span class="dot">&middot;</span>
<span>{post['reading_time']}</span>
{art_tags_html}
</div>
</header>
{series_badge}
{art_body_wrap}
<div class="end-matter">
<hr class="end-rule">
<p class="end-label">About the author</p>
<div class="author-block">
<div class="author-av">A</div>
<div>
<div class="author-name">Ali Safari</div>
<div class="author-role">PhD Student in IS, University of North Texas</div>
<p class="author-note">Researching AI governance, trust in intelligent systems, and agentic AI. Writing while studying for comps.</p>
<div class="author-links">
<a href="https://linkedin.com/in/ali-safari" class="alink" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">in</a>
<a href="https://scholar.google.com/citations?user=rCosT9sAAAAJ&hl=en" class="alink" target="_blank" rel="noopener noreferrer" aria-label="Google Scholar">gs</a>
</div>
</div>
</div>
<p class="end-label">Share</p>
<div class="share-row">
<button class="share-btn" data-platform="twitter">Twitter / X</button>
<button class="share-btn" data-platform="linkedin">LinkedIn</button>
<button class="share-btn" data-platform="copy">Copy link</button>
</div>
{prev_next}
{rel_html}
</div>
{FOOTER}
{SCRIPTS}
<script>
(function(){{
  var bar=document.getElementById('rpb');
  if(!bar)return;
  window.addEventListener('scroll',function(){{
    var h=document.documentElement.scrollHeight-window.innerHeight;
    bar.style.width=(h>0?(window.scrollY/h*100):0)+'%';
  }},{{passive:true}});
}})();
</script>
</body></html>"""

def build_category_page(category, posts_in_cat, all_posts, tag_counts):
    tags_html = ''.join(f'<span class="tag">{html_mod.escape(t)}</span>' for t in [category])
    cards = []
    for p in posts_in_cat:
        tags_csv = ','.join(p['tags'])
        p_tags_html = ''.join(f'<span class="tag">{html_mod.escape(t)}</span>' for t in p['tags'])
        excerpt = p['excerpt'][:160] + ('...' if len(p['excerpt']) > 160 else '')
        cards.append(f'''<div class="blog-grid-item" data-title="{html_mod.escape(p['title'].lower())}" data-excerpt="{html_mod.escape(p['excerpt'].lower())}" data-tags="{html_mod.escape(tags_csv)}" data-date="{p['date']}" data-slug="{p['slug']}">
<article class="blog-post-card">
<div class="card-header">
<div class="card-meta"><span>{p['date']}</span><span class="reading-time"><i class="far fa-clock"></i> {p['reading_time']}</span></div>
<h2><a href="/blog/{p['slug']}/">{html_mod.escape(p['title'])}</a></h2>
</div>
<p class="card-excerpt">{html_mod.escape(excerpt)}</p>
<div class="card-footer">
<div class="card-tags">{p_tags_html}</div>
<div class="card-actions">
<button class="bookmark-btn" data-slug="{p['slug']}" title="Save for later" aria-label="Save {html_mod.escape(p['title'])} for later"><i class="far fa-bookmark"></i></button>
<a href="/blog/{p['slug']}/" class="read-link">Read <i class="fas fa-arrow-right"></i></a>
</div>
</div>
</article>
</div>''')
    
    desc = CATEGORY_DESCRIPTIONS.get(category, f'All posts about {category}.')
    cat_slug = slugify(category)
    meta = f'<title>{html_mod.escape(category)} | Blog | Ali Safari</title><meta name="description" content="{html_mod.escape(desc)}"><meta property="og:title" content="{html_mod.escape(category)} | Ali Safari Blog"><meta property="og:description" content="{html_mod.escape(desc)}"><meta property="og:type" content="website"><meta property="og:url" content="{SITE}/blog/category/{cat_slug}/"><meta property="og:site_name" content="Ali Safari"><meta name="twitter:card" content="summary"><meta name="twitter:site" content="@alisafari">'
    canonical = f'{SITE}/blog/category/{cat_slug}/'
    json_ld = f'<script type="application/ld+json">{{"@context":"https://schema.org","@type":"CollectionPage","name":"{html_mod.escape(category)}","description":"{html_mod.escape(desc)}","url":"{canonical}","isPartOf":{{"@type":"Blog","name":"Ali Safari Blog","url":"{SITE}/blog/"}}}}</script>'
    
    return f"""{HEAD.format(meta=meta, canonical=canonical, json_ld=json_ld)}
<body class="blog-page">
{NAV}
<header class="blog-header">
<h1>{html_mod.escape(category)}</h1>
<p class="blog-subtitle">{html_mod.escape(desc)}</p>
<div class="blog-meta">
<span class="blog-meta-item"><i class="fas fa-pen-nib"></i> {len(posts_in_cat)} posts</span>
<span class="blog-meta-item"><i class="fas fa-folder"></i> Category</span>
</div>
</header>
<div class="blog-tag-filters">{''.join(f'<a href="/blog/?tag={html_mod.escape(t)}" class="blog-tag-chip {"active" if t == category else ""}" data-tag="{html_mod.escape(t)}">{html_mod.escape(t)} <span class="tag-count">{c}</span></a>' for t, c in tag_counts)}</div>
<div class="blog-grid" id="blogGrid">
{''.join(cards)}
<div class="blog-empty-state" style="display:none"><i class="fas fa-search"></i><h3>No posts found</h3><p>Try a different search term.</p></div>
</div>
{FOOTER}
{SCRIPTS}
</body></html>"""

def build_reading_list_page():
    meta = f'<title>Reading List | Ali Safari</title><meta name="description" content="Your saved posts from Ali Safari\'s blog on IS theory, AI, and technology."><meta property="og:title" content="Reading List | Ali Safari"><meta property="og:description" content="Saved posts from Ali Safari Blog."><meta property="og:type" content="website"><meta property="og:url" content="{SITE}/blog/reading-list/"><meta property="og:site_name" content="Ali Safari"><meta name="twitter:card" content="summary"><meta name="twitter:site" content="@alisafari">'
    canonical = f'{SITE}/blog/reading-list/'
    json_ld = f'<script type="application/ld+json">{{"@context":"https://schema.org","@type":"WebPage","name":"Reading List","description":"Your saved posts.","url":"{canonical}"}}</script>'
    
    return f"""{HEAD.format(meta=meta, canonical=canonical, json_ld=json_ld)}
<body class="blog-page">
{NAV}
<header class="blog-header">
<h1><i class="fas fa-bookmark"></i> Reading List</h1>
<p class="blog-subtitle">Posts you've saved for later. Stored locally in your browser.</p>
<div class="blog-meta">
<span class="blog-meta-item" id="readingCount"><i class="fas fa-bookmark"></i> 0 saved</span>
</div>
</header>
<div class="blog-grid" id="readingListGrid">
<div class="blog-empty-state" id="readingEmpty"><i class="fas fa-bookmark"></i><h3>No saved posts yet</h3><p>Browse the <a href="/blog/">blog</a> and click the bookmark icon to save posts here.</p></div>
</div>
{FOOTER}
{SCRIPTS}
</body></html>"""

def generate_rss(posts):
    items = []
    for p in posts[:50]:  # Last 50 posts
        link = f'{SITE}/blog/{p["slug"]}/'
        desc = html_mod.escape(p['excerpt'])
        cats = ''.join(f'<category>{html_mod.escape(t)}</category>' for t in p['tags'])
        items.append(f'<item><title>{html_mod.escape(p["title"])}</title><link>{link}</link><guid>{link}</guid><pubDate>{p["date"]}T00:00:00Z</pubDate><description>{desc}</description>{cats}</item>')
    
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>Ali Safari Blog</title>
<link>{SITE}/blog/</link>
<description>Thoughts on IS theory, AI, technology, and comps studying.</description>
<language>en</language>
<lastBuildDate>{datetime.utcnow().strftime("%a, %d %b %Y %H:%M:%S GMT")}</lastBuildDate>
<atom:link href="{SITE}/blog/feed.xml" rel="self" type="application/rss+xml"/>
{''.join(items)}
</channel>
</rss>'''

def main():
    import shutil
    if os.path.exists(OUT_DIR): shutil.rmtree(OUT_DIR)
    os.makedirs(OUT_DIR, exist_ok=True)
    
    posts = get_posts()
    tag_counts = get_tag_counts(posts)
    series_map = detect_series(posts)
    
    print(f"Posts: {len(posts)}, Tags: {len(tag_counts)}, Series: {len(set(s['name'] for s in series_map.values()))}")
    
    # Generate articles
    for p in posts:
        d = os.path.join(OUT_DIR, p['slug'])
        os.makedirs(d, exist_ok=True)
        with open(os.path.join(d, 'index.html'), 'w', encoding='utf-8') as f:
            f.write(build_article(p, posts, series_map))
    
    # Generate listing pages
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
    
    # Generate category pages
    cat_dir = os.path.join(OUT_DIR, 'category')
    os.makedirs(cat_dir, exist_ok=True)
    for cat, count in tag_counts:
        cat_posts = [p for p in posts if cat in p['tags']]
        cat_slug = slugify(cat)
        cd = os.path.join(cat_dir, cat_slug)
        os.makedirs(cd, exist_ok=True)
        with open(os.path.join(cd, 'index.html'), 'w', encoding='utf-8') as f:
            f.write(build_category_page(cat, cat_posts, posts, tag_counts))
    
    # Generate reading list page
    rl_dir = os.path.join(OUT_DIR, 'reading-list')
    os.makedirs(rl_dir, exist_ok=True)
    with open(os.path.join(rl_dir, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(build_reading_list_page())
    
    # Generate RSS feed
    with open(os.path.join(OUT_DIR, 'feed.xml'), 'w', encoding='utf-8') as f:
        f.write(generate_rss(posts))
    
    print(f"Done: {len(posts)} articles, {total_pages} listings, {len(tag_counts)} categories, 1 reading list, 1 RSS feed")

if __name__ == '__main__':
    main()
