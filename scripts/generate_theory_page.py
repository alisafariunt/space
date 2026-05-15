#!/usr/bin/env python3
from __future__ import annotations

import argparse
import html
import re
from dataclasses import dataclass
from pathlib import Path

import markdown
from theory_model_diagrams import THEORY_MODEL_DIAGRAMS
from theory_model_roles import THEORY_MODEL_ROLES
from theory_persian_content import (
    PERSIAN_BOX_LABELS,
    PERSIAN_EXPLANATIONS,
    PERSIAN_MEMORY_EXPANSIONS,
)


MARKDOWN_EXTENSIONS = ["tables", "sane_lists"]
MODEL_NODE_PATTERN = re.compile(r"\[([^\]]+)\]")

THEME_INTROS = {
    1: "This theme covers initial acceptance, planned behavior, diffusion, and the move from first use to continued use.",
    2: "This theme focuses on fit, success, communication choice, and the information-processing logic behind better system performance.",
    3: "This theme moves to firm-level value, strategy, governance, and why context changes what a digital investment can really do.",
    4: "This theme explains digital platforms, service logic, exchange relationships, and how ecosystems create and capture value.",
    5: "This theme deals with sociotechnical change, structures, practices, and the IT artifact inside real organizational work.",
    6: "This theme brings in motivation, cognition, and sensemaking to explain how people experience and respond to technology.",
    7: "This theme focuses on protection, privacy, trust, and the relational signals that shape risky digital behavior.",
}

THEME_BADGES = {
    1: "is-native",
    2: "organizational",
    3: "strategy",
    4: "economics",
    5: "sociology",
    6: "behavioral",
    7: "security",
}

@dataclass
class Theory:
    number: int
    title: str
    memory_cue: str
    quick_ref: list[tuple[str, str]]
    sections: dict[str, str]
    theme_number: int
    theme_title: str

    @property
    def slug(self) -> str:
        return slugify(self.title)


def slugify(value: str) -> str:
    slug = value.lower()
    slug = slug.replace("&", " and ")
    slug = re.sub(r"[()\/,:]", " ", slug)
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"\s+", "-", slug).strip("-")
    slug = re.sub(r"-{2,}", "-", slug)
    return slug


def render_markdown_block(text: str) -> str:
    return markdown.markdown(text.strip(), extensions=MARKDOWN_EXTENSIONS)


def render_inline(text: str) -> str:
    html = render_markdown_block(text)
    if html.startswith("<p>") and html.endswith("</p>"):
        return html[3:-4]
    return html


def parse_table(lines: list[str]) -> list[tuple[str, str]]:
    rows: list[tuple[str, str]] = []
    if len(lines) < 3:
        return rows

    for line in lines[2:]:
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if len(cells) >= 2:
            rows.append((cells[0], cells[1]))
    return rows


def row_lookup(quick_ref: list[tuple[str, str]]) -> dict[str, str]:
    return {label: value for label, value in quick_ref}


def parse_theory_block(block: str, theme_number: int, theme_title: str) -> Theory:
    header, rest = block.split("\n", 1)
    match = re.match(r"(\d+)\.\s+(.+)", header.strip())
    if not match:
        raise ValueError(f"Could not parse theory header: {header!r}")

    number = int(match.group(1))
    title = match.group(2).strip()

    lines = [line.rstrip() for line in rest.strip().splitlines()]
    index = 0

    while index < len(lines) and not lines[index].strip():
        index += 1

    memory_cue = ""
    if index < len(lines) and lines[index].startswith("FA memory cue:"):
        memory_cue = lines[index].split(":", 1)[1].strip().strip('"')
        index += 1

    while index < len(lines) and not lines[index].strip():
        index += 1

    table_lines: list[str] = []
    while index < len(lines) and lines[index].startswith("|"):
        table_lines.append(lines[index])
        index += 1

    quick_ref = parse_table(table_lines)

    while index < len(lines) and not lines[index].strip():
        index += 1

    paragraphs: list[str] = []
    current: list[str] = []
    for line in lines[index:]:
        if line.strip():
            current.append(line.strip())
        elif current:
            paragraphs.append(" ".join(current))
            current = []
    if current:
        paragraphs.append(" ".join(current))

    sections: dict[str, str] = {}
    for paragraph in paragraphs:
        if ":" not in paragraph:
            continue
        label, value = paragraph.split(":", 1)
        sections[label.strip()] = value.strip()

    return Theory(
        number=number,
        title=title,
        memory_cue=memory_cue,
        quick_ref=quick_ref,
        sections=sections,
        theme_number=theme_number,
        theme_title=theme_title,
    )


def parse_source(source: Path) -> tuple[str, str, list[tuple[int, str, list[Theory]]], dict[str, str]]:
    text = source.read_text(encoding="utf-8")
    parts = re.split(r"(?m)^##\s+", text)
    preamble = parts[0].strip()
    section_parts = parts[1:]

    preamble_lines = preamble.splitlines()
    title = preamble_lines[0].lstrip("# ").strip()
    intro = "\n".join(preamble_lines[1:]).strip()

    themes: list[tuple[int, str, list[Theory]]] = []
    backmatter: dict[str, str] = {}

    for section in section_parts:
        header, body = section.split("\n", 1)
        header = header.strip()
        body = body.strip()

        if header.startswith("Theme "):
            theme_match = re.match(r"Theme\s+(\d+):\s+(.+)", header)
            if not theme_match:
                raise ValueError(f"Could not parse theme header: {header!r}")

            theme_number = int(theme_match.group(1))
            theme_title = theme_match.group(2).strip()
            theory_parts = re.split(r"(?m)^###\s+", body)
            theories: list[Theory] = []
            for part in theory_parts[1:]:
                theories.append(parse_theory_block(part, theme_number, theme_title))
            themes.append((theme_number, theme_title, theories))
        elif header == "Table of Contents":
            continue
        else:
            backmatter[header] = body

    return title, intro, themes, backmatter


def build_preview_points(theory: Theory) -> str:
    rows = row_lookup(theory.quick_ref)
    points = [
        ("Level", rows.get("Level", "")),
        ("Best use", rows.get("Best use", "")),
        ("Core constructs", rows.get("Best-known constructs", "")),
        ("Watch out", rows.get("Common mistake", "")),
    ]

    html_parts = []
    for label, value in points:
        if not value:
            continue
        html_parts.append(
            f'<div class="key-point"><strong>{label}:</strong> {render_inline(value)}</div>'
        )
    return "\n".join(html_parts)


def build_mechanism_note(theory: Theory) -> str:
    rows = row_lookup(theory.quick_ref)
    level = rows.get("Level", "a relevant")
    best_use = rows.get("Best use", "this kind of question")
    constructs = rows.get("Best-known constructs", "its core constructs")
    core_question = rows.get("Core question", "the main research question")
    common_mistake = rows.get("Common mistake", "stretching it too far")

    return (
        f"In exam terms, this is mainly a {level.lower()}-level theory. It fits best when the question is about "
        f"{best_use.lower()}. The fast construct list to name out loud is {constructs}. A clean way to use the theory "
        f"is to connect it directly to the question '{core_question}' and then show why that setting really matches "
        f"the mechanism. The usual mistake is {common_mistake[0].lower() + common_mistake[1:] if common_mistake else 'forcing the theory into the wrong problem'}."
    )


def build_boundary_note(theory: Theory) -> str:
    rows = row_lookup(theory.quick_ref)
    level = rows.get("Level", "the right unit of analysis")
    best_use = rows.get("Best use", "the right task")
    common_mistake = rows.get("Common mistake", "using it too loosely")

    return (
        f"Treat {theory.title} as strongest when the unit of analysis is {level.lower()} and the main outcome really sits in "
        f"{best_use.lower()}. If the exam question shifts toward a different mechanism, say that directly instead of stretching "
        f"the theory. The most common confusion is {common_mistake[0].lower() + common_mistake[1:] if common_mistake else 'using the label without the logic'}."
    )


def render_quick_ref_table(quick_ref: list[tuple[str, str]]) -> str:
    rows = "\n".join(
        f"<tr><td>{render_inline(label)}</td><td>{render_inline(value)}</td></tr>"
        for label, value in quick_ref
    )
    return f"""
    <table>
        <thead>
            <tr>
                <th>Field</th>
                <th>Notes</th>
            </tr>
        </thead>
        <tbody>
            {rows}
        </tbody>
    </table>
    """


def normalize_persian_box_text(text: str) -> str:
    replacements = {
        " IT ": " فناوری ",
        "IT ": "فناوری ",
        " IT": " فناوری",
        "mediated": "میانجی شده",
    }
    for source, target in replacements.items():
        text = text.replace(source, target)
    return text


def render_persian_block(label: str, paragraphs: tuple[str, ...] | list[str], block_class: str) -> str:
    if not paragraphs:
        return ""

    text_html = "\n".join(
        f'<p class="persian-box-text">{render_inline(normalize_persian_box_text(paragraph))}</p>'
        for paragraph in paragraphs
        if paragraph.strip()
    )
    if not text_html:
        return ""

    return f"""
    <div class="{block_class} persian-box" lang="fa" dir="rtl">
        <span class="persian-box-label" lang="fa-Latn" dir="ltr">{label}</span>
        {text_html}
    </div>
    """


def normalize_model_segment(segment: str) -> str:
    return re.sub(r"\s+", " ", segment).strip()


def is_model_guide_line(text: str) -> bool:
    compact = text.replace(" ", "")
    return bool(compact) and set(compact) <= {"|", "v"}


def mermaid_safe_label(text: str) -> str:
    return text.replace('"', "&quot;")


def build_model_node_id(theory_number: int, label: str, node_ids: dict[str, str]) -> str:
    if label in node_ids:
        return node_ids[label]

    slug = re.sub(r"[^a-z0-9]+", "_", label.lower()).strip("_")
    slug = slug[:32] or "node"
    node_ids[label] = f"t{theory_number}_{slug}_{len(node_ids) + 1}"
    return node_ids[label]


def parse_arrow_connector(text: str) -> tuple[str, str] | None:
    cleaned = normalize_model_segment(text)
    if not cleaned:
        return None

    if "<->" in cleaned:
        return "<-->", ""

    labeled_match = re.search(r"-+([^>-]+)-+>", cleaned)
    if labeled_match:
        return "-->", normalize_model_segment(labeled_match.group(1))

    if "->" in cleaned or re.search(r"-+>", cleaned):
        return "-->", ""

    return None


def parse_model_line(line: str) -> tuple[list[tuple[str, str, str, str]], list[str], list[str]]:
    cleaned = normalize_model_segment(line)
    if not cleaned or is_model_guide_line(cleaned):
        return [], [], []

    matches = list(MODEL_NODE_PATTERN.finditer(cleaned))
    if not matches:
        return [], [], [cleaned.rstrip(":")]

    notes: list[str] = []
    standalone_nodes: list[str] = []
    edges: list[tuple[str, str, str, str]] = []

    prefix = normalize_model_segment(cleaned[: matches[0].start()])
    if prefix and prefix not in {"->", "<->"}:
        notes.append(prefix.rstrip(":"))

    labels = [match.group(1).strip() for match in matches]
    connectors = [
        normalize_model_segment(cleaned[matches[index].end() : matches[index + 1].start()])
        for index in range(len(matches) - 1)
    ]
    tail = normalize_model_segment(cleaned[matches[-1].end() :])
    if tail and not parse_arrow_connector(tail):
        notes.append(tail.rstrip(":"))

    if len(labels) == 1 and not connectors:
        return [], [labels[0]], notes

    if len(labels) >= 3 and connectors and parse_arrow_connector(connectors[0]) and all(
        connector == "and" for connector in connectors[1:]
    ):
        arrow_kind, arrow_label = parse_arrow_connector(connectors[0]) or ("-->", "")
        source = labels[0]
        for target in labels[1:]:
            edges.append((source, arrow_kind, target, arrow_label))
        return edges, standalone_nodes, notes

    first_arrow_index = next(
        (index for index, connector in enumerate(connectors) if parse_arrow_connector(connector)),
        None,
    )
    if first_arrow_index is not None and first_arrow_index > 0 and all(
        connector in {"+", "-"} for connector in connectors[:first_arrow_index]
    ):
        arrow_kind, arrow_label = parse_arrow_connector(connectors[first_arrow_index]) or ("-->", "")
        target = labels[first_arrow_index + 1]
        for source_index, source in enumerate(labels[: first_arrow_index + 1]):
            sign = "+" if source_index == 0 else connectors[source_index - 1]
            edge_note = "-" if sign == "-" else ""
            if source_index == first_arrow_index and arrow_label:
                edge_note = arrow_label
            edges.append((source, arrow_kind, target, edge_note))

        for connector_index in range(first_arrow_index + 1, len(connectors)):
            arrow_details = parse_arrow_connector(connectors[connector_index])
            if not arrow_details:
                continue
            arrow_kind, arrow_label = arrow_details
            edges.append((labels[connector_index], arrow_kind, labels[connector_index + 1], arrow_label))

        return edges, standalone_nodes, notes

    for connector_index, connector in enumerate(connectors):
        arrow_details = parse_arrow_connector(connector)
        if not arrow_details:
            continue
        arrow_kind, arrow_label = arrow_details
        edges.append((labels[connector_index], arrow_kind, labels[connector_index + 1], arrow_label))

    if not edges:
        standalone_nodes.extend(labels)

    return edges, standalone_nodes, notes


def build_mermaid_source(theory: Theory, diagram: dict[str, object]) -> tuple[str, list[str]]:
    direction = str(diagram.get("direction", "LR"))
    node_ids: dict[str, str] = {}
    mermaid_lines = [f"flowchart {direction}"]
    notes: list[str] = []
    edge_keys: set[tuple[str, str, str, str]] = set()
    standalone_seen: set[str] = set()

    parsed_edges: list[tuple[str, str, str, str]] = []
    standalone_nodes: list[str] = []
    for raw_line in diagram.get("lines", []):
        edges, standalone, line_notes = parse_model_line(str(raw_line))
        parsed_edges.extend(edges)
        standalone_nodes.extend(standalone)
        notes.extend(line_notes)

    for label in standalone_nodes:
        if label in standalone_seen:
            continue
        standalone_seen.add(label)
        node_id = build_model_node_id(theory.number, label, node_ids)
        mermaid_lines.append(f'    {node_id}["{mermaid_safe_label(label)}"]')

    for source, arrow_kind, target, edge_label in parsed_edges:
        edge_key = (source, arrow_kind, target, edge_label)
        if edge_key in edge_keys:
            continue
        edge_keys.add(edge_key)

        source_id = build_model_node_id(theory.number, source, node_ids)
        target_id = build_model_node_id(theory.number, target, node_ids)

        if edge_label:
            mermaid_lines.append(
                f'    {source_id}["{mermaid_safe_label(source)}"] -- "{mermaid_safe_label(edge_label)}" --> {target_id}["{mermaid_safe_label(target)}"]'
            )
        elif arrow_kind == "<-->":
            mermaid_lines.append(
                f'    {source_id}["{mermaid_safe_label(source)}"] <--> {target_id}["{mermaid_safe_label(target)}"]'
            )
        else:
            mermaid_lines.append(
                f'    {source_id}["{mermaid_safe_label(source)}"] --> {target_id}["{mermaid_safe_label(target)}"]'
            )

    unique_notes = list(dict.fromkeys(note for note in notes if note.strip()))
    return "\n".join(mermaid_lines), unique_notes


def render_role_list(items: tuple[str, ...] | list[str]) -> str:
    return "".join(f'<span class="diagram-role-chip">{html.escape(item)}</span>' for item in items if item)


def render_model_roles(theory: Theory) -> str:
    role_data = THEORY_MODEL_ROLES.get(theory.number)
    if not role_data:
        return ""

    role_rows = [
        ("Form", role_data.get("form", "")),
        ("IVs / Drivers", render_role_list(role_data.get("inputs", ()))),
        ("Mediator / Process", render_role_list(role_data.get("mechanisms", ()))),
        ("DV / Outcome", render_role_list(role_data.get("outcomes", ()))),
    ]

    moderators = role_data.get("moderators", ())
    if moderators:
        role_rows.append(("Moderators", render_role_list(moderators)))

    html_rows = []
    for label, value in role_rows:
        if not value:
            continue
        content = value if value.startswith("<span") else html.escape(str(value))
        html_rows.append(
            f"""
            <div class="diagram-role-row">
                <span class="diagram-role-label">{label}</span>
                <div class="diagram-role-value">{content}</div>
            </div>
            """
        )

    if not html_rows:
        return ""

    return f"""
    <div class="diagram-role-grid">
        {''.join(html_rows)}
    </div>
    """


def render_model_figure(theory: Theory, diagram_output_dir: Path, diagram_web_prefix: str) -> str:
    diagram = THEORY_MODEL_DIAGRAMS.get(theory.number)
    role_grid = render_model_roles(theory)
    if not diagram and not role_grid:
        return ""

    note_html = '<p class="figure-placeholder-note">Reserved for the exact canonical figure from the source article or your hand-drawn version.</p>'
    placeholder_title = "Exact figure space"

    return f"""
    <div class="model-figure" aria-label="Canonical model shape for {html.escape(theory.title)}">
        <span class="model-meta">{placeholder_title}</span>
        <div class="theory-mermaid-container">
            <div class="figure-placeholder-canvas" aria-hidden="true"></div>
        </div>
        {role_grid}
        {note_html}
    </div>
    """


def render_theory_card(theory: Theory, diagram_output_dir: Path, diagram_web_prefix: str) -> str:
    rows = row_lookup(theory.quick_ref)
    badge_class = THEME_BADGES[theory.theme_number]
    core_question = rows.get("Core question", "")
    level = rows.get("Level", "")
    core_idea = theory.sections.get("Core idea", "")
    why = theory.sections.get("Why it matters in IS", "")
    exam = theory.sections.get("Exam angle", "")
    recent = theory.sections.get("Recent IS connection", "")
    origin = theory.sections.get("Origin source (APA 7)", "")
    canonical = theory.sections.get("Canonical IS source (APA 7)", "")

    memory_block = ""
    if theory.memory_cue:
        memory_paragraphs = [theory.memory_cue]
        extra_memory = PERSIAN_MEMORY_EXPANSIONS.get(theory.number, "")
        if extra_memory:
            memory_paragraphs.append(extra_memory)
        memory_block = render_persian_block(
            PERSIAN_BOX_LABELS["memory"],
            tuple(memory_paragraphs),
            "memory-cue",
        )

    persian_explanation = render_persian_block(
        PERSIAN_BOX_LABELS["explanation"],
        PERSIAN_EXPLANATIONS.get(theory.number, ()),
        "persian-section",
    )
    essay_paragraphs = [
        why,
        build_mechanism_note(theory),
        exam,
        build_boundary_note(theory),
        recent,
    ]
    essay_html = "\n".join(
        f'<div class="analysis-section essay-paragraph"><p>{render_inline(paragraph)}</p></div>'
        for paragraph in essay_paragraphs
        if paragraph.strip()
    )

    return f"""
    <article class="paper-card theory-preview-card theory-entry" id="{theory.slug}" data-theory-number="{theory.number}">
        <div class="theory-header">
            <div class="theory-meta-badges">
                <span class="theory-badge {badge_class}">Theme {theory.theme_number}</span>
                <span class="theory-badge level-badge">{render_inline(level or 'Theory')}</span>
                <span class="theory-badge number-badge">Theory {theory.number}</span>
            </div>
            <h2>{render_inline(theory.title)}</h2>
            <p class="theory-tagline">{render_inline(core_question)}</p>
            {memory_block}
        </div>

        <div class="theory-preview">
            <p><strong>Core idea:</strong> {render_inline(core_idea)}</p>
            <div class="theory-key-points">
                {build_preview_points(theory)}
            </div>
        </div>

        {render_model_figure(theory, diagram_output_dir, diagram_web_prefix)}

        {persian_explanation}

        <div class="analysis-section quick-ref-section">
            {render_quick_ref_table(theory.quick_ref)}
        </div>

        {essay_html}

        <div class="analysis-section citation-pair">
            <p><strong>Origin source (APA 7):</strong> {render_inline(origin)}</p>
            <p><strong>Canonical IS source (APA 7):</strong> {render_inline(canonical)}</p>
        </div>
    </article>
    """


def render_theme(
    theme_number: int,
    theme_title: str,
    theories: list[Theory],
    diagram_output_dir: Path,
    diagram_web_prefix: str,
) -> str:
    cards = "\n".join(
        render_theory_card(theory, diagram_output_dir, diagram_web_prefix) for theory in theories
    )

    return f"""
    <section class="theme-group" id="theme-{theme_number}">
        <div class="part-divider">
            <div>
                <h2>Theme {theme_number}: {render_inline(theme_title)}</h2>
                <p>{render_inline(THEME_INTROS[theme_number])}</p>
            </div>
            <span class="part-count">{len(theories)} theories</span>
        </div>
        {cards}
    </section>
    """


def build_toc(themes: list[tuple[int, str, list[Theory]]]) -> str:
    sections = []
    for theme_number, theme_title, theories in themes:
        toc_items = "\n".join(
            f'<li><a href="#{theory.slug}">{theory.number}. {render_inline(theory.title)}</a></li>'
            for theory in theories
        )
        sections.append(
            f"""
            <div class="toc-part">
                <div class="toc-part-header">
                    Theme {theme_number}: {render_inline(theme_title)}
                    <span class="part-count">{len(theories)}</span>
                </div>
                <ul class="toc-list">
                    {toc_items}
                </ul>
            </div>
            """
        )

    sections.append(
        """
        <div class="toc-part">
            <div class="toc-part-header">
                Final review sections
                <span class="part-count">3</span>
            </div>
            <ul class="toc-list">
                <li><a href="#priority">High-Priority Theories</a></li>
                <li><a href="#comparison-matrix">Cross-Theory Comparison Matrix</a></li>
                <li><a href="#exam-questions">Common Comprehensive Exam Questions</a></li>
            </ul>
        </div>
        """
    )
    return "\n".join(sections)


def render_page(
    title: str,
    intro: str,
    themes: list[tuple[int, str, list[Theory]]],
    backmatter: dict[str, str],
    diagram_output_dir: Path,
    diagram_web_prefix: str,
) -> str:
    total_theories = sum(len(theories) for _, _, theories in themes)
    theme_count = len(themes)
    citation_pairs = total_theories * 2
    toc_html = build_toc(themes)
    theme_html = "\n".join(
        render_theme(number, name, theories, diagram_output_dir, diagram_web_prefix)
        for number, name, theories in themes
    )

    high_priority_html = render_markdown_block(backmatter["High-Priority Theories to Memorize First"])
    comparison_html = render_markdown_block(backmatter["Cross-Theory Comparison Matrix"])
    questions_html = render_markdown_block(backmatter["Common Comprehensive Exam Questions"])
    intro_html = render_markdown_block(intro)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="robots" content="noindex">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Full-text 50-theory Information Systems compendium for PhD comprehensive exam preparation">
    <meta name="theme-color" content="#1e40af">
    <title>IS Theory Compendium | Full 50-Theory Exam Guide</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700;800&family=Vazirmatn:wght@400;500;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/css/study-header.css">
    <link rel="stylesheet" href="../css/style.css">
    <link rel="stylesheet" href="../css/theories-custom.css">
    <link rel="stylesheet" href="../css/theory-page.css">
</head>
<body class="theory-guide-page">
    <nav class="navbar">
        <div class="navbar-content">
            <a href="./" class="navbar-brand">IS Theory Compendium</a>
            <ul class="navbar-links">
                <li><a href="../index.html">Home</a></li>
                <li><a href="./" class="active">Theory Guide</a></li>
                <li><a href="../theories.html">Legacy Encyclopedia</a></li>
                <li><a href="#toc">TOC</a></li>
                <li><a href="#priority">Priority</a></li>
                <li><a href="#exam-questions">Questions</a></li>
            </ul>
            <div class="nav-actions">
                <button id="search-btn" class="search-btn" title="Search (Ctrl+K)" aria-label="Search">🔍</button>
                <button id="theme-toggle" class="theme-toggle" title="Toggle theme" aria-label="Toggle theme">🌙</button>
            </div>
        </div>
        <div class="progress-container">
            <div class="progress-bar-wrapper">
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
                <span class="progress-text">Reading Progress: 0%</span>
            </div>
        </div>
    </nav>

    <main class="container">
        <div class="session-header">
            <h1>{render_inline(title)}</h1>
            <p class="session-meta">Full-text 50-theory guide for IS PhD comps, built for deep review instead of quick summaries.</p>
        </div>

        <div class="stats-box">
            <div class="stat-item">
                <span class="stat-number">{total_theories}</span>
                <span class="stat-label">Theory Entries</span>
            </div>
            <div class="stat-item">
                <span class="stat-number">{theme_count}</span>
                <span class="stat-label">Themes</span>
            </div>
            <div class="stat-item">
                <span class="stat-number">{citation_pairs}</span>
                <span class="stat-label">APA Source Lines</span>
            </div>
            <div class="stat-item">
                <span class="stat-number">3</span>
                <span class="stat-label">Final Review Sections</span>
            </div>
        </div>

        <div class="info-box">
            <h4>About this page</h4>
            {intro_html}
            <p style="margin-bottom: 0;">This web version keeps the same 50-theory structure, but lays it out as a long study page with cleaner navigation, search, and exam-oriented reading flow.</p>
        </div>

        <div class="guide-callout">
            <p><strong>Study note:</strong> This is the full-text comps route. If you want the older broader website version with extra theories and methods material, you can still open <a href="../theories.html">the legacy encyclopedia</a>.</p>
        </div>

        <div class="guide-callout">
            <p><strong>Model note:</strong> The auto-generated diagrams were removed because they were not exact enough. Each theory card now keeps a clean figure space plus the IV, process, outcome, and moderator cues, so an exact source figure or a hand-drawn version can be added later.</p>
        </div>

        <div class="toc-container" id="toc">
            <h2 style="margin-top: 0; margin-bottom: 1rem;">Table of Contents</h2>
            {toc_html}
        </div>

        {theme_html}

        <section id="priority">
            <div class="part-divider">
                <div>
                    <h2>High-Priority Theories to Memorize First</h2>
                    <p>Use this short list when time is tight and you need a strong first review pass.</p>
                </div>
                <span class="part-count">10 anchors</span>
            </div>
            <div class="paper-card guide-richtext">
                {high_priority_html}
            </div>
        </section>

        <section id="comparison-matrix">
            <div class="part-divider">
                <div>
                    <h2>Cross-Theory Comparison Matrix</h2>
                    <p>This matrix helps you decide which theory family best fits a specific comps question.</p>
                </div>
                <span class="part-count">1 matrix</span>
            </div>
            <div class="paper-card guide-richtext">
                {comparison_html}
            </div>
        </section>

        <section id="exam-questions">
            <div class="part-divider">
                <div>
                    <h2>Common Comprehensive Exam Questions</h2>
                    <p>These are the cross-theory moves that usually make an answer sound stronger and more complete.</p>
                </div>
                <span class="part-count">5 prompts</span>
            </div>
            <div class="paper-card guide-richtext question-essay">
                {questions_html}
            </div>
        </section>
    </main>

    <button id="back-to-top" class="back-to-top" title="Back to top" aria-label="Back to top" style="display: none;">↑</button>

    <script src="/js/study-navbar.js"></script>
    <script src="../js/toast.js"></script>
    <script src="../js/progress.js"></script>
    <script src="../js/theme.js"></script>
    <script src="../js/search.js"></script>
    <script src="../js/highlights.js"></script>
    <script>
        if ('serviceWorker' in navigator) {{
            navigator.serviceWorker.register('../sw.js').catch(() => {{}});
        }}
    </script>

    <script>
        (function () {{
            const backToTop = document.getElementById('back-to-top');
            if (!backToTop) return;

            window.addEventListener('scroll', () => {{
                backToTop.style.display = window.pageYOffset > 300 ? 'flex' : 'none';
            }});

            backToTop.addEventListener('click', () => {{
                window.scrollTo({{ top: 0, behavior: 'smooth' }});
            }});
        }})();
    </script>

    <script>
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {{
            anchor.addEventListener('click', function (event) {{
                const targetId = this.getAttribute('href');
                if (!targetId || targetId === '#') return;

                const target = document.querySelector(targetId);
                if (!target) return;

                event.preventDefault();
                target.scrollIntoView({{ behavior: 'smooth', block: 'start' }});
                target.classList.add('highlight-flash');
                setTimeout(() => target.classList.remove('highlight-flash'), 2000);
            }});
        }});
    </script>
</body>
</html>
"""


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate the /theory/ static HTML page from the comps markdown source.")
    parser.add_argument("source", type=Path, help="Path to the 50-theory markdown source")
    parser.add_argument("output", type=Path, help="Path to write the generated HTML page")
    args = parser.parse_args()

    title, intro, themes, backmatter = parse_source(args.source)
    diagram_output_dir = args.output.parent / "diagrams"
    html = render_page(title, intro, themes, backmatter, diagram_output_dir, "./diagrams")

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(html, encoding="utf-8")


if __name__ == "__main__":
    main()
