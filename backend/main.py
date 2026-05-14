from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agents.orchestrator import generate_itinerary, refine_feedback

app = FastAPI(title="Breeze.ai Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_methods=["POST"],
    allow_headers=["*"],
)


class GenerateRequest(BaseModel):
    city: str
    departure: str
    start_date: str
    end_date: str
    days: int
    composition: str
    budget: str
    interests: list[str]


class RefineRequest(BaseModel):
    feedback: str
    current_itinerary: dict


@app.post("/generate")
async def generate(req: GenerateRequest):
    try:
        itinerary = await generate_itinerary(
            city=req.city,
            departure=req.departure,
            start_date=req.start_date,
            end_date=req.end_date,
            days=req.days,
            composition=req.composition,
            budget=req.budget,
            interests=req.interests,
        )
        return itinerary
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/refine")
def refine(req: RefineRequest):
    try:
        return refine_feedback(req.feedback, req.current_itinerary)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
def health():
    return {"status": "ok"}
