# Ali Safari's PhD Study Platform 🎓

A comprehensive, interactive study guide platform designed for PhD students in Information Systems. This project hosts course materials, study aids, and research resources for **BUSI 6480** (Experimental Design) and **BCIS 6670** (IS Research).

## 🚀 Live Demo
[https://alisafari.space](https://alisafari.space)

---

## 🌟 Key Features

This platform is more than just static HTML. It includes a suite of custom-built tools to enhance the reading and studying experience:

### 🧠 Smart Study Tools
- **Deep Reading Aids:**
  - **Highlighter:** Select text and highlight in 3 distinct colors (Yellow/Green/Red) to categorize importance.
  - **Sticky Notes:** Add context-aware notes to any part of the text.
  - **Text-to-Speech (TTS):** Listen to course materials with adjustable speed (0.5x - 2x), voice selection, and auto-scroll.
- **Active Recall:**
  - **Flashcards:** Built-in flashcard system for reviewing key concepts.
  - **Progress Tracking:** Automatically tracks reading progress per page.
- **Synchronization:**
  - **Cloud Sync:** All highlights, notes, and progress are synced to the cloud (Turso Database).
  - **Cross-Device:** Start reading on your laptop, continue on your phone.
  - **Auth:** Simple Username + Password authentication to keep your data private.

### 📱 PWA & Offline Support
- **Installable:** Functions as a native app on iOS and Android.
- **Offline Mode:** Unobtrusive Service Worker caches content for offline access.

---

## 🛠️ Technology Stack

Built with a focus on performance, simplicity, and longevity (no heavy frameworks for the frontend).

- **Frontend:** Vanilla HTML5, CSS3, JavaScript (ES6+).
- **Backend:** Node.js (Vercel Serverless Functions).
- **Database:** [Turso](https://turso.tech) (Edge-hosted SQLite).
- **Deployment:** Vercel.

---

## 📂 Project Structure

Verified and centralized architecture to support multiple courses easily.

```bash
/
├── api/                  # Vercel Serverless Functions (Backend)
│   └── sync.js           # Main API for Auth, Sync, and Data Persistence
├── js/                   # Shared Core Libraries (Centralized)
│   ├── sync.js           # Auth & Cloud Sync Logic
│   ├── tts.js            # Text-to-Speech Engine
│   ├── highlights.js     # Highlighting & Notes Logic
│   ├── progress.js       # Scroll Progress Tracker
│   └── ...
├── courses/              # Courses Landing Page (/courses/)
├── conferences/          # Conference Presentations
├── 6480/                 # Course: Experimental Design & Analysis
├── 6670/                 # Course: Intro to IS Research
│   └── sw.js             # Service Worker (PWA support)
├── icis2025/             # ICIS 2025 Conference Materials
├── css/                  # Global Styles (Portfolio Theme)
├── index.html            # Main Portfolio Landing Page
├── package.json          # Node.js Dependencies
├── vercel.json           # Vercel Deployment Configuration
└── README.md             # Project Documentation
```

---

## 🔐 Authentication & Security

- **User System:** Custom-built user system storing data in SQLite.
- **Password Protection:** Accounts are protected via password (stored in DB). *Note: For production use, consider implementing password hashing.*
- **Lazy Migration:** The database schema automatically updates itself (e.g., adding password columns) upon the first API request, ensuring zero-downtime deployments.

---

## 🚀 How to Add a New Course

1.  **Create Directory:** Create a folder (e.g., `7770`).
2.  **Add Content:** Add standard HTML files.
3.  **Link Scripts:** Point to the shared library in `../js/`:
    ```html
    <script src="../js/sync.js"></script>
    <script src="../js/highlights.js"></script>
    <script src="../js/tts.js"></script>
    <script src="../js/progress.js"></script>
    ```
    *The system automatically detects the course ID from the URL and segments data accordingly.*

---

## ✍️ Author

**Ali Safari**
PhD Student in Information Systems
University of North Texas
