## Slide 1: Title (30 seconds)


این اسلاید معرفی شماست. هدف: ایجاد اعتماد و تعیین انتظارات. مخاطب باید بفهمد چه کسی هستید، از کجا آمدید، و قرار است چه چیزی بشنود. اسلاید تایتل باید حرفه‌ای و مختصر باشد. نیازی به توضیح زیاد نیست.

### 🎤 Script:
Good morning/afternoon everyone. My name is Ali Safari and I am here with my advisor Dr. Dan J. Kim from University of North Texas. Today we will present our research on enhancing IoT security using Extreme Value Machine for Open-Set Recognition.

 
معمولاً سوالی نمی‌پرسند. اگر پرسیدند "What is your research area?" بگویید: "Cybersecurity and Information Systems, specifically machine learning for intrusion detection."

---

## Slide 2: The Problem (60 seconds)

 
این اسلاید مهم‌ترین اسلاید برای جلب توجه است. باید مشکل را واضح و بزرگ نشان دهید. از نظر علمی، داریم motivation تحقیق را توضیح می‌دهیم. سه نکته کلیدی: ۱) حجم مشکل (27 میلیارد دستگاه)، ۲) نوع تهدید (حملات Zero-Day)، ۳) شدت خسارت (توزیع Heavy-Tail). این سه تا با هم نشان می‌دهند که مشکل واقعی، بزرگ و جدی است.

### 🎤 Script:
Let me start with a question. How do we protect billions of IoT devices from attacks we have never seen before?

Today in 2025, there are 27 billion IoT devices connected to the internet. Smart watches, medical devices, industrial sensors, traffic systems.

But what makes these devices vulnerable? The most dangerous attacks are zero-day attacks. These are new attacks that no one has seen before. They cause the most damage.

And when these attacks succeed, the financial impact is severe. Cyber security losses follow a heavy-tail distribution. Rare events cause very large damages.

Here is the core problem. Traditional security systems use a closed-set assumption. They can only detect attacks they already know. When a new attack appears, they fail.

 

**Q: Where did you get the 27 billion number?**
A: From Choudhary's 2024 paper "Internet of Things: Overview" in Discover IoT journal. It's a peer-reviewed academic source. Industry sources like IoT Analytics report 21.1 billion by end of 2025 and 39 billion by 2030, but we chose the academic source for our primary figure. Different numbers come from different measurement methodologies and timeframes.

**Q: What do you mean by heavy-tail distribution?**
A: It means most cyber incidents cause small losses, but a few rare incidents cause extremely large damages. Like a power law. The average doesn't represent the risk well.

**Q: Why focus on IoT specifically?**
A: IoT devices have limited computational resources, often lack security updates, and are deployed in critical infrastructure. They are more vulnerable than traditional IT systems.

---

## Slide 3: Closed-Set vs Open-Set (50 seconds)

 
این اسلاید مفهوم اصلی تحقیق را معرفی می‌کند: تفاوت بین Closed-Set و Open-Set Recognition. از نظر علمی، این یک paradigm shift است. سیستم‌های سنتی همه چیز را به یکی از کلاس‌های شناخته‌شده تخصیص می‌دهند. ولی در دنیای واقعی، کلاس‌های جدید دائماً ظاهر می‌شوند. Open-Set Recognition این محدودیت را برطرف می‌کند. این مفهوم از Computer Vision آمده (Scheirer et al., 2013) و ما آن را به امنیت سایبری آوردیم.

### 🎤 Script:
So, how can we solve this problem? Let me explain the difference between closed-set and open-set recognition.

Traditional systems assume all attack types are known during training. They classify everything into known categories. They cannot say "I don't know this." So when new attacks appear, they fail silently.

In contrast, our approach uses open-set recognition. We accept that new attacks will appear. We model the boundary of known classes. And importantly, we can reject unknown samples.

The key insight is this: we shift from "classify everything" to "recognize what I know, reject what I don't."


**Q: Is Open-Set Recognition a new concept?**
A: Not entirely new. Scheirer introduced it in 2013 for image recognition. But applying it to network intrusion detection with EVM is our contribution.

**Q: How is this different from anomaly detection?**
A: Good question. Anomaly detection just says "this is unusual." Open-Set Recognition does more: it classifies known attacks AND rejects unknowns. It's a superset of anomaly detection.

**Q: What about zero-shot learning?**
A: Zero-shot tries to recognize new classes using semantic descriptions. Open-set doesn't try to classify unknowns, it just rejects them. Different goals.

---

## Slide 4: Our Solution - EVM (50 seconds)

 
این اسلاید روش پیشنهادی را معرفی می‌کند. EVM از Extreme Value Theory استفاده می‌کند که یک شاخه از آمار است برای مدل‌سازی رویدادهای نادر. توزیع Weibull برای مدل کردن فاصله‌های extreme استفاده می‌شود. این یک روش principled است نه heuristic. یعنی پایه ریاضی قوی دارد. چهار مرحله ساده: محاسبه فاصله، فیت کردن Weibull، تخمین احتمال، تصمیم‌گیری.

### 🎤 Script:
Now, let me introduce our solution. Our solution is the Extreme Value Machine, or EVM.

Let me explain how it works in four steps.

Step one: Calculate distances from a new sample to all known class samples.

Step two: Fit a Weibull distribution to model extreme distances. This is from Extreme Value Theory.

Step three: Estimate the probability that the sample belongs to each known class.

Step four: If probability is too low for all classes, reject the sample as unknown.

Why Extreme Value Theory? Because EVT is designed for modeling rare events in the tails of distributions. This is exactly what we need for detecting unusual network traffic.

 

**Q: Why Weibull distribution specifically?**
A: EVT shows that extreme values follow one of three distributions: Gumbel, Fréchet, or Weibull. For bounded data like distances, Weibull is appropriate. It's mathematically justified.

**Q: What distance metric do you use?**
A: Cosine distance. It works well for high-dimensional data and is computationally efficient.

**Q: How do you set the rejection threshold?**
A: The EVM uses inclusion probability. If no class gives probability above threshold (typically 0.5), the sample is rejected as unknown.

**Q: Is EVM your invention?**
A: No, EVM was proposed by Rudd et al. in 2018 for image recognition. Our contribution is applying it to network intrusion detection and validating it on IoT datasets.

---

## Slide 5: EVM Architecture (40 seconds)


این اسلاید معماری سیستم را نشان می‌دهد. برای مخاطبین فنی مهم است ببینند pipeline کامل چگونه است. از ورودی (Network Traffic) تا خروجی (Alert). این دیاگرام نشان می‌دهد که روش ما قابل پیاده‌سازی در سیستم‌های واقعی است. ۵۰ فیچر استخراج می‌شود، EVM پردازش می‌کند، و سه نوع خروجی ممکن است: حمله شناخته‌شده، حمله ناشناخته، یا امتیاز اطمینان.

### 🎤 Script:
Let me show you how this works in practice. This diagram shows the system architecture.

Network traffic comes in, we extract 50 features, and preprocess the data.

Then, the EVM core calculates distances, fits Weibull distributions, estimates probabilities, and checks thresholds.

After processing, the output can be: a known attack classification, an unknown attack detection, or a confidence score.

For unknown attacks, the system generates an alert for novel threat detection. This is our main focus, and we achieve 99.98% detection rate.

 

**Q: What are the 50 features?**
A: Network flow features like packet sizes, timing statistics, port numbers, protocol flags. Standard features from Kitsune's feature extractor.

**Q: Can this run in real-time?**
A: Current implementation is offline. Real-time streaming is future work. But inference is fast, about milliseconds per sample.

**Q: What's the computational complexity?**
A: Training is O(n²) for distance computation where n is number of samples. We sampled 10k per class to make it tractable. Inference is O(nk) where k is number of classes.

---

## Slide 6: Methodology (45 seconds)

 
این اسلاید روش تحقیق را توضیح می‌دهد. برای credibility علمی بسیار مهم است. دو دیتاست استفاده کردیم: Kitsune برای آزمایش اصلی و IoT-23 برای validation و generalizability. نکته کلیدی: کلاس unknown کاملاً در زمان training حذف شده بود. این تضمین می‌کند که مدل واقعاً unknown را ندیده. Baselines ما روش‌های کلاسیک هستند: Isolation Forest و One-Class SVM.

### 🎤 Script:
Now, let me explain how we tested this. For our experiments, we used two datasets.

The primary dataset is Kitsune. It has 100,000 samples across 9 attack types plus benign traffic. We held out Video Injection attacks completely as our "unknown" class.

For validation, we used IoT-23. This has 323,000 network flows and 20 different malware scenarios. We used leave-one-scenario-out protocol.

For preprocessing, we applied variance threshold filtering, standard scaling, and selected top 50 features.

Finally, our baselines are Isolation Forest and One-Class SVM.

 

**Q: Why these specific datasets?**
A: Kitsune is widely used in IDS research. IoT-23 is more recent and has diverse malware. Using both shows robustness.

**Q: Why not use more recent deep learning baselines?**
A: Computational constraints for this study. Also, we wanted to compare against interpretable methods first. Deep learning comparison is future work.

**Q: How did you ensure no data leakage?**
A: The unknown class was completely held out during training. Not even used for validation. This is stricter than some studies.

**Q: What is leave-one-scenario-out?**
A: For IoT-23, we have 20 malware scenarios. In each experiment, we hold out one scenario completely as unknown, train on the rest, then test. We repeat 20 times and report mean.

---

## Slide 7: Kitsune Results (50 seconds)

 
این اسلاید نتایج اصلی روی Kitsune را نشان می‌دهد. عدد 99.98% خیلی چشمگیر است و باید روی آن تأکید کنید. نکته مهم: این یعنی از ۱۰,۰۰۰ حمله ناشناخته، فقط ۲ تا را از دست دادیم. در مقایسه با baselines که فقط ۲-۳٪ شناسایی کردند، تفاوت فاحش است. Precision پایین‌تر است (۳۲٪) ولی این trade-off است که در اسلاید بعدی توضیح می‌دهیم.

### 🎤 Script:
So, what did we find? Now, the results.

On the Kitsune dataset, EVM achieved 99.98% unknown recall. This means we detected 9,998 out of 10,000 unknown attack samples.

Now, look at the comparison. For unknown recall, EVM gets 0.9998. Isolation Forest gets only 0.0318. One-Class SVM gets only 0.0219.

So, baselines detected only 2 to 3 percent of unknown attacks. EVM detected almost all of them.

You may notice the precision is lower. This is a trade-off I will explain later.

 

**Q: 99.98% seems too good. Is there overfitting?**
A: Good skepticism. This is on held-out test data that the model never saw. Also, we validated on a completely different dataset (IoT-23) with similar results.

**Q: Why is precision so low at 32%?**
A: High recall means we catch almost everything unusual. Some of those are false positives. It's a trade-off. But 32% is still 3x better than baselines.

**Q: What type of attack was Video Injection?**
A: An attacker injects malicious video streams into IP cameras. It's a real IoT attack type from the Kitsune dataset.

**Q: Did you try other attack types as unknown?**
A: We focused on Video Injection for main results. But IoT-23 validation uses 20 different unknown types, showing generalization.

---

## Slide 8: IoT-23 Results (45 seconds)

 
این اسلاید generalizability را نشان می‌دهد. آیا نتایج فقط روی یک دیتاست خوب بود یا روی دیتاست‌های دیگر هم کار می‌کند؟ IoT-23 کاملاً متفاوت است: ۲۰ سناریوی مختلف malware. میانگین recall 89.1% است که همچنان عالی است. Range از 56% تا 100% نشان می‌دهد که بعضی حملات سخت‌تر هستند. AUROC 0.83 و Recall@5%FPR 58.2% برای deployment واقعی مهم است.

### 🎤 Script:
But does this work on other datasets? To test generalizability, we evaluated on IoT-23 dataset with 20 different malware scenarios.

Mean unknown recall is 89.1%. Mean AUROC is 0.83. At 5% false positive rate, we still achieve 58.2% recall.

Looking at the range, unknown recall ranges from 56.4% minimum to 100% maximum, with 89.1% mean. This shows consistent performance across diverse malware families.

Overall, the results confirm EVM generalizes well to different attack types.

 

**Q: Why did recall drop from 99.98% to 89.1%?**
A: Different dataset, different attack types. Kitsune result was for one specific attack. IoT-23 is mean across 20 diverse malware families. 89% is still excellent.

**Q: What's the minimum 56.4%? Which attack was hard?**
A: Some malware types behave more similarly to normal traffic. The 56% was for a specific scenario. But even 56% is much better than baselines.

**Q: What does Recall @ 5% FPR mean?**
A: If you only allow 5% false positive rate (operational constraint), you still catch 58% of unknown attacks. This is practical guidance for deployment.

**Q: Is AUROC of 0.83 good enough?**
A: For open-set recognition, yes. Perfect AUROC is 1.0. Random is 0.5. 0.83 indicates strong discrimination ability.

---

## Slide 9: Statistical Validation (50 seconds)

 
این اسلاید اعتبار آماری نتایج را نشان می‌دهد. برای کنفرانس سطح بالا مثل ICIS، فقط گفتن "بهتر است" کافی نیست. باید نشان دهید که تفاوت‌ها از نظر آماری معنادار هستند. از Difference-in-Differences (DiD) استفاده کردیم که یک روش قوی برای مقایسه است. p-value کمتر از 0.001 یعنی احتمال اینکه این نتایج تصادفی باشد کمتر از 0.1% است.

### 🎤 Script:
But are these improvements real, or just luck? We used Difference-in-Differences analysis to validate our results statistically.

Compared to Isolation Forest, EVM improves unknown recall by 43.6 percentage points, with p-value less than 0.001.

Compared to One-Class SVM, EVM improves unknown recall by 35.2 percentage points, with p-value less than 0.01.

All improvements are statistically significant.

What does this mean? This means EVM improvements are consistent across all 20 malware scenarios. The results are not just lucky outcomes.

 

**Q: Why Difference-in-Differences and not just t-test?**
A: DiD controls for scenario-specific effects. It's more robust than simple comparison. We also did paired t-tests which confirmed the results.

**Q: What does +0.436 mean?**
A: EVM's unknown recall is 43.6 percentage points higher than Isolation Forest on average across 20 scenarios. That's a huge practical difference.

**Q: Is n=20 scenarios enough for statistical power?**
A: It's what the dataset provides. With p<0.001, we have strong evidence. More scenarios would be better but 20 is reasonable.

**Q: Did you correct for multiple comparisons?**
A: We compared against two baselines on three metrics. With Bonferroni correction, our significance levels still hold.

---

## Slide 10: Ablation Studies (45 seconds)

 
این اسلاید تحلیل عمیق‌تر را نشان می‌دهد: چه چیزی واقعاً مهم است؟ Ablation study یعنی کامپوننت‌ها را یکی یکی حذف یا تغییر می‌دهیم و تأثیر را می‌بینیم. دو یافته کلیدی: ۱) فقط ۳ فیچر (port ها و protocol) کافی است! فیچرهای بیشتر noise اضافه می‌کنند. ۲) tail_size پارامتر قابل تنظیم است. سازمان‌ها می‌توانند بر اساس risk tolerance خود تنظیم کنند.

### 🎤 Script:
Now, what really matters in this system? We also conducted ablation studies to understand what matters most.

For feature selection: using only 2 port features gives 62% recall. Adding protocol as third feature jumps recall to 96%. However, adding more features does not help. It actually adds noise.

For tail size parameter: tail size of 10 to 20 gives best recall at 96.4%. Smaller tail size of 5 gives 82% recall but lower false positive rate.

So, this means organizations can tune the system based on their risk tolerance.

 

**Q: Why do more features hurt performance?**
A: Curse of dimensionality. With more features, distances become less meaningful. Also, some features add noise without signal.

**Q: What is tail_size exactly?**
A: It's how many extreme distances we use to fit the Weibull distribution. Smaller tail = tighter boundary = fewer false positives but might miss some attacks.

**Q: What tail_size do you recommend?**
A: Depends on the organization. High-security: use 20. Resource-constrained: use 5-10. It's a tunable parameter.

**Q: Is this feature finding generalizable?**
A: For network traffic, yes. Port and protocol are fundamental. But for other domains, you'd need to redo feature selection.

---

## Slide 11: Theoretical Framework (50 seconds)

 
این اسلاید contribution نظری تحقیق را نشان می‌دهد. برای ICIS که یک کنفرانس IS است (نه فقط فنی)، باید نشان دهید که یافته‌های شما با تئوری‌های IS مرتبط است. ما از مدل D&M استفاده کردیم که یکی از پرارجاع‌ترین مدل‌های IS است. سه بعد: System Quality (توانایی تشخیص)، Information Quality (دقت هشدارها)، Net Benefits (مقاومت در برابر حملات). نکته مهم: trade-off بین recall و precision یک انتخاب استراتژیک است، نه یک ضعف.

### 🎤 Script:
Now, how do we interpret these findings? We interpret our findings using the DeLone and McLean IS Success Model.

For System Quality, EVM achieves 89 to 99% unknown recall, compared to 2-3% for baselines. This is a huge improvement.

For Information Quality, EVM precision is 32%, compared to 8-12% for baselines. EVM is still better, but the high recall means more alerts.

Finally, Net Benefits is resilience. Preventing severe losses from unknown attacks.

The trade-off: EVM's high recall means more alerts. But in IoT security, missing an attack is more costly than investigating false positives. False positives can be filtered. Missed attacks cause severe damage.

 

**Q: Is the D&M model appropriate for security systems?**
A: Yes. D&M is general for IS success. Security systems are IS. We argue that for security, System Quality (detection) matters more than Information Quality (precision) because missed attacks cause severe damage.

**Q: You say 32% precision is "better with cost". What's the cost?**
A: More false positives means analysts spend time investigating benign traffic. But 32% is still 3x better than baselines (8-12%). And you can filter false positives; you can't recover missed attacks.

**Q: How does this relate to Net Benefits?**
A: Better detection of unknown attacks = fewer successful breaches = organizational resilience. Heavy-tail losses are mitigated.

**Q: Is "resilience" a proper IS construct?**
A: Yes, increasingly studied in IS literature, especially after COVID. Organizational ability to withstand and recover from disruptions.

---

## Slide 12: Practical Implications (40 seconds)

 
این اسلاید کاربرد عملی نتایج را نشان می‌دهد. برای practitioners مهم است بدانند چطور از این تحقیق استفاده کنند. دو حالت: ۱) محیط‌های امنیتی بالا (بیمارستان، زیرساخت): tail_size=20، هشدارهای بیشتر را قبول کنید. ۲) محیط‌های با منابع محدود: tail_size=5، تعادل بین تشخیص و بار عملیاتی. نکته کلیدی: حتی با محدودیت ۵٪ false positive، همچنان ۵۸٪ از حملات ناشناخته را می‌گیرید.

### 🎤 Script:
So, what does this mean for organizations?

For high-security environments like hospitals or critical infrastructure: use tail size 20 for maximum detection. Accept higher alert volume. Use secondary verification.

For resource-constrained settings: use tail size 5 for lower false positive rate. You still get 82% unknown recall.

Even better, at 5% false positive budget, EVM still recovers 58% of unknown threats. This provides concrete guidance for deployment.

 

**Q: How would you implement this in practice?**
A: Integrate with existing SIEM/IDS. EVM runs as additional layer. When it flags unknown, trigger secondary analysis.

**Q: What about computational resources?**
A: EVM training is fast (2 seconds). Inference is milliseconds. Can run on standard hardware.

**Q: How do you handle the false positives?**
A: Tiered response. High-confidence unknowns get immediate attention. Lower confidence goes to queue. Over time, confirmed attacks update training.

**Q: Is there a recommended deployment architecture?**
A: Edge preprocessing for feature extraction. Central EVM for classification. Alerts to SOC for triage.

---

## Slide 13: Limitations (35 seconds)

 
این اسلاید صداقت علمی را نشان می‌دهد. هر تحقیقی محدودیت دارد و باید آن را بیان کنید. این نشان‌دهنده بلوغ علمی است. محدودیت‌های ما: ۱) محدودیت محاسباتی باعث شد data sampling کنیم. ۲) پردازش offline است نه real-time. ۳) فقط با baselines کلاسیک مقایسه کردیم نه deep learning. کارهای آینده این محدودیت‌ها را برطرف می‌کند.

### 🎤 Script:
Of course, our work has limitations. Let me acknowledge limitations.

Current limitations include: computational constraints required data sampling, focus on offline processing, comparison limited to classical baselines.

For future work, we plan: streaming EVM for real-time detection, comparison with deep learning methods, and integration with existing IDS infrastructure.

 

**Q: Why didn't you compare with deep learning methods?**
A: Computational budget. Deep learning OSR methods like OpenMax require significant GPU resources. It's planned for future work.

**Q: Is offline processing a major limitation?**
A: For research validation, no. For production deployment, yes. But our inference time is fast, so streaming EVM is feasible.

**Q: Why only one train/test split?**
A: We used leave-one-scenario-out for IoT-23 which is effectively 20-fold. For Kitsune, single split but reproducible with fixed seed.

---

## Slide 14: Conclusion (45 seconds)

 
این اسلاید جمع‌بندی و take-home message است. مخاطب باید با ۳-۴ نکته کلیدی از جلسه بیرون برود: ۱) EVT یک راه‌حل اصولی برای Open-Set Recognition است. ۲) نتایج عالی: 99.98% و 89.1% recall. ۳) از نظر آماری معنادار (p<0.001). ۴) قابل تنظیم برای نیازهای مختلف. پیام نهایی: EVM به سازمان‌ها کمک می‌کند تهدیدات پیش‌بینی‌نشده را شناسایی کنند.

### 🎤 Script:
To conclude.

Our key contribution: we demonstrate how Extreme Value Theory provides a theoretically grounded solution to open-set recognition in IoT security.

We achieved 99.98% recall on Kitsune, 89.1% mean recall on IoT-23, with statistical significance p less than 0.001. And the system is tunable based on organizational risk tolerance.

In summary, EVM enables organizations to detect unforeseen threats and build resilient IoT security systems.

 
معمولاً سوالات در این اسلاید کم است چون خلاصه است. اگر سوالی باشد احتمالاً از اسلایدهای قبلی است.

---

## Slide 15: Thank You (15 seconds)

 
پایان ارائه. تشکر کنید و آماده سوالات باشید. QR code برای دسترسی به مقاله است. ایمیل خود را هم بدهید برای تماس‌های آینده.

### 🎤 Script:
Thank you for your attention. I am happy to answer any questions.

You can scan this QR code to access our paper.

 
اینجا Q&A شروع می‌شود. سوالات می‌توانند از هر اسلایدی باشند.

---

# Timing Summary

| Slide | Topic | Time |
|-------|-------|------|
| 1 | Title | 0:30 |
| 2 | The Problem | 1:00 |
| 3 | Closed vs Open Set | 0:50 |
| 4 | EVM Solution | 0:50 |
| 5 | EVM Architecture | 0:40 |
| 6 | Methodology | 0:45 |
| 7 | Kitsune Results | 0:50 |
| 8 | IoT-23 Results | 0:45 |
| 9 | Statistical Validation | 0:50 |
| 10 | Ablation Studies | 0:45 |
| 11 | Theoretical Framework | 0:50 |
| 12 | Practical Implications | 0:40 |
| 13 | Limitations | 0:35 |
| 14 | Conclusion | 0:45 |
| 15 | Thank You | 0:15 |
| **Total** | | **10:00** |

---

# Tips for Delivery

1. Speak slowly and clearly. Target 100 words per minute.

2. Pause briefly after each main point.

3. Advance animations naturally as you speak.

5. If running short on time, you can skip Slide 13 (Limitations) - the audience can ask about it in Q&A.

6. If you have extra time, expand on the trade-off discussion in Slide 11.

7. Keep water nearby. Speaking for 10 minutes is tiring.

---

# سوالات سخت احتمالی و پاسخ‌ها

### سوالات درباره روش

**Q: How is EVM different from just using threshold on softmax probabilities?**
A: Softmax forces probabilities to sum to 1, which creates overconfident predictions for unknowns. EVM uses EVT to model the actual probability of belonging to a class, which naturally handles rejection.

**Q: What if the unknown attack is very similar to a known class?**
A: EVM might misclassify it as that known class. This is a limitation of all open-set methods. But EVM is still much better than closed-set methods which would definitely misclassify.

**Q: Did you tune hyperparameters? Could results be due to overfitting?**
A: Minimal tuning. We used default EVM parameters from original paper. Tail size was explored in ablation but we report all values, not just best.

### سوالات درباره دیتا

**Q: Is 100k samples enough?**
A: For our methodology, yes. We're not training deep neural networks. EVM works well with smaller datasets, which is actually an advantage for IoT.

**Q: How representative are these datasets of real-world attacks?**
A: Kitsune and IoT-23 are from real network captures. But lab conditions differ from production. Field validation is future work.

### سوالات تئوری

**Q: Why D&M model and not Technology Acceptance Model (TAM)?**
A: D&M is about IS success/effectiveness. TAM is about user adoption. For security systems that are often mandatory, success metrics are more relevant than adoption.

**Q: What's your specific theoretical contribution?**
A: We bridge EVT from statistics to IS through D&M. We show how statistical properties (Weibull bounds) translate to IS success dimensions.

### سوالات عملی

**Q: What's the false positive rate in production?**
A: Depends on tail_size setting. At tail_size=10, about 50% FPR. At tail_size=5, about 17%. Organizations choose based on their capacity.

**Q: How much does this cost to deploy?**
A: Minimal. EVM is CPU-based, no GPU needed. Training takes seconds. Can run on existing security infrastructure.
