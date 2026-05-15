# AI Prompt: Continue Visual Enhancement of IS Theory Encyclopedia

## Context and Task Overview

You are enhancing the visual presentation of an IS Theory Encyclopedia (`comps/theories.html`) for PhD comprehensive exam preparation. The file contains 77 theory entries organized into 5 parts:
- Part 0C: Meta-Theory (7 theories) - ✅ COMPLETED
- Part A: Core IS Theories (15 theories) - 🔄 PARTIALLY DONE (5/15 completed)
- Part B: Organizational & Strategic (18 theories) - ⏳ PENDING
- Part C: Behavioral & Psychological (22 theories) - ⏳ PENDING
- Part D: Security & Criminological (15 theories) - ⏳ PENDING

## CRITICAL RULES

1. **DO NOT remove or shorten ANY text content** - preserve every single word
2. **Only ADD visual enhancements** - highlights, structure, formatting
3. **Use existing CSS classes** from `css/theories-custom.css`
4. **Maintain semantic HTML structure** - don't break existing table structures
5. **Be consistent** - apply same enhancement patterns across similar content types

## CSS Classes Available (from `css/theories-custom.css`)

- `<mark>text</mark>` - Yellow highlight for key terms
- `<span class="construct-badge">term</span>` - Blue pill badge for constructs/variables
- `<div class="exam-tip">tip text</div>` - Green callout box (auto-adds 🎯 Exam Tip prefix)
- `<div class="critical-point">text</div>` - Amber warning box (auto-adds ⚠️ Important prefix)  
- `<div class="key-insight">text</div>` - Blue info box (auto-adds 💡 Key Insight prefix)
- `<div class="mechanism-highlight"><strong>Title:</strong> content</div>` - Purple callout for mechanisms
- `<ul class="theory-list">` - Clean bullet list with blue dots
- `<ol class="framework-steps">` - Numbered steps with circular badges
- `<div class="four-elements"><div class="element-card"><h4>Title</h4><p>content</p></div></div>` - Grid cards

## What Has Been Completed

### ✅ Phase 1: Analysis Label Icons (COMPLETED)
All `<span class="analysis-label">` spans now have emoji icons:
- `📊 Quick Reference`
- `📚 Foundational Origins`
- `💎 Theoretical Core`
- `🔗 Evolution and Extensions (IS focus)`
- `⚠️ Critical Analysis (Exam-ready)` (already had icons)
- `🎯 Practical Application for Exam` (already had icons)

### ✅ Part 0C: Meta-Theory (7/7 COMPLETED)
All theories fully enhanced:
1. ✅ Whetten (1989) - Theory Elements (already had enhancements)
2. ✅ Gregor (2006) - Five Theory Types (already had enhancements)
3. ✅ Markus & Robey (1988) - Causal Structure
4. ✅ Burton-Jones et al. (2021) - Next-Gen Theorizing
5. ✅ Baird (2021) - Writing IS Papers
6. ✅ Sarker et al. (2023) - Reviewing Framework
7. ✅ Sun et al. (2025) - Novelty-Rigor-Relevance

### 🔄 Part A: Core IS Theories (5/15 COMPLETED)
Completed theories:
1. ✅ Digital Object Theory (Faulkner & Runde, 2019)
2. ✅ Sociotechnical Axis of Cohesion (Sarker et al., 2019)
3. ✅ 5 Views of the IT Artifact (Orlikowski & Iacono, 2001)
4. ✅ Technology Affordance Theory
5. ✅ Sociomateriality

**Remaining Part A theories (10):**
6. ⏳ UTAUT/UTAUT2 - ✅ JUST COMPLETED
7. ⏳ Diffusion of Innovations (DOI) - ✅ JUST COMPLETED
8. ⏳ Task-Technology Fit (TTF) - IN PROGRESS
9. ⏳ DeLone & McLean IS Success Model
10. ⏳ Affective Response Model (ARM) (Zhang, 2013)
11. ⏳ IS Delegation Framework
12. ⏳ Human-AI Delegation Dynamics (Liu et al., 2025)
13. ⏳ Human-AI Hybrid Problem-Solving (Raisch & Fomina, 2024)
14. ⏳ Media Richness Theory
15. ⏳ Electronic Markets Hypothesis

## Enhancement Pattern Applied

For each theory entry, follow this systematic approach:

### 1. Quick Reference Section
- Add `<mark>` tags to:
  - Author names and years (e.g., `<mark>Barney (1991)</mark>`)
  - Key journal names (e.g., `<mark>MIS Quarterly</mark>`)
  - Important concepts mentioned in table cells
- Add `<span class="construct-badge">` to:
  - All core constructs listed in "Core constructs" table row
  - Key theoretical terms mentioned in table cells
  - Variables, dimensions, factors

### 2. Foundational Origins Section
- Add `<mark>` tags to:
  - Author names
  - Key years
  - Theory names
  - Important papers cited
- Extract exam tips if present (phrases like "for comps", "exam use", etc.)
- Add key insights for main contributions

### 3. Theoretical Core Section
- Add `<mark>` tags to core concepts
- Wrap constructs in `<span class="construct-badge">`
- Extract key insights: Wrap main propositions in `<div class="key-insight">`
- Convert dense paragraphs to structured formats:
  - **Lists of 3-5 items** → `<div class="four-elements">` with `<div class="element-card">`
  - **Sequential steps** → `<ol class="framework-steps">`
  - **Bullet points** → `<ul class="theory-list">`
- Add `<div class="critical-point">` for boundary conditions, limitations
- Add `<div class="exam-tip">` for exam-relevant advice

### 4. Evolution and Extensions Section
- Add `<mark>` tags to extension authors and key papers
- Add construct badges for new constructs introduced
- Structure IS-specific applications

### 5. Critical Analysis Section
- Convert to `<ul class="theory-list">` with proper structure:
  ```html
  <ul class="theory-list">
      <li><strong>Strengths:</strong> ...</li>
      <li><strong>Weaknesses:</strong> ...</li>
      <li><strong>Common misapplications:</strong> ...</li>
      <li><strong>Alternatives/competitors:</strong> ...</li>
  </ul>
  ```
- Add construct badges to key terms
- Add mark tags to theory names mentioned

### 6. Practical Application Section
- Extract exam tips into `<div class="exam-tip">`
- Structure measurement approaches using:
  - `<div class="mechanism-highlight">` for "what I would measure" sections
  - `<ol class="framework-steps">` for sequential measurement steps
  - `<ul class="theory-list">` for lists of measures
- Add mark tags to citations: `<mark>Author (Year)</mark>`

## Example Enhancement Pattern

**BEFORE:**
```html
<div class="analysis-section">
    <span class="analysis-label">Theoretical Core</span>
    <p>The core proposition is that sustained competitive advantage depends on resources and capabilities that competitors cannot easily get or copy. "Resources" can be assets, processes, knowledge, or relationships, but the key point is not the label. The key is whether the resource actually creates value, is scarce, and is protected by isolating mechanisms.</p>
</div>
```

**AFTER:**
```html
<div class="analysis-section">
    <span class="analysis-label">💎 Theoretical Core</span>
    
    <div class="key-insight">
        Sustained competitive advantage depends on <span class="construct-badge">resources</span> and <span class="construct-badge">capabilities</span> that competitors cannot easily get or copy
    </div>
    
    <p>The core proposition is that sustained competitive advantage depends on <span class="construct-badge">resources</span> and <span class="construct-badge">capabilities</span> that competitors cannot easily get or copy. "<span class="construct-badge">Resources</span>" can be <mark>assets</mark>, <mark>processes</mark>, <mark>knowledge</mark>, or <mark>relationships</mark>, but the key point is not the label. The key is whether the resource actually creates <mark>value</mark>, is <mark>scarce</mark>, and is protected by <span class="construct-badge">isolating mechanisms</span>.</p>
    
    <div class="critical-point">
        RBV can become circular if a paper defines a resource as "valuable" only because the firm performs well.
    </div>
</div>
```

## Current File State

- **File**: `/Users/alisafari/Projects/space/comps/theories.html`
- **Total lines**: ~10,025 lines
- **Status**: Part 0C complete, Part A partially complete (5-7 theories done)

## Next Steps - Continue Enhancement

### Immediate Next: Complete Part A (10 remaining theories)

1. **Task-Technology Fit (TTF)** - Currently reading, needs enhancement
2. **DeLone & McLean IS Success Model** - Needs full enhancement
3. **Affective Response Model (ARM)** - Needs full enhancement
4. **IS Delegation Framework** - Needs full enhancement
5. **Human-AI Delegation Dynamics** - Needs full enhancement
6. **Human-AI Hybrid Problem-Solving** - Needs full enhancement
7. **Media Richness Theory** - Needs full enhancement
8. **Electronic Markets Hypothesis** - Needs full enhancement

### Then: Part B (18 theories)
- Resource-Based View (RBV)
- Dynamic Capabilities
- Transaction Cost Economics (TCE)
- Agency Theory
- Institutional Theory
- Absorptive Capacity
- Organizational Learning Theory
- Knowledge-Based View (KBV)
- Structuration Theory
- Actor-Network Theory (ANT)
- Network Effects Theory
- Platform Theory
- Contingency Theory
- Organizational Routines
- Sensemaking Theory
- Organizational Ambidexterity
- Open Innovation
- Stakeholder Theory

### Then: Part C (22 theories)
- Prospect Theory
- Trust Theory
- Social Cognitive Theory
- Theory of Planned Behavior
- Expectation-Confirmation Theory
- Self-Determination Theory
- Flow Theory
- Cognitive Load Theory
- Dual-Process Theory
- Attribution Theory
- Social Exchange Theory
- Social Identity Theory
- Social Influence Theory
- Protection Motivation Theory
- Fear Appeals
- Psychological Ownership
- Habit Theory
- Privacy Calculus
- Justice Theory
- Switching Costs
- Technostress
- Coping Theory

### Finally: Part D (15 theories)
- All security and criminological theories

## How to Find Theory Entries

Each theory is wrapped in:
```html
<div class="paper-card" id="theory-id">
    <h2>Theory Name</h2>
    ...
</div>
```

Use grep to find specific theories:
```bash
grep -n 'paper-card.*id="theory-name"' theories.html
```

## Enhancement Checklist Per Theory

For each `<div class="paper-card">`:

- [ ] Quick Reference: Add mark tags to authors/years, construct badges to core constructs
- [ ] Foundational Origins: Add mark tags, extract exam tips, add key insights
- [ ] Theoretical Core: Add mark tags, construct badges, key insights, structure dense paragraphs
- [ ] Evolution and Extensions: Add mark tags, construct badges
- [ ] Critical Analysis: Convert to structured `<ul class="theory-list">`
- [ ] Practical Application: Extract exam tips, structure measurement sections, add mark tags to citations

## Important Notes

1. **Preserve all text**: Never delete or shorten content, only add visual elements
2. **Consistency**: Apply same patterns across all theories
3. **Don't break tables**: Keep table structures intact, only enhance cell content
4. **Citation format**: Always wrap citations as `<mark>Author (Year)</mark>`
5. **Construct badges**: Use for variables, dimensions, factors, core theoretical terms
6. **Mark tags**: Use for author names, years, theory names, key concepts
7. **Four-elements grid**: Use for 3-5 related components/dimensions
8. **Framework-steps**: Use for sequential processes or numbered lists
9. **Theory-list**: Use for bullet points, strengths/weaknesses lists

## Work Efficiently

Given the large scope (60+ theories remaining), work systematically:
1. Read each theory entry fully
2. Apply enhancements section by section
3. Use search_replace with replace_all=false for precise edits
4. Verify changes preserve all original text
5. Move to next theory

## Success Criteria

When complete, all 77 theories should have:
- ✅ Icons in all analysis-label spans
- ✅ Key terms highlighted with mark tags
- ✅ Core constructs wrapped in construct badges
- ✅ Exam tips extracted where relevant
- ✅ Dense paragraphs converted to structured formats
- ✅ All original text content preserved
- ✅ Visual consistency across all theories

## Start Here

Begin with completing **Task-Technology Fit (TTF)** which is currently being read. Then continue systematically through all remaining Part A theories, then Part B, C, and D.

Remember: Accuracy and completeness are critical - don't rush, ensure every enhancement is correct and preserves all original content.
