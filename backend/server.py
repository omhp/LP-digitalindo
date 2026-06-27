from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, BeforeValidator
from typing import List, Annotated, Any
from bson import ObjectId
from datetime import datetime, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# --- MongoDB Adherence / Base Setup ---
def validate_object_id(v: Any) -> str:
    if isinstance(v, ObjectId):
        return str(v)
    if isinstance(v, str) and ObjectId.is_valid(v):
        return v
    raise ValueError("Invalid ObjectId")

PyObjectId = Annotated[str, BeforeValidator(validate_object_id)]

class BaseDocument(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str, datetime: lambda dt: dt.isoformat()}
    )
    
    id: PyObjectId = Field(default_factory=lambda: str(ObjectId()), alias="_id")

    def to_mongo(self) -> dict:
        data = self.model_dump(by_alias=True)
        if "_id" in data and data["_id"]:
            data["_id"] = ObjectId(data["_id"])
        return data

    @classmethod
    def from_mongo(cls, data: dict):
        if not data:
            return None
        data = dict(data)
        return cls(**data)

# --- Document Models ---
class StatusCheckDocument(BaseDocument):
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LeadDocument(BaseDocument):
    name: str
    business_name: str
    email: str
    phone: str
    business_desc: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MarketingBriefDocument(BaseDocument):
    business_name: str
    business_category: str
    target_audience: str
    brief_content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# --- Pydantic Request Models ---
class StatusCheckCreate(BaseModel):
    client_name: str

class LeadCreate(BaseModel):
    name: str
    business_name: str
    email: str
    phone: str
    business_desc: str

class MarketingBriefCreate(BaseModel):
    business_name: str
    business_category: str
    target_audience: str

# --- Routes ---

@api_router.get("/")
async def root():
    return {"message": "Selamat datang di API Digitalindo - Solusi Digital Marketing UMKM"}

# Status checks (Maintained for existing compatibility)
@api_router.post("/status", response_model=StatusCheckDocument)
async def create_status_check(input: StatusCheckCreate):
    doc_obj = StatusCheckDocument(client_name=input.client_name)
    await db.status_checks.insert_one(doc_obj.to_mongo())
    return doc_obj

@api_router.get("/status", response_model=List[StatusCheckDocument])
async def get_status_checks():
    cursor = db.status_checks.find({})
    docs = await cursor.to_list(length=1000)
    return [StatusCheckDocument.from_mongo(d) for doc in docs if (d := doc)]

# Leads capture endpoints
@api_router.post("/leads", response_model=LeadDocument)
async def create_lead(input: LeadCreate):
    try:
        lead_obj = LeadDocument(
            name=input.name,
            business_name=input.business_name,
            email=input.email,
            phone=input.phone,
            business_desc=input.business_desc
        )
        await db.leads.insert_one(lead_obj.to_mongo())
        logger.info(f"Lead created successfully: {lead_obj.id}")
        return lead_obj
    except Exception as e:
        logger.error(f"Error creating lead: {str(e)}")
        raise HTTPException(status_code=500, detail="Gagal menyimpan data konsultasi.")

@api_router.get("/leads", response_model=List[LeadDocument])
async def get_leads():
    try:
        cursor = db.leads.find({}).sort("timestamp", -1)
        docs = await cursor.to_list(length=1000)
        return [LeadDocument.from_mongo(d) for d in docs]
    except Exception as e:
        logger.error(f"Error retrieving leads: {str(e)}")
        raise HTTPException(status_code=500, detail="Gagal mengambil data konsultasi.")

# AI Marketing Brief generation with Streaming (SSE)
@api_router.post("/marketing/generate")
async def generate_brief(input: MarketingBriefCreate):
    llm_key = os.environ.get("EMERGENT_LLM_KEY")
    if not llm_key:
        logger.error("EMERGENT_LLM_KEY is missing from environment.")
        raise HTTPException(status_code=500, detail="Kunci integrasi AI tidak ditemukan.")

    prompt_text = (
        f"Buatkan strategi pemasaran digital 3 langkah taktis untuk bisnis berikut:\n"
        f"- Nama Bisnis: {input.business_name}\n"
        f"- Kategori Bisnis: {input.business_category}\n"
        f"- Target Pelanggan: {input.target_audience}\n\n"
        f"Persyaratan Output:\n"
        f"1. LANGKAH 1: Strategi Branding & Media Sosial (praktis, tidak mahal).\n"
        f"2. LANGKAH 2: Strategi Meningkatkan Penjualan (misalnya promo, copywriting, penawaran menarik).\n"
        f"3. LANGKAH 3: Strategi Iklan atau Jangkauan Pelanggan Baru (organik atau berbayar dengan budget minim).\n"
        f"Gunakan format Markdown tebal dan poin-poin yang mudah dipahami pemilik bisnis (UMKM)."
    )

    try:
        # Initialize LlmChat
        chat = LlmChat(
            api_key=llm_key,
            session_id=f"brief-{str(ObjectId())}",
            system_message=(
                "Anda adalah Pakar Digital Marketing khusus UMKM di Digitalindo. "
                "Tugas Anda adalah merancang rencana pemasaran digital taktis 3-langkah "
                "yang sangat praktis, ramah UMKM, berbiaya rendah, namun efektif tinggi. "
                "Berikan jawaban dalam bahasa Indonesia yang penuh semangat, inspiratif, dan mudah diterapkan tanpa istilah teknis yang rumit."
            )
        ).with_model("openai", "gpt-5.4")

        user_message = UserMessage(text=prompt_text)

        async def sse_stream_generator():
            accumulated_text = ""
            try:
                async for event in chat.stream_message(user_message):
                    if isinstance(event, TextDelta):
                        content = event.content
                        accumulated_text += content
                        # Stream tokens to SSE
                        yield f"data: {json.dumps({'content': content, 'done': False})}\n\n"
                    elif isinstance(event, StreamDone):
                        break

                # Save complete brief to database
                brief_obj = MarketingBriefDocument(
                    business_name=input.business_name,
                    business_category=input.business_category,
                    target_audience=input.target_audience,
                    brief_content=accumulated_text
                )
                await db.marketing_briefs.insert_one(brief_obj.to_mongo())
                
                # Signal completion and pass the saved brief ID
                yield f"data: {json.dumps({'done': True, 'id': str(brief_obj.id), 'full_content': accumulated_text})}\n\n"
            except Exception as stream_err:
                logger.error(f"Error in SSE streaming: {str(stream_err)}")
                yield f"data: {json.dumps({'error': 'Terjadi kesalahan saat menghasilkan strategi pemasaran.'})}\n\n"

        return StreamingResponse(
            sse_stream_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"
            }
        )

    except Exception as e:
        logger.error(f"Failed to initialize AI Brief generation: {str(e)}")
        raise HTTPException(status_code=500, detail="Gagal menginisialisasi pembuatan strategi AI.")

@api_router.get("/marketing/briefs", response_model=List[MarketingBriefDocument])
async def get_briefs():
    try:
        cursor = db.marketing_briefs.find({}).sort("timestamp", -1)
        docs = await cursor.to_list(length=10) # Limit to 10 latest for preview
        return [MarketingBriefDocument.from_mongo(d) for d in docs]
    except Exception as e:
        logger.error(f"Error retrieving briefs: {str(e)}")
        raise HTTPException(status_code=500, detail="Gagal mengambil riwayat strategi.")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
