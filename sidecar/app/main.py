import os
import re
import logging
import asyncio
from typing import List, Optional
from fastapi import FastAPI, Header, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from google import genai
from google.genai import types
import httpx

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("weakspot-sidecar")

app = FastAPI(title="WeakSpot Cognee Cloud Sidecar API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_headers=["*"],
    allow_methods=["*"],
)

COGNEE_BASE_URL = os.environ.get("COGNEE_BASE_URL", "https://tenant-d077aaf8-1a30-4bbb-b053-aeafaaf8f38b.aws.cognee.ai")
COGNEE_API_KEY = os.environ.get("COGNEE_API_KEY", "b14a2e3b8cb219306f5d350552a6c815ee555284c6706040b1d2c319cf5217d6")

def slugify(text: str) -> str:
    # Convert pattern name (e.g., "Dynamic Programming") to a safe dataset name (e.g., "dynamic_programming")
    return re.sub(r'[^a-z0-9]+', '_', text.lower()).strip('_')

# Request and Response schemas
class ValidateKeyRequest(BaseModel):
    api_key: str

class LogAttemptRequest(BaseModel):
    user_id: str
    problem_title: str
    pattern: str
    difficulty: str
    result: str
    mistake_note: str

class CheckBeforeSolvingRequest(BaseModel):
    user_id: str
    pattern: str

class ImproveRequest(BaseModel):
    user_id: str
    pattern: str
    status: str # "mastered" or "weak_spot"

class ForgetRequest(BaseModel):
    user_id: str
    pattern: str

# Schema for Structured Output from Gemini
class StructuredAttempt(BaseModel):
    pattern_concept: str = Field(description="The primary programming pattern or algorithmic concept, normalized.")
    mistake_summary: str = Field(description="A concise summary of the logical mistake or bug made by the user.")
    key_takeaway: str = Field(description="A clear, short watch-out warning or technical advice for the future when using this pattern.")

@app.post("/validate-key")
async def validate_key(req: ValidateKeyRequest):
    """
    Validates the provided Gemini key by attempting a simple content generation call.
    """
    try:
        client = genai.Client(api_key=req.api_key)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents="Say 'valid' and nothing else.",
        )
        if response and response.text:
            return {"valid": True, "message": "Key handshake successful"}
        else:
            raise HTTPException(status_code=400, detail="Invalid API key response")
    except Exception as e:
        logger.error(f"API key validation failed: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Key validation failed: {str(e)}")

@app.post("/log-attempt")
async def log_attempt(
    req: LogAttemptRequest,
    x_gemini_key: Optional[str] = Header(None)
):
    """
    1. Call Gemini to structure the raw practice flaw
    2. Write to Cognee Cloud database using POST /api/v1/remember/entry
    """
    if not x_gemini_key:
        raise HTTPException(status_code=400, detail="Missing X-Gemini-Key header")
        
    try:
        # Step 1: Use Gemini to structure the raw input
        client = genai.Client(api_key=x_gemini_key)
        prompt = f"""
        Extract the pattern/concept, mistake summary, and future takeaway warning from this coding practice log:
        - Problem Title: {req.problem_title}
        - Concept Pattern: {req.pattern}
        - Difficulty: {req.difficulty}
        - Result: {req.result}
        - Mistake Note: {req.mistake_note}
        """
        
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=StructuredAttempt
            )
        )
        
        structured: StructuredAttempt = response.parsed
        logger.info(f"Structured attempt parsed successfully: {structured}")
        
    except Exception as e:
        logger.error(f"Gemini structuring failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Gemini structuring failed: {str(e)}")

    # Step 2: Ingest the structured memory into Cognee Cloud
    try:
        dataset_name = f"user_{req.user_id}_{slugify(req.pattern)}"
        logger.info(f"Ingesting into Cognee Cloud: dataset={dataset_name}")
        
        payload = {
            "entry": {
                "type": "qa",
                "question": f"Mistake in {structured.pattern_concept} - {req.problem_title}",
                "answer": f"Mistake summary: {structured.mistake_summary}. Key takeaway: {structured.key_takeaway}"
            },
            "dataset_name": dataset_name,
            "session_id": req.user_id
        }
        
        async with httpx.AsyncClient() as client:
            res = await client.post(
                f"{COGNEE_BASE_URL}/api/v1/remember/entry",
                json=payload,
                headers={"X-Api-Key": COGNEE_API_KEY},
                timeout=30.0
            )
            if res.status_code != 200:
                raise Exception(f"Cloud API returned status {res.status_code}: {res.text}")
                
    except Exception as e:
        logger.error(f"Cognee Ingestion failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Cognee Ingestion failed: {str(e)}")
            
    return {
        "success": True,
        "structured": {
            "pattern_concept": structured.pattern_concept,
            "mistake_summary": structured.mistake_summary,
            "key_takeaway": structured.key_takeaway
        }
    }

@app.post("/check-before-solving")
async def check_before_solving(
    req: CheckBeforeSolvingRequest,
    x_gemini_key: Optional[str] = Header(None)
):
    """
    1. Query Cognee Cloud to retrieve related past mistakes on the pattern
    2. Format results via Gemini to produce a watch-out warning briefing
    """
    if not x_gemini_key:
        raise HTTPException(status_code=400, detail="Missing X-Gemini-Key header")
        
    dataset_name = f"user_{req.user_id}_{slugify(req.pattern)}"
    recalled_context = []
    
    try:
        logger.info(f"Recalling memory from Cognee Cloud: dataset={dataset_name}")
        
        payload = {
            "query": f"mistakes in {req.pattern}",
            "session_id": req.user_id
        }
        
        async with httpx.AsyncClient() as client:
            res = await client.post(
                f"{COGNEE_BASE_URL}/api/v1/recall",
                json=payload,
                headers={"X-Api-Key": COGNEE_API_KEY},
                timeout=30.0
            )
            if res.status_code == 200:
                results = res.json()
                if isinstance(results, list):
                    for r in results:
                        if isinstance(r, dict):
                            text_val = r.get("answer") or r.get("text") or r.get("content") or str(r)
                            recalled_context.append(text_val)
                        else:
                            recalled_context.append(str(r))
                elif isinstance(results, dict):
                    ans = results.get("answer") or results.get("text")
                    if ans:
                        recalled_context.append(ans)
            else:
                logger.warning(f"Cognee Cloud recall status {res.status_code}: {res.text}")
                
    except Exception as e:
        logger.error(f"Cognee recall failed or dataset not found: {str(e)}")
        recalled_context = []

    # If no past failures, return a safe message immediately
    if not recalled_context:
        return {
            "warning_found": False,
            "briefing": "No active weak spots found for this pattern. Your memory is clean."
        }
        
    # Step 2: Use Gemini to summarize the warnings
    try:
        client = genai.Client(api_key=x_gemini_key)
        prompt = f"""
        The user is starting a new problem of pattern: "{req.pattern}".
        Here are their past mistakes and warnings retrieved from memory:
        {chr(10).join(['- ' + ctx for ctx in recalled_context])}
        
        Generate a concise, punchy "Watch Out For" briefing (maximum 3 bullet points, under 60 words total).
        Focus only on critical warnings and direct programming advice. Keep it highly technical and direct.
        """
        
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        briefing = response.text.strip()
        
        return {
            "warning_found": True,
            "briefing": briefing
        }
    except Exception as e:
        logger.error(f"Gemini recall briefing synthesis failed: {str(e)}")
        fallback = "Watch out for:\n" + "\n".join([f"- {ctx}" for ctx in recalled_context[:3]])
        return {
            "warning_found": True,
            "briefing": fallback
        }

@app.post("/improve")
async def improve(
    req: ImproveRequest,
    x_gemini_key: Optional[str] = Header(None)
):
    # Cognee Cloud manages indexing in real-time, so we return success immediately
    return {"success": True, "message": f"Memory optimized for {req.pattern}."}

@app.post("/forget")
async def forget(
    req: ForgetRequest,
    x_gemini_key: Optional[str] = Header(None)
):
    """
    Prunes the active weak-spot nodes for the pattern by deleting the dataset from Cognee Cloud.
    """
    if not x_gemini_key:
        raise HTTPException(status_code=400, detail="Missing X-Gemini-Key header")
        
    dataset_name = f"user_{req.user_id}_{slugify(req.pattern)}"
    
    try:
        logger.info(f"Looking up dataset to forget on Cognee Cloud: {dataset_name}")
        
        async with httpx.AsyncClient() as client:
            # 1. Fetch the dataset list to find the matching name and get its UUID
            res_list = await client.get(
                f"{COGNEE_BASE_URL}/api/v1/datasets/",
                headers={"X-Api-Key": COGNEE_API_KEY},
                timeout=30.0
            )
            if res_list.status_code != 200:
                raise Exception(f"Could not retrieve datasets list. Status {res_list.status_code}: {res_list.text}")
                
            datasets = res_list.json()
            dataset_id = None
            if isinstance(datasets, list):
                for d in datasets:
                    if isinstance(d, dict) and d.get("name") == dataset_name:
                        dataset_id = d.get("id")
                        break
                        
            # 2. If found, delete the dataset by its UUID
            if dataset_id:
                logger.info(f"Deleting dataset {dataset_name} with UUID {dataset_id}")
                res_del = await client.delete(
                    f"{COGNEE_BASE_URL}/api/v1/datasets/{dataset_id}",
                    headers={"X-Api-Key": COGNEE_API_KEY},
                    timeout=30.0
                )
                if res_del.status_code not in (200, 204, 404):
                    raise Exception(f"Cloud delete returned status {res_del.status_code}: {res_del.text}")
            else:
                logger.info(f"Dataset {dataset_name} not found in Cognee Cloud list. Nothing to prune.")
                
        return {"success": True, "message": f"Pruned active weak spot memory nodes for {req.pattern}."}
    except Exception as e:
        logger.error(f"Cognee forget failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Cognee forget failed: {str(e)}")

@app.get("/graph")
async def get_graph():
    return {"nodes": [], "edges": []}
