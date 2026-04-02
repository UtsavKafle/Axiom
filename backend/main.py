from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import news, roadmap, resume, interview, opportunities

app = FastAPI(title="Axiom API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(news.router, prefix="/news", tags=["news"])
app.include_router(roadmap.router, prefix="/roadmap", tags=["roadmap"])
app.include_router(resume.router, prefix="/resume", tags=["resume"])
app.include_router(interview.router, prefix="/interview", tags=["interview"])
app.include_router(opportunities.router, prefix="/opportunities", tags=["opportunities"])


@app.get("/health")
def health():
    return {"status": "ok"}
