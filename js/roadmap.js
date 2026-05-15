const MONTHS = [
  {
    id: 1, title: "Coding Foundations for IS", gradient: "var(--gradient-1)", accent: "var(--accent-1)",
    subtitle: "Fill the gaps — you likely have SQL and data skills already",
    topics: [
      { id: "1-1", title: "Python (Review or Learn)", focus: "If you already code in Python, skim and move on. If not, this is your #1 priority.",
        resources: [
          { name: "CS50P: Harvard (rigorous, with projects)", url: "https://cs50.harvard.edu/python/", tags: ["free"] },
          { name: "Python for Everybody (Coursera)", url: "https://www.coursera.org/specializations/python", tags: ["free"] }
        ],
        practice: "Build a script that reads a CSV of survey responses, cleans the data, and outputs summary statistics as JSON."
      },
      { id: "1-2", title: "Git & GitHub", focus: "Version control for every project. Essential for collaboration and portfolio.",
        resources: [
          { name: "GitHub Skills (interactive)", url: "https://skills.github.com/", tags: ["free","interactive"] },
          { name: "Learn Git Branching", url: "https://learngitbranching.js.org/", tags: ["free","interactive"] }
        ],
        practice: "Put every project in a GitHub repo from now on."
      },
      { id: "1-3", title: "APIs, HTTP & JSON", focus: "GET/POST requests, status codes, API keys, async/await. Foundation for LLM API calls.",
        resources: [
          { name: "HTTP Basics — MDN Web Docs", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview", tags: ["official"] },
          { name: "Python requests library", url: "https://requests.readthedocs.io/en/latest/", tags: ["official"] }
        ],
        practice: "Script that calls a public API (e.g., Open-Meteo weather) and returns formatted JSON."
      },
      { id: "1-4", title: "SQL & Pandas (Review)", focus: "You likely know this. Review SELECT, JOIN, GROUP BY. Pandas: filtering, aggregations.",
        resources: [
          { name: "SQLBolt (fast review)", url: "https://sqlbolt.com/", tags: ["free","interactive"] },
          { name: "Kaggle Pandas Course", url: "https://www.kaggle.com/learn/pandas", tags: ["free"] }
        ]
      },
      { id: "1-5", title: "FastAPI", focus: "Build REST APIs in Python. You will use this to serve your AI apps.",
        resources: [
          { name: "FastAPI Official Tutorial", url: "https://fastapi.tiangolo.com/tutorial/", tags: ["official"] }
        ],
        practice: "Build a FastAPI app that accepts a research question via POST and returns mock structured results."
      }
    ],
    milestones: ["Write Python that reads files, calls APIs, handles errors", "Git + GitHub workflow", "Make HTTP requests in Python", "Build and run a FastAPI app locally"]
  },
  {
    id: 2, title: "LLM APIs & Prompt Engineering", gradient: "var(--gradient-2)", accent: "var(--accent-3)",
    subtitle: "Build AI apps with OpenAI & Anthropic — IS use cases",
    topics: [
      { id: "2-1", title: "Prompting Fundamentals", focus: "System vs user messages, chain-of-thought, few-shot. The core skill of AI engineering.",
        resources: [
          { name: "Anthropic Interactive Prompt Tutorial", url: "https://github.com/anthropics/prompt-eng-interactive-tutorial", tags: ["free","interactive"] },
          { name: "OpenAI Prompt Engineering Guide", url: "https://platform.openai.com/docs/guides/prompt-engineering", tags: ["official"] }
        ],
        practice: "Write prompts that classify organizational emails into categories (support, sales, internal) with consistent accuracy."
      },
      { id: "2-2", title: "Structured Outputs", focus: "Get structured JSON from LLMs using Pydantic. Critical for real applications.",
        resources: [
          { name: "OpenAI Structured Outputs Guide", url: "https://platform.openai.com/docs/guides/structured-outputs", tags: ["official"] },
          { name: "Instructor Library", url: "https://python.useinstructor.com/", tags: ["free"] }
        ],
        practice: "Build a parser that extracts structured data from IS research abstracts (title, RQs, method, findings)."
      },
      { id: "2-3", title: "Function / Tool Calling", focus: "Let LLMs call your Python functions. The bridge between text and action.",
        resources: [
          { name: "OpenAI Function Calling Guide", url: "https://platform.openai.com/docs/guides/function-calling", tags: ["official"] },
          { name: "Anthropic Tool Use Docs", url: "https://docs.anthropic.com/en/docs/build-with-claude/tool-use", tags: ["official"] }
        ],
        practice: "Assistant with tools: search_papers(query), get_citation_count(doi), summarize_abstract(text)."
      },
      { id: "2-4", title: "Streaming & Conversation State", focus: "Real-time output + managing multi-turn conversations with context windows.",
        resources: [
          { name: "OpenAI Streaming Docs", url: "https://platform.openai.com/docs/api-reference/streaming", tags: ["official"] },
          { name: "OpenAI: Managing Conversations", url: "https://platform.openai.com/docs/guides/conversation-state", tags: ["official"] }
        ]
      },
      { id: "2-5", title: "Cost, Tokens & Error Handling", focus: "Token pricing, rate limits, retries, fallback strategies. Budget-aware AI.",
        resources: [
          { name: "OpenAI Tokenizer Tool", url: "https://platform.openai.com/tokenizer", tags: ["free","interactive"] },
          { name: "Tenacity (retry library)", url: "https://tenacity.readthedocs.io/", tags: ["free"] }
        ]
      },
      { id: "2-6", title: "Prompt Injection & Security", focus: "The #1 security risk in LLM apps. Know it before you ship anything.",
        resources: [
          { name: "OWASP Top 10: Prompt Injection", url: "https://genai.owasp.org/llmrisk/llm01-prompt-injection/", tags: ["free"] }
        ]
      }
    ],
    milestones: ["Reliable prompts for IS tasks", "Structured data extraction from text", "Tool calling wired up", "Streaming responses", "Cost estimation & error handling"]
  },
  {
    id: 3, title: "RAG & Knowledge Management", gradient: "var(--gradient-3)", accent: "var(--accent-4)",
    subtitle: "Let LLMs answer from organizational documents & research papers",
    topics: [
      { id: "3-1", title: "Embeddings & Similarity Search", focus: "Text → vectors → semantic search. The foundation of RAG.",
        resources: [
          { name: "Stack Overflow: Intuitive Intro to Embeddings", url: "https://stackoverflow.blog/2023/11/09/an-intuitive-introduction-to-text-embeddings/", tags: ["free"] },
          { name: "OpenAI Embeddings Guide", url: "https://platform.openai.com/docs/guides/embeddings", tags: ["official"] }
        ],
        practice: "Embed 30 IS paper abstracts. Build semantic search that finds the most relevant papers for a query."
      },
      { id: "3-2", title: "Chunking Strategies", focus: "Break documents into retrievable pieces. Chunk size, overlap, semantic boundaries.",
        resources: [
          { name: "Weaviate: Chunking Strategies for RAG", url: "https://weaviate.io/blog/chunking-strategies-for-rag", tags: ["free"] },
          { name: "LangChain Text Splitters", url: "https://python.langchain.com/docs/concepts/text_splitters/", tags: ["official"] }
        ]
      },
      { id: "3-3", title: "Vector Databases", focus: "Store and query embeddings. Chroma for prototyping, Qdrant/pgvector for production.",
        resources: [
          { name: "Chroma Docs (start here)", url: "https://docs.trychroma.com/", tags: ["free"] },
          { name: "Pinecone Learning Center", url: "https://www.pinecone.io/learn/", tags: ["free"] }
        ],
        practice: "Index a collection of IS papers into Chroma with metadata (year, journal, method type). Query with filters."
      },
      { id: "3-4", title: "Reranking & Retrieval Quality", focus: "Two-stage retrieve-then-rerank. Debug semantic drift, chunk boundary issues.",
        resources: [
          { name: "Cohere Reranking Docs", url: "https://docs.cohere.com/docs/reranking-with-cohere", tags: ["official"] },
          { name: "Pinecone: Improving Retrieval Quality", url: "https://www.pinecone.io/learn/retrieval-augmented-generation/#retrieval-quality", tags: ["free"] }
        ]
      },
      { id: "3-5", title: "Citations, Grounding & Hallucination", focus: "Answer only from context. Always cite sources. Say 'I don't know' when unsure.",
        resources: [
          { name: "Anthropic: Giving Claude Sources", url: "https://docs.anthropic.com/en/docs/build-with-claude/citations", tags: ["official"] },
          { name: "Zep: Reducing LLM Hallucinations", url: "https://www.getzep.com/ai-agents/reducing-llm-hallucinations/", tags: ["free"] }
        ]
      },
      { id: "3-6", title: "RAG Frameworks", focus: "LlamaIndex (search-first) or LangChain (orchestration-first). Pick one and go deep.",
        resources: [
          { name: "LlamaIndex Starter Tutorial", url: "https://developers.llamaindex.ai/python/framework/getting_started/starter_example/", tags: ["official"] },
          { name: "LangChain: Build a RAG Agent", url: "https://docs.langchain.com/oss/python/langchain/rag", tags: ["official"] }
        ],
        practice: "Build 'Chat with IS Papers' — ingest 20 PDFs from your reading list, retrieve cited answers via FastAPI."
      }
    ],
    milestones: ["Semantic search over research papers", "Intelligent chunking", "Vector DB with metadata filtering", "Reranking for quality", "Grounded, cited answers from documents"]
  },
  {
    id: 4, title: "AI Agents, Trust & Governance", gradient: "var(--gradient-4)", accent: "var(--accent-5)",
    subtitle: "Where IS research meets AI engineering — delegation, trust, human-in-the-loop",
    topics: [
      { id: "4-1", title: "Agent Loops & Architecture", focus: "Perceive → plan → act → observe. Agents are while-loops with LLM branching.",
        resources: [
          { name: "Anthropic: Building Effective Agents", url: "https://www.anthropic.com/research/building-effective-agents", tags: ["official"] },
          { name: "OpenAI: Practical Guide to Agents (PDF)", url: "https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf", tags: ["official"] }
        ],
        practice: "Build an agent from scratch (no framework) with 3 tools. Understand what frameworks abstract."
      },
      { id: "4-2", title: "Human-in-the-Loop & Delegation", focus: "When should an agent act autonomously vs ask for approval? IS perspective on delegation rights.",
        resources: [
          { name: "LangGraph: Human-in-the-Loop", url: "https://langchain-ai.github.io/langgraph/how-tos/human_in_the_loop/", tags: ["official"] },
          { name: "Anthropic: Agents — when to use", url: "https://www.anthropic.com/research/building-effective-agents", tags: ["official"] }
        ],
        practice: "Build an agent where different actions require different trust levels: auto-execute (low risk) vs human approval (high risk)."
      },
      { id: "4-3", title: "Trust Calibration in AI Systems", focus: "Your research area. How do users calibrate trust? Over-trust vs under-trust. Transparency mechanisms.",
        resources: [
          { name: "Google: People + AI Guidebook", url: "https://pair.withgoogle.com/guidebook/", tags: ["free"] },
          { name: "OWASP: LLM Top 10 (Overreliance)", url: "https://genai.owasp.org/llmrisk/llm09-overreliance/", tags: ["free"] }
        ]
      },
      { id: "4-4", title: "AI Governance Frameworks", focus: "Organizational policies for AI use. Audit trails, accountability, compliance. The IS governance lens.",
        resources: [
          { name: "NIST AI Risk Management Framework", url: "https://airc.nist.gov/AI_RMF_Interactivity/Govern", tags: ["official"] },
          { name: "EU AI Act — Summary", url: "https://artificialintelligenceact.eu/", tags: ["free"] }
        ]
      },
      { id: "4-5", title: "Multi-Step Workflows", focus: "Chaining, routing, parallelization. When NOT to use agents — simpler is better.",
        resources: [
          { name: "Anthropic: Workflow Patterns", url: "https://www.anthropic.com/research/building-effective-agents#workflow-patterns", tags: ["official"] },
          { name: "LangGraph: Multi-Agent Networks", url: "https://langchain-ai.github.io/langgraph/concepts/multi_agent/", tags: ["official"] }
        ],
        practice: "Content pipeline: extract key findings from paper → generate summary + tweet + critique in parallel → rank outputs."
      },
      { id: "4-6", title: "Evaluation & Metrics", focus: "Golden test sets, LLM-as-judge, process vs outcome metrics. Evals are not optional.",
        resources: [
          { name: "DeepEval", url: "https://deepeval.com/docs/getting-started", tags: ["free"] },
          { name: "Ragas (RAG evaluation)", url: "https://docs.ragas.io/", tags: ["free"] }
        ],
        practice: "Eval harness for your RAG pipeline — 30 Q&A pairs from your papers, scored for relevance and faithfulness."
      }
    ],
    milestones: ["Build an agent from scratch", "Human-in-the-loop with trust levels", "Understand AI governance frameworks", "Agent vs workflow decision-making", "Automated evaluation pipeline"]
  },
  {
    id: 5, title: "Deployment & Organizational AI", gradient: "var(--gradient-5)", accent: "var(--accent-6)",
    subtitle: "Ship production-ready AI — and understand how organizations adopt it",
    topics: [
      { id: "5-1", title: "Docker & Production Deployment", focus: "Containerize your app. Docker Compose for multi-service setups.",
        resources: [
          { name: "Docker Getting Started", url: "https://docs.docker.com/get-started/", tags: ["official"] },
          { name: "FastAPI Deployment Docs", url: "https://fastapi.tiangolo.com/deployment/", tags: ["official"] }
        ],
        practice: "Containerize your RAG app: docker-compose with FastAPI + Chroma + Redis."
      },
      { id: "5-2", title: "Auth, Security & Rate Limiting", focus: "JWT tokens, API keys, per-user rate limits. Protect your endpoints and your budget.",
        resources: [
          { name: "FastAPI Security Docs", url: "https://fastapi.tiangolo.com/tutorial/security/", tags: ["official"] },
          { name: "OWASP API Security Top 10", url: "https://owasp.org/API-Security/", tags: ["free"] }
        ]
      },
      { id: "5-3", title: "Observability & LLM Tracing", focus: "Trace every LLM call. Structured logging. Cost dashboards.",
        resources: [
          { name: "Langfuse (open source LLM observability)", url: "https://langfuse.com/docs/observability/overview", tags: ["free"] },
          { name: "Python Structlog", url: "https://www.structlog.org/", tags: ["free"] }
        ]
      },
      { id: "5-4", title: "Cost Control & Caching", focus: "Spending limits, cheaper models for simple tasks, Redis caching, semantic caching.",
        resources: [
          { name: "LiteLLM (unified LLM interface + budget)", url: "https://github.com/BerriAI/litellm", tags: ["free"] },
          { name: "GPTCache (semantic caching)", url: "https://github.com/zilliztech/GPTCache", tags: ["free"] }
        ]
      },
      { id: "5-5", title: "Organizational AI Adoption", focus: "IS perspective: why 99% of companies aren't AI-mature. Change management, stakeholder buy-in.",
        resources: [
          { name: "McKinsey: State of AI 2025", url: "https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai", tags: ["free"] },
          { name: "Harvard Business Review: AI Adoption", url: "https://hbr.org/topic/subject/ai-and-machine-learning", tags: ["free"] }
        ]
      },
      { id: "5-6", title: "AI Ethics & Responsible Deployment", focus: "Bias, fairness, transparency, explainability. IS research on responsible AI.",
        resources: [
          { name: "Google Responsible AI Practices", url: "https://ai.google/responsibility/responsible-ai-practices/", tags: ["free"] },
          { name: "Microsoft Responsible AI", url: "https://www.microsoft.com/en-us/ai/responsible-ai", tags: ["official"] }
        ]
      }
    ],
    milestones: ["Deploy AI app in Docker", "Auth & rate limits working", "LLM call tracing set up", "Cost monitoring active", "Understand organizational AI adoption challenges"]
  },
  {
    id: 6, title: "IS-Specific AI Applications", gradient: "var(--gradient-6)", accent: "#ec4899",
    subtitle: "Apply everything to IS research and practice — choose your path",
    topics: [
      { id: "6-1", title: "Direction 1: AI for IS Research", focus: "Use AI to accelerate your own research. Literature review, coding, analysis assistance.",
        resources: [
          { name: "Semantic Scholar API", url: "https://api.semanticscholar.org/", tags: ["free"] },
          { name: "LlamaIndex: Research Assistant Tutorial", url: "https://developers.llamaindex.ai/python/framework/getting_started/starter_example/", tags: ["official"] }
        ],
        practice: "Build a RAG system over your SLR papers that answers research questions with cited evidence from your corpus."
      },
      { id: "6-2", title: "Direction 2: Design Science for AI Artifacts", focus: "Use DSR methodology to design, build, and evaluate AI artifacts. Publishable contributions.",
        resources: [
          { name: "Hevner et al. (2004): Design Science in IS", url: "https://doi.org/10.2307/25148625", tags: ["official"] },
          { name: "Peffers et al. (2007): DSRM Process Model", url: "https://doi.org/10.24251/HICSS.2007.493", tags: ["official"] }
        ],
        practice: "Design an AI artifact (e.g., trust-calibrated agent interface), build it, and create an evaluation plan."
      },
      { id: "6-3", title: "Direction 3: Business Process Automation", focus: "Automate real organizational workflows with AI. CRM, docs, email, support.",
        resources: [
          { name: "n8n (open source workflow automation)", url: "https://docs.n8n.io/", tags: ["free"] },
          { name: "LangGraph: Multi-Agent Workflows", url: "https://langchain-ai.github.io/langgraph/concepts/multi_agent/", tags: ["official"] }
        ],
        practice: "Build a lead qualification pipeline: import → AI research → score → draft outreach → log to spreadsheet."
      },
      { id: "6-4", title: "Portfolio & Career Positioning", focus: "Position yourself as IS + AI. Share projects, write about what you build, be visible.",
        resources: [
          { name: "Vercel AI SDK (deploy AI UIs)", url: "https://sdk.vercel.ai/docs", tags: ["free"] },
          { name: "Streamlit (quick AI demos)", url: "https://docs.streamlit.io/", tags: ["free"] }
        ],
        practice: "Deploy 2-3 projects publicly. Write about your IS + AI perspective on LinkedIn/X."
      }
    ],
    milestones: ["Choose a specialization direction", "Build 2-3 IS-specific AI projects", "Deploy and showcase publicly", "Start applying / freelancing / publishing"]
  }
];

// State
let state = JSON.parse(localStorage.getItem('ai-roadmap-is-state') || '{}');

function save() { localStorage.setItem('ai-roadmap-is-state', JSON.stringify(state)); }

function isTopicDone(id) { return !!state[id]; }
function toggleTopic(id) { state[id] = !state[id]; save(); render(); }

function getMonthProgress(month) {
  const total = month.topics.length;
  const done = month.topics.filter(t => isTopicDone(t.id)).length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

function getOverallProgress() {
  let done = 0, total = 0;
  MONTHS.forEach(m => { const p = getMonthProgress(m); done += p.done; total += p.total; });
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

function toggleMonth(id) {
  const el = document.getElementById(`month-${id}`);
  el.classList.toggle('open');
}

function toggleTopicBody(id) {
  const el = document.getElementById(`topic-${id}`);
  el.classList.toggle('expanded');
}

function renderTag(tag) {
  const cls = { free: 'tag-free', official: 'tag-official', interactive: 'tag-interactive', video: 'tag-video' };
  return `<span class="tag ${cls[tag] || ''}">${tag}</span>`;
}

function renderTopic(t) {
  const done = isTopicDone(t.id);
  return `
    <div class="topic" id="topic-${t.id}">
      <div class="topic-header" onclick="toggleTopicBody('${t.id}')">
        <div class="topic-check ${done ? 'checked' : ''}" onclick="event.stopPropagation(); toggleTopic('${t.id}')"></div>
        <span class="topic-title ${done ? 'done' : ''}">${t.title}</span>
        <span class="topic-toggle">▼</span>
      </div>
      <div class="topic-body">
        <div class="topic-content">
          <p><strong>Focus:</strong> ${t.focus}</p>
          <ul class="resource-list">
            ${t.resources.map(r => `
              <li>
                <a href="${r.url}" target="_blank" rel="noopener">${r.name}</a>
                ${r.tags.map(renderTag).join('')}
              </li>
            `).join('')}
          </ul>
          ${t.practice ? `<div class="practice-box"><div class="label">🛠 Practice Project</div><p>${t.practice}</p></div>` : ''}
        </div>
      </div>
    </div>`;
}

function renderMonth(m) {
  const p = getMonthProgress(m);
  return `
    <div class="month-card" id="month-${m.id}">
      <div class="month-header" onclick="toggleMonth(${m.id})">
        <div class="month-badge" style="background: ${m.gradient}">M${m.id}</div>
        <div class="month-info">
          <h2>${m.title}</h2>
          <div class="subtitle">${m.subtitle}</div>
        </div>
        <div class="month-progress-mini">
          <div class="bar"><div class="fill" style="width: ${p.pct}%; background: ${m.gradient}"></div></div>
          <span class="pct" style="color: ${m.accent}">${p.pct}%</span>
        </div>
        <span class="chevron">▼</span>
      </div>
      <div class="month-body">
        <div class="month-content">
          ${m.topics.map(t => renderTopic(t)).join('')}
          <div class="milestone-box">
            <h3>✅ Month ${m.id} Milestone</h3>
            <ul>${m.milestones.map(ms => `<li>${ms}</li>`).join('')}</ul>
          </div>
        </div>
      </div>
    </div>`;
}

function render() {
  const op = getOverallProgress();
  document.getElementById('progress-fill').style.width = op.pct + '%';
  document.getElementById('progress-pct').textContent = op.pct + '%';
  document.getElementById('progress-count').textContent = `${op.done} / ${op.total} topics`;
  document.getElementById('stat-topics').textContent = op.total;
  document.getElementById('stat-done').textContent = op.done;
  document.getElementById('stat-resources').textContent = MONTHS.reduce((a, m) => a + m.topics.reduce((b, t) => b + t.resources.length, 0), 0);

  const openMonths = new Set();
  const openTopics = new Set();
  document.querySelectorAll('.month-card.open').forEach(el => openMonths.add(el.id));
  document.querySelectorAll('.topic.expanded').forEach(el => openTopics.add(el.id));

  document.getElementById('months-container').innerHTML = MONTHS.map(renderMonth).join('');

  openMonths.forEach(id => { const el = document.getElementById(id); if (el) el.classList.add('open'); });
  openTopics.forEach(id => { const el = document.getElementById(id); if (el) el.classList.add('expanded'); });
}

function resetProgress() {
  if (confirm('Reset all progress? This cannot be undone.')) {
    state = {};
    save();
    render();
  }
}

document.addEventListener('DOMContentLoaded', render);
