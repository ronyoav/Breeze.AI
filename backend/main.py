from dotenv import load_dotenv
load_dotenv()

from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agents.orchestrator import generate_itinerary

app = FastAPI(title="Breeze.ai Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_methods=["POST"],
    allow_headers=["*"],
)


class GenerateRequest(BaseModel):
    input_data: dict
    user_rejections: Optional[str] = None
    previous_pool: Optional[list] = None


@app.post("/generate")
async def generate(req: GenerateRequest):
    try:
        result = await generate_itinerary(
            input_data=req.input_data,
            user_rejections=req.user_rejections,
            previous_pool=req.previous_pool,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
def health():
    return {"status": "ok"}
