# IS Theory Encyclopedia

A comprehensive, responsive HTML study guide for Information Systems theories.

## 📁 Files

- **index.html** - Home page with welcome and navigation
- **theories.html** - Complete encyclopedia with all 83 theories
- **css/style.css** - Styling (copied from BCIS 6670 project)
- **js/progress.js** - Reading progress tracker
- **manifest.json** - PWA manifest

## 🎯 Features

✅ **Complete Content Preservation** - All 83 theories with full details
✅ **Responsive Design** - Works on desktop, tablet, and mobile
✅ **Progress Tracking** - Visual indicator shows reading progress
✅ **Quick Navigation** - Jump to any theory from the navigation bar
✅ **Print Friendly** - Optimized for printing to PDF
✅ **Persian Text Support** - RTL support for Persian sections (if any)
✅ **Clean Structure** - Each theory has:
   - Quick Reference table
   - Foundational Origins
   - Theoretical Core
   - Evolution in IS
   - Critical Analysis
   - Practical Applications

## 🚀 How to Use

### Local Development
Open `index.html` in your browser to start reading.

### With Local Server (recommended)
```bash
cd /sessions/affectionate-tender-ptolemy/mnt/space/comps
python3 -m http.server 8000
```
Then open: http://localhost:8000

## 📊 Statistics

- **Total Theories**: 83
- **Total File Size**: ~479 KB (theories.html)
- **Total Lines**: ~6,094 lines
- **CSS Classes Used**: paper-card, analysis-section, analysis-label, info-box, warning-box, success-box

## 🎨 Styling

The CSS is copied from the BCIS 6670 study guide and includes:
- Blue gradient navbar
- Color-coded boxes (info, warning, success)
- Responsive tables
- Code highlighting
- Dark mode support (if enabled)
- Print optimization

## 📝 Structure

Each theory follows this template:

```html
<div class="paper-card" id="theory-slug">
  <h2>Theory Name</h2>

  <div class="analysis-section">
    <span class="analysis-label">Quick Reference</span>
    <table>...</table>
  </div>

  <div class="analysis-section">
    <span class="analysis-label">Foundational Origins</span>
    <p>...</p>
  </div>

  <!-- More sections... -->
</div>
```

## 🔍 Quality Checklist

✅ All 83 theories converted from markdown
✅ NO content summarized or removed
✅ Tables render properly with styling
✅ Navigation links work correctly
✅ Progress bar tracks reading position
✅ Mobile responsive (tested at 768px)
✅ Print layout optimized

## 📚 Theory List

The encyclopedia includes theories such as:
- Technology Acceptance Model (TAM)
- Theory of Planned Behavior (TPB)
- Unified Theory of Acceptance and Use of Technology (UTAUT)
- Diffusion of Innovations (DOI)
- Task-Technology Fit (TTF)
- DeLone and McLean IS Success Model
- Sociomateriality
- Trust Theory
- Institutional Theory
- Resource-Based View (RBV)
- ...and 73 more!

## 🎓 Created For

**Ali Safari**
PhD Comprehensive Exam Preparation
February 2026

Based on the BCIS 6670 Study Guide structure and styling.

---

*Generated automatically from Theory_Encyclopedia_IS.md*
*Last updated: 2026-02-05*
