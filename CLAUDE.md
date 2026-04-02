# Axiom — CS Student Career Platform

## What This Is
Axiom is a full-stack platform built for CS students to stay ahead
of the industry. It combines real-time tech news, personalized
career roadmaps, resume review, interview prep, and an opportunity
feed — all powered by IBM watsonx Orchestrate agentic AI on the
backend.

## Tech Stack
- Frontend: React + Tailwind CSS
- Backend: FastAPI (Python)
- Database: Supabase (PostgreSQL)
- Auth: Clerk
- AI Orchestration: IBM watsonx Orchestrate
- Frontend Hosting: Vercel
- Backend Hosting: Render

## Aesthetic & Design Rules
- Dark geometric precision theme
- Background: #0a0a0f with faint geometric grid
- Primary accent: Electric blue #4361ee
- Secondary accent: Amber #f4a400
- Headings font: Syne
- Monospace/data font: Space Mono
- Cards use glassmorphism with thin blue border accents
- Corner bracket decorations on UI elements [ ]
- Never use purple gradients, Inter font, or generic AI aesthetics

## Project Structure
- /front — React app
- /backend — FastAPI server
- /agents — watsonx Orchestrate agent configs and prompts

## The 5 Core Features
1. News Feed — real-time CS/tech news, main landing page after login
2. Personalized Roadmap — NeetCode style but AI personalized to the user's year, stack, and target role
3. Resume Reviewer — CS-specific resume feedback and tips
4. Interview Prep — trending questions, patterns by company, system design topics
5. Opportunity Feed — internships, hackathons, fellowships filtered to the user

## Agentic Architecture (watsonx Orchestrate)
- One Orchestrator agent faces the user — agents never talk to the user directly
- Agents are internal workers only
- Guardrails live at the Orchestrator level
- Input sanitization happens at the backend before reaching the Orchestrator

## Key Rules When Coding
- Always use Tailwind for styling — no inline styles
- All API calls go through /backend — never call watsonx directly from the frontend
- Keep components one per file
- Use Clerk for all auth — never build custom auth
- All agent prompts live in /agents folder — never hardcode them in backend logic
