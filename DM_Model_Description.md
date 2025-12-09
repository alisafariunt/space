# D&M IS Success Model Diagram - Description for Drawing

## Title
**Theoretical Foundation: D&M IS Success Model (DeLone & McLean, 2003)**

---

## Model Structure

### Left Side - Quality Dimensions (3 boxes stacked vertically)

**Box 1: System Quality** (Green border, highlighted)
- Label: "System Quality"
- Annotation: "EVM: ↑ 89-99% Unknown Recall"
- Sub-note: "(vs 3% baseline)"
- Color: Bright Green - MUCH BETTER

**Box 2: Information Quality** (Orange border)
- Label: "Information Quality"  
- Annotation: "More alerts (still 3x better)"
- Sub-note: "32% precision vs 12% baseline"
- Color: Orange - BETTER but with operational cost (more alerts to review)

**Box 3: Service Quality** (Gray border, dimmed)
- Label: "Service Quality"
- Annotation: "(not directly affected)"
- Color: Gray/dimmed

---

### Middle - Usage Constructs (2 boxes with bidirectional arrow)

**Box 4: Use**
- Label: "Use"
- Purple border

**Box 5: User Satisfaction**
- Label: "User Satisfaction"
- Purple border
- Connected to Use with bidirectional arrow (↔)

---

### Right Side - Outcome

**Box 6: Net Benefits** (Cyan border, prominent, larger)
- Label: "Net Benefits"
- Annotation line 1: "Organizational Resilience"
- Annotation line 2: "Avoid severe losses"

---

## Arrow Connections (Important!)

1. **System Quality → Use** (solid GREEN arrow)
2. **System Quality → User Satisfaction** (solid GREEN arrow)
3. **Information Quality → Use** (solid ORANGE arrow)
4. **Information Quality → User Satisfaction** (solid ORANGE arrow)
5. **Service Quality → Use** (dashed gray arrow - less relevant)
6. **Service Quality → User Satisfaction** (dashed gray arrow - less relevant)
7. **Use ↔ User Satisfaction** (bidirectional purple arrow)
8. **Use → Net Benefits** (solid gray arrow)
9. **User Satisfaction → Net Benefits** (solid gray arrow)

---

## Color Scheme

- **System Quality**: Green (#10b981) - Much better (99% vs 3%)
- **Information Quality**: Orange (#f59e0b) - Better but with cost (more alerts)
- **Service Quality**: Gray (#6b7280) - Not affected
- **Use & User Satisfaction**: Purple (#8b5cf6) - Process
- **Net Benefits**: Cyan (#06b6d4) - Outcome/Goal
- **Background**: Dark (#0c1015)

---

## Legend Box (Top Right)

| Color | Meaning |
|-------|---------|
| Green circle | Much better |
| Orange circle | Better (with cost) |
| Gray circle | Not affected |

---

## Summary Bar (Bottom of slide)

| ↑↑ System Quality | ↑ Information Quality | ↑ Net Benefits |
|---|---|---|
| 99% vs 3% recall | 32% vs 12% precision (but more alerts) | prevent severe losses |

---

## Key Message

**IMPORTANT: EVM is better on BOTH metrics compared to baselines!**

- **System Quality**: EVM achieves 99.98% unknown recall vs 3% for Isolation Forest
- **Information Quality**: EVM achieves 32% precision vs 12% for Isolation Forest (3x better!)
- The "cost" is operational: higher recall means more total alerts to review
- But this is the RIGHT trade-off: missed attacks cause severe damage, false alarms can be filtered

---

## Visual Style Notes

1. Boxes should have rounded corners
2. Arrows should be clearly visible with arrowheads
3. The three Quality boxes on the left should visually connect to BOTH Use and User Satisfaction in the middle
4. Use a clean, professional look suitable for academic conference
5. Green arrows from System Quality should be prominent (main contribution)
6. Orange arrows from Information Quality show it's still positive but with operational cost
7. Service Quality should appear slightly faded/dimmed to show it's not the focus
8. Net Benefits box should be larger/more prominent as the ultimate goal

