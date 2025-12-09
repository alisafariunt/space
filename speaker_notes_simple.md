# Speaker Notes - EVM for IoT Security
## ICIS 2025 Presentation (10 Minutes)

---

## Slide 1: Title (30 sec)

Good morning. I am Ali Safari from the University of North Texas.

Today I present our work on Enhancing IoT Security and Information Systems Resilience using an Extreme Value Machine approach for Open-Set Recognition.

Let me start with the problem we are facing.

---

## Slide 2: The Growing IoT Security Challenge (1 min)

We expect 27 billion IoT devices by 2025.

But the real problem is not the attacks we know. The real problem is Zero-Day attacks. These are attacks that no one has seen before.

Current intrusion detection systems work under a closed-set assumption. They can only detect attacks they were trained on.

When a new attack appears, these systems fail. They cannot say I don't know this.

This creates serious risk for organizations.

So the question is: How do we protect billions of IoT devices from attacks we have never seen before?

Let me explain the difference between closed-set and open-set recognition.

---

## Slide 3: Closed-Set vs Open-Set Recognition (1 min)

Look at the diagram on this slide. It shows the key difference.

On the left is the Closed-Set problem. The system sees an unknown attack but forces it into a known category. It says DDoS when it is something completely new.

On the right is our Open-Set solution. Each class has a boundary. If an attack falls outside all boundaries, we reject it as unknown.

Closed-Set systems assume all attack types are known. They classify everything. They cannot say I don't know. They fail silently.

Our Open-Set approach accepts that new attacks will appear. We model boundaries. We can reject unknowns.

To achieve this, we use the Extreme Value Machine.

---

## Slide 4: How EVM Works - Extreme Value Theory (1 min)

Now let me explain how EVM works.

Look at the Weibull distribution diagram on the left. The blue area represents normal distances. The red area is the rejection region.

The algorithm has four steps on the right.

First, calculate distances from a new sample to known class samples.

Second, fit a Weibull distribution to model extreme distances.

Third, compute inclusion probability for each class.

Fourth, if probability is too low for ALL classes, we reject the sample as unknown.

At the bottom you can see the flow. Network traffic comes in. EVM Core processes it with Distance Calculation, Weibull Fitting, and Probability Check. Output is either Known Attack classification or Unknown Attack detection with 99.98 percent detection rate.

Let me explain how we tested this.

---

## Slide 5: Research Methodology (45 sec)

We used two datasets.

Kitsune is our primary dataset. It has 100,000 samples, 10,000 per class. There are 9 attack types plus benign traffic. We held out Video Injection as the unknown attack.

IoT-23 is our validation dataset. It has 323,517 network flows and 20 malware scenarios. We used leave-one-scenario-out protocol.

We compared against Isolation Forest and One-Class SVM as baselines.

Here are the results.

---

## Slide 6: Results - Kitsune Dataset (1 min)

The results were clear.

EVM achieved 99.98 percent Unknown Recall.

Look at the comparison. EVM detected 99.98 percent of unknown attacks. Isolation Forest detected only 3.18 percent. One-Class SVM detected only 2.19 percent.

EVM detected 9,998 out of 10,000 unknown attack samples. Baselines detected only 2 to 3 percent.

Our precision is 32 percent. This is lower than recall. But in security, recall is more important. You can filter false alarms. But you cannot fix a missed breach.

Does this hold up on other attacks?

---

## Slide 7: Results - IoT-23 Dataset (45 sec)

Yes, it does.

We tested on 20 different malware scenarios.

Mean Unknown Recall is 89.1 percent. Mean AUROC is 0.83. Recall at 5 percent False Positive Rate is 58.2 percent.

The recall ranged from 56.4 percent minimum to 100 percent maximum.

This proves EVM is not just good at one attack. It generalizes well to different types of malware.

We confirmed this with statistical testing.

---

## Slide 8: Statistical Validation (45 sec)

We used Difference-in-Differences analysis to compare EVM against baselines across all 20 scenarios.

Against Isolation Forest, Unknown Recall improved by plus 0.436. The p-value is less than 0.001. This is highly significant.

Against One-Class SVM, Unknown Recall improved by plus 0.352. The p-value is less than 0.01. This is also significant.

EVM improvements are consistent across diverse malware families. Not just in aggregate.

What drives this performance?

---

## Slide 9: Ablation Studies (45 sec)

We performed ablation studies.

For feature selection, adding the Protocol feature improved recall from 62 percent to 96 percent. Protocol is a critical signal. More features add noise.

For tail size parameter, tail size 5 gives 82 percent recall with lower false positive rate. Tail size 10 to 20 gives 96 percent recall with higher false positive rate.

This means organizations can tune the system based on their risk tolerance.

Let me connect this to IS theory.

---

## Slide 10: Theoretical Foundation - D&M Model (45 sec)

We interpret our findings through the DeLone and McLean IS Success Model.

For System Quality, EVM achieves 89 to 99 percent unknown recall. Baselines achieve only 2 to 3 percent.

For Information Quality, precision is 32 percent. This is still 3 times better than baselines.

For Net Benefits, organizations gain resilience against heavy-tail risks.

There is a trade-off. High recall means more alerts. But in IoT security, missing an attack is more costly than investigating false positives. False positives can be filtered. Missed attacks cause severe damage.

What does this mean for practitioners?

---

## Slide 11: Practical Implications (30 sec)

For organizations, we offer a tunable solution.

High-Security Environments should use tail size 20 for maximum detection. They accept higher alert volume. Secondary verification handles flagged traffic.

Resource-Constrained Settings should use tail size 5 for lower false positive rate. This still achieves 82 percent unknown recall. It balances detection versus operational load.

At 5 percent false positive budget, EVM still recovers 58 percent of unknown threats.

There are limitations.

---

## Slide 12: Limitations and Future Work (30 sec)

Our current limitations include computational constraints that required data sampling. We focused on offline processing. Our comparison was limited to classical baselines. We used a single train test split.

Future directions include streaming EVM for real-time detection. We plan to benchmark against deep learning OSR methods. We want cross-validation for stability confirmation. And integration with existing IDS infrastructure.

Let me conclude.

---

## Slide 13: Conclusion (30 sec)

In conclusion, we demonstrate that Extreme Value Theory provides a theoretically grounded solution to open-set recognition in IoT security.

We achieved 99.98 percent recall on Kitsune. We achieved 89.1 percent mean recall on IoT-23. The results are statistically significant with p less than 0.001. The system offers tunable risk trade-off.

EVM enables organizations to detect unforeseen threats and build resilient IoT security systems.

Thank you.

---

## Slide 14: Thank You

I am happy to take any questions.

You can scan the QR code to access the full paper.

My email is alisafari@my.unt.edu

Thank you.

