Synthetica: Autonomous Research Sanctuary & Semantic Knowledge Graph
Synthetica is a high-performance, professional-grade research aggregation platform designed to serve as a distraction-free "reading sanctuary." It eliminates the cognitive overload of standard academic databases by autonomously fetching, interpreting, and visualizing prestige research across Artificial Intelligence, Clinical Oncology, and Quantitative Sports Analytics.

By leveraging Google's Gemini 3.6-flash model and text-embedding-004, Synthetica transforms dense academic PDFs into highly structured, pedagogical deep-dives and maps them in an interactive, 3D semantic knowledge graph.

🚀 Core Features
The Pedagogical Engine: Bypasses generic summarization by enforcing a strict academic breakdown. The AI autonomously extracts the core problem, technical methodology, and key metrics, generating dynamic data charts and assigning a venue-based "Impact Score" to every paper.

Semantic Discovery (Galaxy Map): A physics-based, interactive 2D/3D knowledge graph powered by vector embeddings. Papers are connected not by simple keywords, but by deep mathematical similarities (thresholds > 60%). Features raycasting focus and an in-graph extraction panel for seamless exploration.

Magazine-Grade UI: Built with Next.js 14 and Tailwind CSS, the platform organizes complex domains into horizontal scrolling carousels, maintaining a clean, premium reading experience.

Resilient Data Pipeline: A bulletproof Node.js backfill engine with exponential backoff and auto-retry logic. It securely handles API rate limits (HTTP 429) and server spikes (HTTP 503) while fetching massive datasets from ArXiv and Europe PMC.

🛠 Tech Stack
Frontend: Next.js 14 (App Router), React, Tailwind CSS, Lucide React

Data Visualization: Recharts (Dynamic Bar/Line charts), React-Force-Graph-2D

Backend & Database: Supabase (PostgreSQL), pgvector for vector storage and cosine similarity search

AI & Machine Learning: Google Generative AI SDK (gemini-3.6-flash for text/pedagogical generation, text-embedding-004 for semantic mapping)

APIs: ArXiv API (CS/AI), Europe PMC REST API (Genomics/Oncology)

📦 Installation & Local Setup
Clone the repository:

Bash
git clone https://github.com/yourusername/synthetica.git
cd synthetica
Install dependencies:

Bash
npm install
Ensure you also install dotenv for the local backfill script: npm install dotenv

Configure Environment Variables:
Create a .env.local file in the root directory and add your keys:

Code snippet
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_google_ai_studio_key
CRON_SECRET=your_custom_cron_password
Database Setup (Supabase SQL Editor):
Ensure your papers table is configured with a vector column for embeddings. Run the custom RPC function for the Galaxy Map:

SQL
CREATE OR REPLACE FUNCTION get_graph_data(similarity_threshold float)
RETURNS json
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  nodes json;
  links json;
BEGIN
  SELECT json_agg(json_build_object('id', id, 'title', blog_title, 'category', category, 'score', trending_score, 'tldr', tldr_bullets)) INTO nodes FROM papers;
  SELECT json_agg(json_build_object('source', p1.id, 'target', p2.id, 'value', 1 - (p1.embedding <=> p2.embedding))) INTO links
  FROM papers p1 JOIN papers p2 ON p1.id < p2.id
  WHERE 1 - (p1.embedding <=> p2.embedding) > similarity_threshold;
  RETURN json_build_object('nodes', COALESCE(nodes, '[]'::json), 'links', COALESCE(links, '[]'::json));
END;
$$;
Run the Development Server:

Bash
npm run dev
🧠 Running the Autonomous Data Pipeline
To populate the database and light up the Galaxy Map, run the standalone background script. This script fetches prestige papers, processes them through the LLM pedagogical prompt, generates 768-dimensional embeddings, and pushes the records to Supabase.

Bash
node backfill.mjs
Note: The script is intentionally throttled (15-second delays, 30-second backoffs) to respect the Gemini API Free Tier limits. For bulk processing >20 papers, ensure your Google AI Studio account has pay-as-you-go billing enabled.

👨‍💻 Author
Built and engineered by Nikhil Chaudhary as a full-stack exploration of semantic search, applied AI pipelines, and premium interface design.
