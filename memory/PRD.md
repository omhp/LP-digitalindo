# PRD — Digitalindo Landing Page

## Original Problem Statement
Create high-converting hero section for brand **Digitalindo**.
- Value Proposition: Digital Marketing Khusus UMKM
- Problem Solved: Membantu UMKM meningkatkan penjualan, membangun brand lebih kuat, dan menjangkau lebih banyak pelanggan.
- Target: Business Owner
- Requirements: Main headline, sub-headline, primary CTA, 3 supporting points, trust elements + hero image concept, background color scheme, CTA button color.

## User Persona
- **Pemilik UMKM** (kafe, fashion, jasa lokal) yang ingin meningkatkan penjualan via digital marketing dengan budget terbatas.

## Core Requirements (static)
1. Hero section konversi tinggi (headline, sub-headline, CTA, 3 benefit, trust elements).
2. Brand color: background #F8FAFC, CTA #EA580C (oranye), accent #2563EB.
3. Bahasa: Indonesia.

## Architecture
- Frontend: React + Tailwind + Shadcn UI (`/app/frontend/src/App.js`, `App.css`).
- Backend: FastAPI + MongoDB (`/app/backend/server.py`), routes prefix `/api`.
- AI: emergentintegrations (Emergent LLM Key), SSE streaming brief generator.

## Implemented (2026-06-27)
- Hero section split-layout: headline "Ledakkan Penjualan UMKM Anda dengan Digital Marketing", sub-headline, 3 supporting points, CTA oranye, social proof + credibility + risk reversal. ✅ verified
- Nav header, top trust bar, WhatsApp link.
- ROI Calculator (slider omset + multiplier). 
- AI Strategy Brief generator (SSE streaming) — endpoint wired, BLOCKED by LLM key budget.
- Lead capture modal → POST /api/leads. ✅ verified
- Brief history section → GET /api/marketing/briefs. ✅ verified
- Benefits section, footer.

## Known Issues
- **AI brief generation fails: Emergent LLM Key budget exceeded (Max budget: 0.0).** Needs balance top-up (Profile → Universal Key → Add Balance).

## Backlog
- P1: Verify AI brief end-to-end after budget top-up.
- P2: Add testimonials/case studies section.
- P2: SEO meta tags + OG image.

## Next Tasks
1. User adds Universal Key balance, then retest AI generator.
2. Optional: full testing_agent E2E pass.
