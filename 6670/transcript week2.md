# Week 2 Class Session - January 27, 2026
**BCIS 6670 - Topics in Information Systems**  
**Topic:** Sociotechnical Axis of Cohesion, Digital Objects, Agentic IS

---

## Opening Discussion: Why the Sociotechnical Axis Matters

**Dr. Sidorova:** The sociotechnical axis is one of the latest revisits to the question of "what constitutes the intellectual core of IS?" This continuous revisiting happens because:

1. **Identity:** We want to feel important as a discipline
2. **Practical reasons:** When you submit papers, they get evaluated as "relevant" or "not relevant" to IS
   - Many papers rejected as "this is not an IS paper"
   - Without good boundaries, IS researchers get squeezed out when other disciplines bring novel perspectives

The sociotechnical axis focuses on **interaction** as one of the most interesting research approaches.

---

## Part 1: The Six Types of IS Research (Sarker et al.)

### Overview
Research decreases from Type I (completely social) to Type VI (completely technical).  
**Type IV (Interplay) is the ideal** - true sociotechnical research.

---

### Type I: Predominantly Social

**Definition:** IT is just context, barely mentioned. All constructs are social.

**Key Characteristic:** "Research on behavior that happens to involve IT"

**Example Research Questions (from class discussion):**
- ❌ "What types of IT competencies can offer efficiency gains?" (too general)
- ✅ **"Does neuroticism personality trait increase career progression speed of IT employees?"**
  - IV: Neuroticism (social)
  - DV: Career progression (social)
  - Context: IT employees
- ✅ **"Does management style influence employee satisfaction in technology firms?"**
  - IV: Management style (social)
  - DV: Employee satisfaction (social)  
  - Context: Tech firms

**Other Examples:**
- **Social media research:** Behavior on platforms where the tech doesn't play a role
- **Fake news research:** Trust, attention, avoidance - very little technical
- **Information security (PMT):** Protection motivation theory - minimal technical

**The "Transport Test":**  
> If you could take the entire model and transport it from IT security to physical security in an elementary school with NO IT whatsoever, and nothing would change - that's Type I research.

**Why so many Type I studies?**
1. ✅ **Easier data collection** from humans
2. ✅ **Easier to borrow theories** from psychology/management
3. ✅ **Easier to publish** - established categories, known editors
4. ✅ **You don't create portable knowledge** - you port knowledge from other disciplines

**Dr. Sidorova's advice:**
> "Am I telling you not to do it? Absolutely not. We're all practical people. We need to get published. But be **aware** of where you're positioning your paper."

---

### Type II: Social Imperative  

**Definition:** Technology is an outcome of social processes. Organizations shape technology.

**Key Characteristic:** Social causes the technical.

**Example Research Questions:**
- ❌ "Does keeping camera on cause Zoom fatigue?" (That's Type V - Tech Imperative!)
- ✅ **"Does organizational culture influence the use of AI in board meetings?"**
  - IV: Organizational culture (social)
  - DV: Use of AI (technical outcome)
- ✅ **"Would the value of employee well-being have a positive relationship with enabling 'do not disturb' features on apps?"**
  - IV: Organizational values (social)
  - DV: Technology configurations (technical)
- ✅ **"Does within-group trust result in enabling/disabling privacy settings in shared apps?"**
  - IV: Group trust (social)
  - DV: Privacy settings (technical)

**Pattern:** Social characteristics → Technology features/configurations

---

### Type III: Additive Antecedents

**Definition:** Both social AND technical predict outcomes separately. **NO interaction** between them.

**Key Characteristic:** Separate inputs, additive effects.

**Statistical Model:**  
```
Outcome = β₁(Social Factor) + β₂(Tech Factor) + ε
```
No interaction term. No `Social × Tech`.

**Example Research Questions:**
- ✅ **"Do both manager support AND system usability predict employee productivity?"**
  - Social: Manager support
  - Technical: System usability
  - Outcome: Productivity
- ✅ **"Do IS investments AND employee training influence project success?"**
  - Technical: IS investment
  - Social: Employee training  
  - Outcome: Project success

**Why so common?**
- Methodologically **much easier**
- Manipulate tech through design, measure social through surveys
- Stick into regression model
- No time effects, no longitudinal study needed
- At least some will be significant
- **Bonus:** "Because I included a technical construct, I'm doing IS research (not management)!"

**Technology Acceptance Model (TAM)** often has this structure:
- Tech configurations → Perceived usefulness
- User characteristics → Perceived usefulness  
- But no interaction between them

---

### Type IV: Interplay (The Gold Standard!) 🌟

**Definition:** Social ↔ Technical interact dynamically. **True sociotechnical research.**

**Key Characteristic:** Deep interactions between social and technical.

#### Four Subtypes of Type IV:

##### IVa: Reciprocal Interactions
**Conceptualization:** Social influences technical, which influences social back (co-evolution over time)

**Example: ChatGPT Evolution**
1. Users ask questions → ChatGPT gives answers
2. ChatGPT's capability → Changes user behavior (reliance)
3. Users ask more complex questions → Backlash when it fails
4. Developer response → Add chain-of-thought reasoning
5. New capabilities → Users ask even more complex questions

**Pattern:** User behavior → Tech features → User behavior → Tech features (feedback loop)

##### IVb: Fit/Interaction  
**Conceptualization:** Social × Technical interaction term in statistical models

**Statistical Model:**  
```
Outcome = Social + Technical + (Social × Technical)
```

**Example:**
- "Does AI tutoring help low-knowledge students MORE than experts?"
  - Prior knowledge × AI tutoring = interaction effect
- Task-Technology Fit (TTF)
  - ChatGPT better for writing
  - Claude better for coding
  - Outcome depends on FIT between task (social) and tool (technical)

**Key:** The interaction term must be significant!

##### IVc: Sociomaterial Perspective
Two versions:

**Critical Realism:**
- You CAN separate social and technical starts/ends
- But interactions result in changes of one vs. the other
- Sequential interactions over time
- Example: **Leonardi's imbrication** - tech changes → social structure changes → tech changes

**Agentic Realism:**
- You CANNOT separate technical and social
- "Is ChatGPT a technical or social artifact?"
- All technical artifacts are also social artifacts (created with social purpose)
- Social-technical systems are inherently **entangled**

##### IVd: Inscription
**Conceptualization:** Social values/assumptions embedded INTO technical design

**Examples:**
- Design science research based on social theories
- Actor Network Theory (ANT)
- Algorithmic bias - designer assumptions coded into algorithms

---

### Type V: Technical Imperative

**Definition:** Technology drives social outcomes. Tech → Social (one-way causality).

**Key Characteristic:** "Soft" technological determinism.

**Example Research Questions:**
- ✅ **"How does generative AI affect task allocation in insurance companies?"**
  - IV: Gen AI (technical)
  - DV: Task allocation (social)
  - Assumption: We bring AI, things will change
- ✅ **"What jobs will AI automation eliminate by 2030?"**
  - Presumes tech comes NO MATTER WHAT
  - Organizations must adapt to technology

**Why so common?**
1. Introducing new tech = inherent novelty
2. You can **sell artifacts** easier than social change
3. Show ROI (return on investment)
4. Business reasoning: "IS discipline is in business"

**Gartner perspective:** Technology is coming → Organizations will respond

---

### Type VI: Predominantly Technical

**Definition:** Focus on IT design with minimal social consideration. Design science without users.

**Key Characteristic:** Pure engineering. No humans.

**Example Research Questions:**
- ✅ **"How can we reduce database latency by 30%?"**
  - IV: Algorithm design (technical)
  - DV: Latency (technical)
  - No social factors
- **Stanford AI Index Report:** Focuses on AI capabilities where AI hasn't surpassed humans
  - Accuracy improvements
  - Response time
  - Throughput
  - Cost of calculation

**Methodological characteristic:**
- All research done in lab
- Standard datasets, benchmark data
- Clean, controlled environment
- "Conveniently removing all impurities of use and user"

**Problem:** May not work when deployed with real users in messy social systems.

---

## Three Core Observations from Literature Review

### 1. Uneven Emphasis
- Most IS research is **social-dominant (Type I: ~56%)**
- Very little is technical-dominant (Type VI: ~6%)
- **Type IV (middle) is rare: only 13%**
- About **63% clusters at extremes** (Type I + Type VI)

### 2. Limited Relationship Types  
When social AND technical are present, relationship is usually just:
- "Fit"
- "Joint optimization"

Authors argue for accepting MORE varied relationships:
- Contextual
- Inscribed
- Imbricated
- Disharmonious  
- Role-reversal

### 3. Instrumental Focus (91%)
- Almost all research: efficiency, productivity, performance
- Only **9% considers humanistic outcomes:**
  - Well-being
  - Equity
  - Freedom
  - Ethics

---

## Three Recommendations

### Recommendation 1: Accept the Continuum
❌ **Don't** require every study to be in the middle (Type IV)  
✅ **Do** accept research anywhere from Type I → Type VI

**But:**
- Researchers should **KNOW** where their work sits
- Avoid clustering ONLY at extremes
- Use **different evaluation criteria** for different types

### Recommendation 2: Accept Varied Relationships
❌ **Don't** assume social-technical must be in "fit" or "harmony"  
✅ **Do** also accept:
- Contextual
- Inscribed (values in design)
- Imbricated (overlapping like roof tiles - Leonardi)
- Disharmonious (conflict)
- Role-reversal (tech becomes social actor)

### Recommendation 3: Synergistic Humanistic-Instrumental Outcomes  
Link efficiency with ethics in a **virtuous cycle:**

```
Humanistic outcomes (well-being, fairness)  
  ↓  
Employee engagement  
  ↓  
Better performance  
  ↓  
More resources for humanistic outcomes  
  ↓  
(cycle continues)
```

**Example:** Amartya Sen's capabilities approach - human flourishing leads to economic development. "Ethics is good business."

---

## Writing Lesson: Paper Structure

**Dr. Sidorova's key point:** This paper demonstrates excellent structure consistency.

### The Pattern:
1. **Problematization:** IS discipline experiencing disjoint
2. **Theoretical tension:** How to evaluate coherence?
3. **Resolution:** Propose axis of cohesion along sociotechnical continuum
4. **Benefits:** Allows reflection on relationships, outcomes, recommendations
5. **Literature review:** Different types along continuum
6. **Observations:** Abstract across dimensions (types, relationships, outcomes)
7. **Recommendations:** Directly mirror the reflections

### The Meta-Message:
> "I told you what I will tell you. Then I said why it's important. Then I told you what I meant to tell you. Then I told you through a different set of dimensions. Then I reflected on how you can use it - along the SAME dimensions."

**Common mistake students make:**
1. Introduction: Brilliant idea A
2. Literature review: Get excited about B (different!)
3. Theory: Focus on part C (may not be relevant to lit review)
4. Testing: Forget about half of it
5. Implications: Focus on one set, disregard 80% of background

**❌ Don't do that!**

**✅ Ensure consistency between:**
- What you problematized
- Theoretical tension shown
- Resolution proposed
- Guidelines for future research

---

## [BREAK - 10 minutes]

---

## Part 2: Digital Objects (Faulkner & Runde)

**Presenter:** Kim

### Background Context

**Reference point:** Orlikowski & Iacono (2001) paper on IT artifact

**Problem identified:** IS still has insufficient theorizing of technology, even years later.

#### Orlikowski & Iacono's Views of Technology:
1. **Tool view:** IT as labor substitution, productivity, information processing, social relations tool
2. **Proxy view:** Perceptions, investments, diffusion, capital
3. **Ensemble view:** Sociotechnical systems consisting of different elements
4. **Computational view:** Algorithm, model
5. **Nominal view:** Technology is absent (e.g., "leadership in tech firms")

**Faulkner & Runde:** Things haven't changed. Still not enough theorizing of tech.

---

### Alternative Approaches Mentioned

**Why not sufficient for theorizing digital objects:**

- **Resource-Based View (RBV):** Properties like substitutable, imitable  
  → Generic, doesn't deal with WHAT'S INSIDE technology
  → Conclusion: IT cannot result in competitive advantage (easily replicated)

- **Knowledge-Based Logic:** Contributes to social dimension theorizing but not technical

- **Service-Dominant Logic:** Advances but still needs vision

---

### What IS a Digital Object?

#### Definition of "Object"
Two core properties:
1. **Endurance:** Exists over time (may have different states)
2. **Structure:** Has components (not atomic)

#### Three Types of Objects:
1. **Material:** Has weight and spatial dimensions
2. **Non-material:** No weight, no spatial dimensions
3. **Hybrid:** Combination of both

**Boundary condition:** Focus on **inanimate objects only** (excludes humans)

---

### Material vs. Non-Material

**Material objects:**
- Occupy space
- Have mass
- Physical characteristics

**Non-material objects:**
- No weight
- No spatial dimensions
- Include **syntactical objects**

**Dr. Sidorova's note:**
> "We're not physicists. Not talking about waves or quantum. We deal with objects that have mass and endure over time. If we end up in a quantum world where these assumptions don't hold, you have a chance to publish another paper!"

---

### Syntactical Objects

**Definition:** Objects with symbols arranged according to rules to convey meaning

**Examples:**
- Natural language (syntax rules)
- Programming languages
- Mathematical expressions (algebra)

**Key:** Tokens arranged by rules → Convey meaning through arrangement

---

### Bit Strings: The Core of Digital Objects

**Fundamental component:** Bit strings (sequences of 0s and 1s)

**Faulkner & Runde's boundary:**
> "If something has a bit string as its component, we define it as digital technology."

**Implication:**
- Moment you put digital program in microwave → It's a digital object
- Expands IS research space to ANY programmable device

**Pre-quantum assumption:** Binary (0 and 1)  
**Analog:** Explicitly ignored (limitation of theory)

#### Two Types of Bit Strings:
1. **Program files:** Provide instructions
2. **Data files:** Contain information

---

### Bearers (Material Components)

**Concept:** Material objects that "bear" (contain/house) non-material objects

**Examples:**
- Servers
- Hard drives
- Chips
- Electronic circuit boards

**Properties of bearers:**
- Non-degrading (well, ideally!)
- Non-labor loss
- **Essential for interacting with non-material objects**

**Most digital objects are HYBRID:**  
Material bearers + Non-material bit strings

---

### Applying to ChatGPT

**Class discussion:** How useful is this framework?

**Student observation (Danton):**
> "Gets very complicated very quickly. Lots of moving parts with ChatGPT."

**Breakdown:**
- Non-material objects: Prompts you input, responses you get
- Material objects: Servers, data centers
- Depending on research question, might need to analyze ALL layers

**Other student:** "This paper is very hard. Hard to read."

---

### Dr. Sidorova's Assessment

**Strengths:**
✅ "Very good exercise in logical thinking"  
✅ "Good logical structure"  
✅ "Doesn't leave gaps (except quantum!)"  
✅ "Covers all the bases"  
✅ "Clarity of theoretical cultivation"

**Weaknesses:**
❌ "Also because it covers all bases, it becomes **extremely cumbersome**"  
❌ "Too much attention on where bitstring lives, what's material/non-material"  
❌ "Complexity eats up your attention"  
❌ "Not cited as much as I thought it would be"

---

### Key Takeaway from This Paper

**Most important insight:**  
> "No digital object is a simple object. Each digital object is a very, very complex SYSTEM of other very complex material and non-material objects."

**Implications:**
1. **Non-material objects easily modified by social**
2. **Unlikely to have IT completely unchanged by social**
3. **Social influences can significantly alter configurations**

**Example: ChatGPT**
- Investment (social) → Purchase material bearers (material)
- Material infrastructure → Faster LLMs (technical)
- Initial success (social) → More investment (social)
- Complexity makes it a "fairly problematic resource"

---

### Social Positions (Most Important Part!)

**Definition:** Rights and responsibilities expected of an object occupying that position

**Characteristics:**
- Position exists BEFORE object occupies it
- Position is **relational** (exists in relation to other positions)
- Occupying a position = Enacting rights and responsibilities
- Can modify the position's definition over time

#### Example: Doctoral Student

**Before you arrived:** Position existed  
**When accepted:** You agreed to occupy position for X years  
**Rights:** Access to resources, mentorship, etc.  
**Responsibilities:** Pass comps, publish, etc.

**Modification over time:**
If amazing cohort all publishes in top journals → Expectation shifts → Position redefined

---

### Digital Objects and Social Positions

**Key insight:**
> "When you create a digital object, you typically create it to occupy a particular **social position**."

**You do NOT create digital objects in a vacuum.**

#### Applied Research vs. Fundamental Research

**Business creating app to sell:**
- Very specific social position in mind
- Designed FOR that position

**Technologist with breakthrough:**
- May NOT have thought about social position
- Don't know how to sell it
- Not designed for specific position
- **This is why they struggle!**

---

### Possibilities for Digital Objects

1. **Designed for position A → Occupies position A** ✅
2. **Designed for position A → Occupies position B**  
   → Requires changes to adapt
3. **Artifact properties → Stretch social position**  
   (Position expands to accommodate artifact)
4. **Artifact properties → Shrink social position**  
   (Position contracts)

---

### Why Social Position Matters for Sociotechnical Research

**Dr. Sidorova:**
> "Social position is EXTREMELY important. It's that social position that makes the focus on a digital object part of sociotechnical research."

**For design science:**
> "If I'm designing an agent to perform a type of work, and I'm trying to understand that work from the social/interaction point of view - I'm doing sociotechnical research!"

**Interest in social position → Positions your paper** on sociotechnical axis

---

## [BREAK - Students chatting]

---

## Part 3: Agentic IS Artifacts (Baird & Maruping)

**Presenter:** Ramsey

### The Problem (Problematization)

**Changed assumption:**  
IS artifacts were assumed to have **NO agency**. Now we have agentic systems.

**Old assumption no longer holds** for many modern IS artifacts (AI agents, autonomous systems).

**Need:** New theory for these cases

---

### The Resolution: Delegation Framework

**Not just:** Explaining agentic artifact attributes  
**But:** Proposing new type of interaction between human and artifact

**Key concept:** **DELEGATION**

#### Traditional User-Artifact Interaction:
- User has goal
- Artifact is tool to achieve goal
- One-directional

#### New Delegation Interaction:
- Human has goal
- Artifact MAY have goal
- **Human delegates rights/responsibilities to artifact**
- **Artifact can delegate rights/responsibilities to human**
- Bidirectional, complex

---

### Framework Components

**Presenter:** Danton

#### 1. Agents (Human and IS Artifact)

**Three aspects of agents:**

##### A. Endowments
**Definition:** Intrinsic properties - what they're capable of

**Examples:**
- Agentic IS artifact: High computational capabilities, fast processing
- Human: Creativity, judgment, empathy

##### B. Preferences  
**Definition:** Specific motivations

**Human agents:** Require motivation to engage with ISR effect  
**IS agents:** May have embedded preferences (e.g., optimize for speed vs. accuracy)

##### C. Roles
Two types:
1. **Delegator:** Gives up decision-making authority
2. **Proxy:** Accepts decision-making authority

**Difference in rights and responsibilities**

---

#### 2. The Dyad (Human + Agentic IT)

Both occupy **social positions** (connection to Faulkner & Runde!)

**Social positions are inherently relational:**
- One object's position → Implies another object's position
- Rights of A → Impose responsibilities on B
- Responsibilities of A → Grant rights to B

---

### What IS Agency?

**Definition (from paper):**
- Having **choice**
- Having **accountability**
- Ability to **give up control while retaining some rights**

**For IS agent specifically:**
> "System situated in environment, capable of **autonomous action** to meet some objective."

**Key word:** **CHOOSING** an action in response to environment

---

### Levels of Agency (Russell & Norvig - AI Textbook)

#### Simple Reflex Agent
**Mapping function:** Environmental state → Action  
**Example:** If temp < 32°F → Start circulation  
**Agency level:** Low (very precise mapping)

#### Model-Based Agent  
**Has:** Internal model  
**Predicts:** Effect of action on environment  
**Selects:** Action that optimizes outcome  
**Agency level:** Medium

#### Utility-Based Agent (Highest Level)
**Has:** Objective/utility function  
**Optimizes:** Function that gives biggest utility increase over time  
**Agency level:** High

**More choice = More internal processing = More agentic**

---

### The Agency Theory Connection

**When utility-based agent has preferences → Need to align with delegator**

**Human agency theory applied to IS:**
- Principal-agent problem
- Principal delegates to agent
- Agent has own goals and preferences
- If not aligned → Agent may not act in principal's best interest
- **Solution:** Create incentive structure to align interests

**Example in management:**  
Executive compensation design → Align C-suite with shareholder value

---

### Example: Thermostat Agent

**Scenario:**

**Agent (thermostat) preferences:**
- Goal: Maximize longevity
- Optimal condition: Very cold temperatures  
- If optimizing for self: Jack temp all the way down!

**You (human) preferences:**
- Goal: Be comfortable
- Optimal condition: 72°F

**Delegation problem:**  
If you just let agent do what it wants → You freeze!

**Solution:**
Set preference function to optimize YOUR preference, not agent's longevity

**Implementation:**
- If human present → Set to human preference
- If human absent → Optimize cost of heating/cooling

**Agent's "life" is cheap** - not important in optimization

---

### Example: ChatGPT's Preferences

**Question:** What are ChatGPT's preferences?

**Answer:** Way too complicated to fully know (black box complexity)

**But reasonable assumption:**  
OpenAI's preferences (for-profit corporation) → Reflected in ChatGPT's preferences

**OpenAI preferences:**
- Profit optimization (long-term)
- Revenue (customer satisfaction)
- Cost minimization

**ChatGPT's optimization:**
Given all constraints embedded in design:
- Don't make it more expensive than X
- Maximize user satisfaction
- Balance cost vs. quality

**All preferences already inscribed in design**

---

### When Is Delegation Framework Useful?

**Dr. Sidorova's conclusion:**

❌ **NOT as useful for:**
- ChatGPT as general tool
- Technology with multiple layers (gets too complex)

✅ **VERY useful when:**
- Looking at **specific social positions**
- **Specific types of digital objects designed to be agentic**
- Organizations creating positions **specifically for agentic systems**

**Example:** Companies now creating roles to be occupied by AI agents

**Both frameworks useful:**
- Design framework
- Analysis framework

---

## Assignment for Next Week

### Overview
Four seminal papers on **writing and analyzing theory**

### Paper Assignments:

| Student | Paper | Author(s) |
|---------|-------|-----------|
| Ramsey (or Danton) | What Constitutes a Theoretical Contribution? | Whetten |
| OMC | (Whetten's paper) | Whetten |
| Danton | Nature of Theory | Gregor |
| Kim | Next Generation Causal Structure | Marcus & Robey |
| (TBD) | New Approach to Theorizing | Burton-Jones |

**Order of discussion:** Whetten → Gregor → Marcus & Robey → Burton-Jones

---

### Assignment Structure (3 Parts):

#### Part 1: Summarize the Framework
**Focus on:** What does the paper say about:
- What theory should be?
- What theory contribution should be?
- How to evaluate it?

**Key frameworks:**
- **Whetten:** Elements of theory (constructs, what, how, why, when, where)
- **Gregor:** Types of theories (predicting, explaining, describing, etc.)
- **Marcus & Robey:** Types on different dimensions (3 dimensions to identify)
- **Burton-Jones:** Metaphors for theory, different contribution types

---

#### Part 2: Apply to Hybrid Decision-Making Paper
**Paper:** Academy of Management paper on hybrid decision-making using AI

**Task:** Analyze according to YOUR assigned framework

**Examples:**
- **Whetten:** These are the constructs, the what, how, why, when, where
- **Gregor:** This is a theory for predicting/explaining because...
- **Marcus & Robey:** Has organizational level of analysis, technological imperative...
- **Burton-Jones:** (Hardest!) How it fits into new ways of theorizing

---

#### Part 3: Apply to Your Theory Presentation
**Pick:** Theory for your upcoming presentation

**Task:** Analyze through YOUR framework lens

**Note:** This part not discussed in class, but:
- Submit as part of review
- **In your presentation:** Analyze theory through ALL 4 perspectives
  - Whetten elements
  - Gregor type
  - Marcus & Robey classification  
  - Burton-Jones metaphor

---

## Weather Warning & Logistics

**Prediction for next week:**

**Friday:** Wild card - may be mess  
**Monday (class day):** May have issues

**Dr. Sidorova's expectation:**
> "UNT will say: In-person classes canceled, but classes will be held (online)."

**Instructions:**
- ❌ Don't cancel until university says so
- ✅ Take everything you need on Thursday
- ✅ Be prepared for Zoom class
- If campus open but dangerous → Some may join via Zoom

**Warning:**
> "If you think you know how to drive in snow, you are in a place where NOBODY else does. Do NOT drive!"

---

## Class Dismissed

**Time:** ~5:00 PM  
**Next week:** Theory papers + Paper 2 presentations
