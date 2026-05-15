import re

with open('/Users/alisafari/Projects/space/6480/exam1.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Add TOC
toc_html = """
        <div class="paper-card" id="toc">
            <h2>Table of Contents</h2>
            <ul style="line-height: 1.8;">
                <li><a href="#formula-sheet">One-Page Formula Sheet</a></li>
                <li><a href="#flowcharts">Decision Flowcharts (Fast Rules)</a></li>
                <li><a href="#trap-zone">True/False Trap Zone</a></li>
                <li><a href="#dummy-regression">One-Way ANOVA as Regression</a></li>
                <li><a href="#unequal-variance">Unequal Variances + Unequal n</a></li>
                <li><a href="#effect-size">Effect Size from F</a></li>
                <li><a href="#tukey-hsd">Tukey HSD</a></li>
                <li><a href="#tukey-vs-scheffe">Tukey vs Scheffe</a></li>
                <li><a href="#orthogonal-contrasts">Orthogonal Contrasts</a></li>
                <li><a href="#power">Power + Sample Size</a></li>
                <li><a href="#walkthrough-q16">Full Walkthrough (Social Media)</a></li>
                <li><a href="#mediation-traps">Mediation Trap Notes</a></li>
                <li><a href="#serial-mediation">Serial Mediation</a></li>
                <li><a href="#exam-drills">Exam Drills</a></li>
                <li><a href="#project-1-numbers">Project 1 Key Numbers</a></li>
                <li><a href="#common-mistakes">Common Number Mistakes</a></li>
            </ul>
        </div>
"""

# Find the div that contains One-Page Formula Sheet
match = re.search(r'(\s*<div class="paper-card">\s*<h2>One-Page Formula Sheet)', html)
if match:
    # insert TOC before it
    html = html[:match.start()] + toc_html + html[match.start():]
    # Add id to the formula sheet h2
    html = html.replace('<h2>One-Page Formula Sheet (Exam 1)</h2>', '<h2 id="formula-sheet">One-Page Formula Sheet (Exam 1)</h2>')
else:
    print("Could not find Formula Sheet section")


# Add IDs to headers (if not already added)
html = html.replace('<h2>Decision Flowcharts (Fast Decision Rules)</h2>', '<h2 id="flowcharts">Decision Flowcharts (Fast Decision Rules)</h2>')
html = html.replace('<h2>True/False Trap Zone (10 Core Traps from Exam 2025)</h2>', '<h2 id="trap-zone">True/False Trap Zone (10 Core Traps from Exam 2025)</h2>')
html = html.replace('<h2>One-Way ANOVA as Regression (Dummy Variables)</h2>', '<h2 id="dummy-regression">One-Way ANOVA as Regression (Dummy Variables)</h2>')
html = html.replace('<h2>Unequal Variances + Unequal n: What Happens to Type I Error?</h2>', '<h2 id="unequal-variance">Unequal Variances + Unequal n: What Happens to Type I Error?</h2>')
html = html.replace('<h2>Effect Size from F (Fixed Effects) + Association for Random Effects</h2>', '<h2 id="effect-size">Effect Size from F (Fixed Effects) + Association for Random Effects</h2>')
html = html.replace('<h2>Tukey HSD: Reading Output + Critical Difference (Show Computation)</h2>', '<h2 id="tukey-hsd">Tukey HSD: Reading Output + Critical Difference (Show Computation)</h2>')
html = html.replace('<h2>Tukey vs Scheffe: Why They Can Disagree</h2>', '<h2 id="tukey-vs-scheffe">Tukey vs Scheffe: Why They Can Disagree</h2>')
html = html.replace('<h2>Orthogonal Contrasts (3 Groups) + How to Test Them</h2>', '<h2 id="orthogonal-contrasts">Orthogonal Contrasts (3 Groups) + How to Test Them</h2>')
html = html.replace('<h2>Power + Sample Size for One-Way ANOVA (5% vs 1%)</h2>', '<h2 id="power">Power + Sample Size for One-Way ANOVA (5% vs 1%)</h2>')


# 2. Add Memory Hook column (regex to handle spaces precisely)
table_match = re.search(r'Pattern.*?<th>What happens</th>.*?(<th>Memory line.*?</tr>\s*</thead>\s*<tbody>\s*<tr>\s*<td>.*?</td>\s*<td>.*?</td>\s*<td>.*?</td>\s*</tr>\s*<tr>\s*<td>.*?</td>\s*<td>.*?</td>\s*<td>.*?</td>\s*</tr>\s*</tbody>\s*</table>)', html, re.DOTALL)
if table_match:
    table_old = table_match.group(0)
    # The string to replace is a bit tricky, let's just use exact replace with sub
    table_new = table_old.replace('Memory line', 'Memory Hook')
    table_new = re.sub(r'<td>Bad combo = small \+ noisy</td>', '<td><strong style="color: #e74c3c;">Noisy + Small = Danger (Liberal)</strong></td>', table_new)
    table_new = re.sub(r'<td>Small groups are stable</td>', '<td><strong style="color: #27ae60;">Quiet + Small = Safe (Conservative)</strong></td>', table_new)
    html = html.replace(table_old, table_new)


# 3. Highlight Power Answers
power_match = re.search(r'<p><strong>Expected numbers:</strong> power is about <strong>0.591</strong> at 5% and about <strong>0.327</strong> at 1% with these inputs.</p>', html)
if power_match:
    power_new = """
                <div class="success-box" style="text-align: center; font-size: 1.1em;">
                    <strong>Expected Power:</strong><br>
                    <span style="color: #2c3e50; font-weight: bold; font-size: 1.2em;">0.591</span> (at alpha = 5%)<br>
                    <span style="color: #c0392b; font-weight: bold; font-size: 1.2em;">0.327</span> (at alpha = 1%)
                </div>
"""
    html = html.replace(power_match.group(0), power_new)


# 4. Fix Duplicate Q16
q16_first = re.search(r'<div class="paper-card">\s*<h2>Full Walkthrough: Social Media Websites \(Exam 2025 Q16 Style\)</h2>', html)
q16_second = re.search(r'<div class="paper-card" id="walkthrough-q16">\s*<h2>Full Walkthrough: Social Media Websites \(Exam 2025 Q16 Style\)</h2>', html)

if q16_first and q16_second:
    html = html[:q16_first.start()] + html[q16_second.start():]


# 5. Enhance SC3 & SC5
if 'Right-skewed residuals violate the normality assumption of standard GLM ANOVA.\n	                        I would fit a Gamma model with log link' in html:
    html = html.replace(
        'Right-skewed residuals violate the normality assumption of standard GLM ANOVA.\n	                        I would fit a Gamma model with log link (GENMOD style) and also run a nonparametric method (DSCF).\n	                        Then I compare conclusions and report stable vs method-sensitive pairs.',
        'Right-skewed residuals violate the normality assumption of standard GLM ANOVA. Even if Levene\'s test (which checks for equal variances, not normality) passes, skewness is a separate concern. I would fit a Gamma model with log link (GENMOD style) and a nonparametric method (DSCF). Then I compare conclusions and report stable vs method-sensitive pairs.'
    )

if 'Choose X6 ($6). The rule is: stop at the first non-significant contrast. If C3 is the first' in html:
    html = html.replace(
        'Choose X6 ($6). The rule is: stop at the first non-significant contrast. If C3 is the first\n		                        non-significant step, you stop there, and that option is the best "not worse" choice at lower cost.',
        'Choose X6 ($6). The sequential rule requires stopping at the *first* non-significant contrast. Since C3 is not significant, the sequence stops immediately. C4 is never tested. We conclude X6 is the lowest amount not significantly worse than higher amounts.'
    )

# 6 & 7. Add Checklists at the bottom
add_blocks = """
        <div class="paper-card" id="project-1-numbers">
            <h2>Project 1 Key Numbers (Quick Reference)</h2>
            <div class="persian-section" lang="fa" dir="rtl">
                <h4>توضیح فارسی: اعداد مهم پروژه ۱</h4>
                <p>اگر تو امتحان دقیقا از داده‌های پروژه ۱ (Hold Times یا Green Shipping) سوال آمد، این عددها رو داشته باش:</p>
            </div>
            <ul>
                <li><strong>Mediation (Cultural Values & Entrep_Self_Eff):</strong> Total effect is near 0 (p = .403) but indirect is strong (0.2249, CI: [0.15, 0.31]) and direct is negative (-0.1867). This is <em>competitive mediation</em>.</li>
                <li><strong>Moderation:</strong> Both interactions (Entrep_Self_Eff and Religiosity) were <em>not significant</em> (p = .892 and p = .946).</li>
                <li><strong>Hold Times ANOVA (P2):</strong> Levene passed (p = .092), GLM F(3,377)=8.39 (p=2.06e-05), Welch F=9.89. NorthHub is significantly longest.</li>
                <li><strong>Hold Times Post-Hoc:</strong> GLM Tukey exact diff for PrairieSupport vs MetroAssist is +0.719 (p = .074, not sig). DSCF finds it significant (p = .002).</li>
                <li><strong>Green Shipping Contrasts (P3):</strong> C1 (t=-5.76) and C2 (t=-4.47) are significant. C3 (t=-1.979, raw p=.0625) is NOT significant under any correction (Holm, FDR, Bonferroni). Decision: X6 ($6).</li>
            </ul>
        </div>

        <div class="paper-card" id="common-mistakes">
            <h2>Common Number Mistakes</h2>
            <div class="persian-section" lang="fa" dir="rtl">
                <h4>توضیح فارسی: خطاهای عدددهی شایع</h4>
                <p>اینها مواردی هستند که دانشجوها معمولا در محاسبات یا نوشتن گزارش اشتباه می‌کنند:</p>
            </div>
            <ul>
                <li>If <code>omega^2</code> computes to a negative number, always report it as <strong>0</strong> (truncate at zero). Never report negative effect size metrics.</li>
                <li>For Tukey critical difference, make sure to use <code>p</code> (number of groups) to look up the <code>q</code> value, not <code>df_error</code>.</li>
                <li>In mediation, the indirect-to-total ratio can be greater than 1. This is mathematically correct in competitive mediation. Don't assume it's an error.</li>
            </ul>
        </div>
"""
if 'id="project-1-numbers"' not in html:
    html = html.replace('<div class="paper-card" id="final-checklist">', add_blocks + '\n        <div class="paper-card" id="final-checklist">')

with open('/Users/alisafari/Projects/space/6480/exam1.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("Done")
