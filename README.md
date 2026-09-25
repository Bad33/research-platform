<div align="center">
  <h1>🌌 Synthetica</h1>
  <p><strong>Autonomous Research Sanctuary & Semantic Knowledge Graph</strong></p>

  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Gemini-AI-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
</div>

<br />

> Synthetica is a high-performance, professional-grade research aggregation platform designed to serve as a distraction-free "reading sanctuary." It eliminates the cognitive overload of standard academic databases by autonomously fetching, interpreting, and visualizing prestige research across Artificial Intelligence, Clinical Oncology, and Quantitative Sports Analytics.

---

## ✨ Core Features

* 🧠 **The Pedagogical Engine:** Bypasses generic summarization by enforcing a strict academic breakdown. The AI autonomously extracts the core problem, technical methodology, and key metrics, generating dynamic data charts and assigning a venue-based "Impact Score" to every paper.
* 🌌 **Semantic Discovery (Galaxy Map):** A physics-based, interactive 2D/3D knowledge graph powered by vector embeddings. Papers are connected not by simple keywords, but by deep mathematical similarities (thresholds > 60%). Features raycasting focus and an in-graph extraction panel.
* 📖 **Magazine-Grade UI:** Built with Next.js 14 and Tailwind CSS, the platform organizes complex domains into horizontal scrolling carousels, maintaining a clean, premium reading experience.
* 🛡️ **Resilient Data Pipeline:** A bulletproof Node.js backfill engine with exponential backoff and auto-retry logic. It securely handles API rate limits (HTTP 429) and server spikes (HTTP 503).

## 🧰 Tech Stack

| Layer | Technology Used |
| :--- | :--- |
| **Frontend Architecture** | Next.js 14 (App Router), React, Tailwind CSS, Lucide React |
| **Data Visualization** | Recharts (Dynamic Charting), React-Force-Graph-2D |
| **Backend & Storage** | Supabase (PostgreSQL), `pgvector` (Cosine Similarity Search) |
| **AI & Machine Learning** | Google Generative AI (`gemini-3.6-flash`, `text-embedding-004`) |
| **Academic APIs** | ArXiv API (CS/AI), Europe PMC REST API (Genomics/Oncology) |

---

## 🚀 Local Installation & Setup

**1. Clone the repository**
```bash
git clone [https://github.com/yourusername/synthetica.git](https://github.com/yourusername/synthetica.git)
cd synthetica
