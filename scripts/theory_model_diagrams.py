THEORY_MODEL_DIAGRAMS = {
    1: {
        "label": "Canonical path model",
        "lines": [
            "[External Variables] -> [Perceived Ease of Use] -> [Perceived Usefulness]",
            "[Perceived Ease of Use] -> [Attitude toward Use]",
            "[Perceived Usefulness] -> [Attitude toward Use]",
            "[Perceived Usefulness] -> [Behavioral Intention] -> [Actual Use]",
            "[Attitude toward Use] -> [Behavioral Intention]",
        ],
    },
    2: {
        "label": "Canonical extension structure",
        "lines": [
            "[Subjective Norm] -> [Behavioral Intention]",
            "[Image] + [Job Relevance] + [Output Quality] + [Result Demonstrability] -> [Perceived Usefulness]",
            "[Perceived Ease of Use] -> [Perceived Usefulness]",
            "[Perceived Usefulness] + [Perceived Ease of Use] -> [Behavioral Intention] -> [Use]",
        ],
    },
    3: {
        "label": "Canonical grouped model",
        "lines": [
            "[Anchors: self-efficacy, external control, anxiety, playfulness] -> [Perceived Ease of Use]",
            "[Adjustments: enjoyment, objective usability] -> [Perceived Ease of Use]",
            "[TAM2 determinants] -> [Perceived Usefulness]",
            "[Perceived Ease of Use] -> [Perceived Usefulness]",
            "[Perceived Usefulness] + [Perceived Ease of Use] -> [Behavioral Intention] -> [Use]",
        ],
    },
    4: {
        "label": "Canonical path model",
        "lines": [
            "[Performance Expectancy] -> [Behavioral Intention]",
            "[Effort Expectancy] -> [Behavioral Intention]",
            "[Social Influence] -> [Behavioral Intention]",
            "[Behavioral Intention] -> [Use Behavior]",
            "[Facilitating Conditions] -> [Use Behavior]",
            "Moderators: gender, age, experience, voluntariness of use",
        ],
    },
    5: {
        "label": "Canonical consumer extension",
        "lines": [
            "[Performance Expectancy] -> [Behavioral Intention]",
            "[Effort Expectancy] -> [Behavioral Intention]",
            "[Social Influence] -> [Behavioral Intention]",
            "[Hedonic Motivation] -> [Behavioral Intention]",
            "[Price Value] -> [Behavioral Intention]",
            "[Behavioral Intention] -> [Use Behavior]",
            "[Habit] -> [Behavioral Intention] and [Use Behavior]",
            "[Facilitating Conditions] -> [Use Behavior]",
            "Moderators: age, gender, experience",
        ],
    },
    6: {
        "label": "Canonical path model",
        "lines": [
            "[Behavioral Beliefs] -> [Attitude toward Behavior]",
            "[Normative Beliefs] -> [Subjective Norm]",
            "[Attitude toward Behavior] + [Subjective Norm] -> [Behavioral Intention]",
            "[Behavioral Intention] -> [Behavior]",
        ],
    },
    7: {
        "label": "Canonical path model",
        "lines": [
            "[Attitude] -> [Behavioral Intention]",
            "[Subjective Norm] -> [Behavioral Intention]",
            "[Perceived Behavioral Control] -> [Behavioral Intention]",
            "[Behavioral Intention] -> [Behavior]",
            "[Perceived Behavioral Control] -> [Behavior]",
        ],
    },
    8: {
        "label": "Canonical diffusion process",
        "direction": "TB",
        "lines": [
            "[Knowledge] -> [Persuasion] -> [Decision] -> [Implementation] -> [Confirmation]",
            "[Relative Advantage] + [Compatibility] + [Complexity] + [Trialability] + [Observability] -> [Persuasion]",
            "Communication channels + time + social system shape diffusion speed",
        ],
    },
    9: {
        "label": "Canonical continuance model",
        "lines": [
            "[Confirmation] -> [Perceived Usefulness]",
            "[Confirmation] -> [Satisfaction]",
            "[Perceived Usefulness] -> [Satisfaction]",
            "[Perceived Usefulness] -> [Continuance Intention]",
            "[Satisfaction] -> [Continuance Intention]",
        ],
    },
    10: {
        "label": "Canonical success model",
        "lines": [
            "[System Quality] -> [Use / Intention to Use]",
            "[Information Quality] -> [Use / Intention to Use]",
            "[Service Quality] -> [Use / Intention to Use]",
            "[System Quality] -> [User Satisfaction]",
            "[Information Quality] -> [User Satisfaction]",
            "[Service Quality] -> [User Satisfaction]",
            "[Use / Intention to Use] <-> [User Satisfaction]",
            "[Use / Intention to Use] -> [Net Benefits]",
            "[User Satisfaction] -> [Net Benefits]",
        ],
    },
    11: {
        "label": "Canonical fit model",
        "lines": [
            "[Task Characteristics] -> [Task-Technology Fit]",
            "[Technology Characteristics] -> [Task-Technology Fit] -> [Utilization] -> [Performance Impact]",
            "[Task-Technology Fit] -> [Performance Impact]",
        ],
    },
    12: {
        "label": "Canonical cognitive fit logic",
        "lines": [
            "[Problem Representation] + [Task Type] -> [Cognitive Fit]",
            "[Cognitive Fit] -> [Lower Mental Transformation] -> [Better Problem-Solving Performance]",
        ],
    },
    13: {
        "label": "Canonical media-choice logic",
        "lines": [
            "[Higher Task Equivocality] -> [Richer Media Choice]",
            "[Lower Task Equivocality]  -> [Leaner Media Choice]",
            "Richness comes from: feedback, multiple cues, language variety, personal focus",
        ],
    },
    14: {
        "label": "Canonical fit logic",
        "lines": [
            "[Uncertainty / Equivocality] -> [Information Requirements]",
            "[Organizational Design + IS Capability] -> [Information Processing Capacity]",
            "[Information Requirements] + [Information Processing Capacity] -> [Fit]",
            "[Fit] -> [Performance / Coordination Quality]",
        ],
    },
    15: {
        "label": "Canonical strategic logic",
        "lines": [
            "[Resources / Capabilities] -> [VRIN Attributes]",
            "[VRIN Attributes] -> [Sustained Competitive Advantage] -> [Performance]",
        ],
    },
    16: {
        "label": "Canonical capability cycle",
        "lines": [
            "[Sensing] -> [Seizing] -> [Transforming / Reconfiguring]",
            "[Transforming / Reconfiguring] -> [Renewed Resource Base / Advantage]",
        ],
    },
    17: {
        "label": "Canonical value path",
        "lines": [
            "[IT Resources] + [Complementary Organizational Resources] -> [Business Process Performance] -> [Organizational Performance]",
        ],
    },
    18: {
        "label": "Canonical alignment structure",
        "direction": "TB",
        "lines": [
            "[Business Strategy] <-> [IT Strategy]",
            "[Business Strategy] -> [Business Infrastructure]",
            "[IT Strategy] -> [IT Infrastructure]",
            "[Business Infrastructure] <-> [IT Infrastructure]",
            "Strategic fit links top to bottom; functional integration links business and IT",
        ],
    },
    19: {
        "label": "Canonical context framework",
        "lines": [
            "[Technology Context] -> [Adoption / Assimilation]",
            "[Organization Context] -> [Adoption / Assimilation]",
            "[Environment Context] -> [Adoption / Assimilation]",
        ],
    },
    20: {
        "label": "Canonical contingency logic",
        "lines": [
            "[Contingency Factors] -> [Best-Fitting Structure / Design] -> [Performance]",
        ],
    },
    21: {
        "label": "Canonical upper-echelons logic",
        "lines": [
            "[Top Managers' Experiences / Values / Cognition] -> [Strategic Choices] -> [Organizational Outcomes]",
        ],
    },
    22: {
        "label": "Canonical governance logic",
        "lines": [
            "[Asset Specificity] + [Uncertainty] + [Frequency] -> [Transaction Costs]",
            "[Transaction Costs] -> [Governance Choice: market / hybrid / hierarchy]",
        ],
    },
    23: {
        "label": "Canonical agency structure",
        "lines": [
            "[Principal] --delegates--> [Agent]",
            "[Information Asymmetry] + [Goal Conflict] -> [Agency Problems]",
            "[Agency Problems] -> [Monitoring / Incentives] -> [Lower Agency Loss]",
        ],
    },
    24: {
        "label": "Canonical signaling logic",
        "lines": [
            "[Hidden Quality]",
            "[Signaler] --costly credible signal--> [Receiver's quality judgment / reduced uncertainty]",
        ],
    },
    25: {
        "label": "Canonical reinforcing loop",
        "lines": [
            "[Installed Base] -> [User Value] -> [More Adoption] -> [Larger Installed Base]",
            "[Larger Installed Base] -> [User Value]",
            "Indirect loop: [More Users] -> [More Complementors] -> [More Value]",
        ],
    },
    26: {
        "label": "Canonical platform structure",
        "lines": [
            "[Platform Core] -> [Boundary Resources / Rules / APIs] -> [Complementors]",
            "[Complementors] -> [Complementary Innovation / User Value]",
            "Governance balances control and generativity",
        ],
    },
    27: {
        "label": "Canonical service logic",
        "lines": [
            "[Provider Operant Resources] + [Customer Operant Resources] -> [Value Co-Creation in Use / Context]",
        ],
    },
    28: {
        "label": "Canonical exchange logic",
        "lines": [
            "[Perceived Rewards] - [Perceived Costs] + [Reciprocity / Trust] -> [Contribution / Continued Relationship]",
        ],
    },
    29: {
        "label": "Canonical sociotechnical structure",
        "lines": [
            "[Technical System] <-> [Social System] -> [Joint Optimization] -> [Work System Performance]",
        ],
    },
    30: {
        "label": "Canonical recursive structure",
        "lines": [
            "[Rules / Resources] -> [Human Action] -> [Reproduction / Change of Structure]",
            "[Reproduction / Change of Structure] -> [Rules / Resources]",
        ],
    },
    31: {
        "label": "Canonical AST structure",
        "lines": [
            "[Technology Structures: features + spirit] -> [Group Appropriation]",
            "[Group Appropriation] -> [Interaction Process / Outcomes]",
        ],
    },
    32: {
        "label": "Canonical institutional structure",
        "lines": [
            "[Coercive Pressure] -> [Isomorphism / Legitimacy-Seeking Adoption]",
            "[Mimetic Pressure] -> [Isomorphism / Legitimacy-Seeking Adoption]",
            "[Normative Pressure] -> [Isomorphism / Legitimacy-Seeking Adoption]",
        ],
    },
    33: {
        "label": "Canonical network-building process",
        "lines": [
            "[Human Actants] + [Nonhuman Actants] -> [Translation / Enrollment]",
            "[Translation / Enrollment] -> [Aligned Network] -> [Stabilization / Black Box]",
        ],
    },
    34: {
        "label": "Canonical affordance structure",
        "lines": [
            "[Artifact Features] + [User Goals / Capabilities] + [Context] -> [Affordances] -> [Affordance Actualization] -> [Outcomes]",
        ],
    },
    35: {
        "label": "Canonical bridge structure",
        "lines": [
            "[Community A] <-> [Boundary Object] <-> [Community B]",
            "Interpretive flexibility + enough shared structure for coordination",
        ],
    },
    36: {
        "label": "Canonical practice structure",
        "lines": [
            "[Human Action] <-> [Material Arrangement] -> [Practice Enactment]",
            "People and materiality are enacted together in practice",
        ],
    },
    37: {
        "label": "Canonical punctuated sequence",
        "lines": [
            "[Equilibrium] -> [Punctuation / Revolutionary Change] -> [New Equilibrium]",
        ],
    },
    38: {
        "label": "Canonical reciprocal triad",
        "lines": [
            "[Environment] <-> [Person / Cognition] <-> [Behavior]",
            "[Environment] <-> [Behavior]",
            "Self-efficacy sits at the center of the cognition side",
        ],
    },
    39: {
        "label": "Canonical motivation structure",
        "lines": [
            "[Autonomy] -> [Intrinsic Motivation]",
            "[Competence] -> [Intrinsic Motivation]",
            "[Relatedness] -> [Intrinsic Motivation]",
            "[Intrinsic Motivation] -> [Engagement / Persistence]",
        ],
    },
    40: {
        "label": "Canonical flow structure",
        "lines": [
            "[Challenge-Skill Balance] + [Focused Attention] -> [Flow] -> [Enjoyment / Deep Engagement]",
        ],
    },
    41: {
        "label": "Canonical media-choice structure",
        "lines": [
            "[User Needs / Gratifications Sought] -> [Media / Platform Choice] -> [Gratifications Obtained]",
        ],
    },
    42: {
        "label": "Canonical dual-route model",
        "lines": [
            "[High Motivation] + [High Ability] + [Argument Quality] -> [Central Route] -> [Attitude Change]",
            "[Low Motivation or Low Ability] + [Peripheral Cues] -> [Peripheral Route] -> [Attitude Change]",
        ],
    },
    43: {
        "label": "Canonical sensemaking process",
        "lines": [
            "[Ecological Change / Surprise] -> [Enactment] -> [Selection] -> [Retention]",
        ],
    },
    44: {
        "label": "Canonical decision structure",
        "lines": [
            "[Reference Point] -> [Gain / Loss Framing] -> [Loss Aversion / Value Function] -> [Choice]",
        ],
    },
    45: {
        "label": "Canonical PMT structure",
        "lines": [
            "[Severity] + [Vulnerability] -> [Threat Appraisal]",
            "[Response Efficacy] + [Self-Efficacy] - [Response Cost] -> [Coping Appraisal]",
            "[Threat Appraisal] + [Coping Appraisal] -> [Protection Motivation] -> [Protective Behavior]",
        ],
    },
    46: {
        "label": "Canonical deterrence model",
        "lines": [
            "[Sanction Certainty] + [Sanction Severity] + [Celerity] -> [Deterrence] -> [Lower Misconduct]",
        ],
    },
    47: {
        "label": "Canonical coping process",
        "lines": [
            "[IT Event / Stressor] -> [Primary Appraisal]",
            "[IT Event / Stressor] -> [Secondary Appraisal]",
            "[Primary Appraisal] + [Secondary Appraisal] -> [Problem-Focused or Emotion-Focused Coping] -> [Adaptation Outcome]",
        ],
    },
    48: {
        "label": "Canonical disclosure calculus",
        "lines": [
            "[Perceived Benefits] - [Perceived Privacy Risk] -> [Disclosure Intention / Disclosure]",
        ],
    },
    49: {
        "label": "Canonical trust formation",
        "lines": [
            "[Ability] -> [Trusting Beliefs]",
            "[Benevolence] -> [Trusting Beliefs]",
            "[Integrity] -> [Trusting Beliefs]",
            "[Structural Assurance] -> [Trusting Beliefs]",
            "[Trusting Beliefs] -> [Trusting Intention] -> [Reliance / Willingness to Be Vulnerable]",
        ],
    },
    50: {
        "label": "Canonical social-presence structure",
        "lines": [
            "[Medium Cues / Immediacy / Intimacy] -> [Perceived Social Presence]",
            "[Perceived Social Presence] -> [Warmth / Trust / Engagement]",
        ],
    },
}
