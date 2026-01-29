from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
from emergentintegrations.llm.chat import LlmChat, UserMessage


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# LLM API Key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# AI Analysis Models
class FinancialData(BaseModel):
    expenses: List[Dict[str, Any]]
    incomes: List[Dict[str, Any]]
    debts: List[Dict[str, Any]]
    budgets: List[Dict[str, Any]]
    savings_goals: List[Dict[str, Any]]
    recurring_expenses: List[Dict[str, Any]]
    currency: str = "TRY"

class AIAnalysisRequest(BaseModel):
    financial_data: FinancialData
    analysis_type: str = "full"  # full, spending, savings, forecast, tips

class AIAnalysisResponse(BaseModel):
    analysis: str
    insights: List[str]
    recommendations: List[str]
    spending_patterns: Optional[Dict[str, Any]] = None
    forecast: Optional[Dict[str, Any]] = None
    alerts: Optional[List[str]] = None

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Masrofi API - مصروفي"}

# AI Analysis Endpoint
@api_router.post("/ai/analyze", response_model=AIAnalysisResponse)
async def analyze_finances(request: AIAnalysisRequest):
    """Analyze financial data using AI and provide insights"""
    try:
        if not EMERGENT_LLM_KEY:
            raise HTTPException(status_code=500, detail="AI service not configured")
        
        data = request.financial_data
        
        # Build context from financial data
        total_expenses = sum(e.get('amount', 0) for e in data.expenses)
        total_income = sum(i.get('amount', 0) for i in data.incomes)
        total_debts = sum(d.get('totalAmount', 0) for d in data.debts if d.get('status') == 'نشط')
        total_savings = sum(s.get('currentAmount', 0) for s in data.savings_goals)
        total_recurring = sum(r.get('amount', 0) for r in data.recurring_expenses if r.get('isActive'))
        
        # Category breakdown
        category_spending = {}
        for exp in data.expenses:
            cat = exp.get('category', 'other')
            category_spending[cat] = category_spending.get(cat, 0) + exp.get('amount', 0)
        
        currency = data.currency
        
        # Create AI prompt
        prompt = f"""أنت مستشار مالي ذكي. قم بتحليل البيانات المالية التالية وقدم نصائح مفيدة بالعربية:

📊 ملخص الوضع المالي:
- إجمالي الدخل: {total_income} {currency}
- إجمالي المصروفات: {total_expenses} {currency}
- الديون النشطة: {total_debts} {currency}
- المدخرات الحالية: {total_savings} {currency}
- المصاريف المتكررة الشهرية: {total_recurring} {currency}
- الرصيد المتاح: {total_income - total_expenses} {currency}

📈 توزيع المصروفات حسب الفئة:
{chr(10).join([f"- {k}: {v} {currency}" for k, v in category_spending.items()])}

عدد المعاملات: {len(data.expenses)}
عدد أهداف الادخار: {len(data.savings_goals)}

المطلوب:
1. تحليل موجز للوضع المالي (3-4 جمل)
2. 3-5 ملاحظات مهمة (insights)
3. 3-5 توصيات عملية للتحسين
4. أي تنبيهات مهمة إن وجدت

أجب بصيغة JSON:
{{
    "analysis": "التحليل هنا",
    "insights": ["ملاحظة 1", "ملاحظة 2"],
    "recommendations": ["توصية 1", "توصية 2"],
    "alerts": ["تنبيه 1"] أو []
}}"""

        # Initialize AI chat
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"masrofi-analysis-{uuid.uuid4()}",
            system_message="أنت مستشار مالي محترف تساعد المستخدمين العرب في إدارة أموالهم. قدم نصائح عملية ومفيدة بالعربية."
        ).with_model("gemini", "gemini-2.5-flash")
        
        # Send message
        user_message = UserMessage(text=prompt)
        response_text = await chat.send_message(user_message)
        
        # Parse response
        import json
        import re
        
        # Try to extract JSON from response
        json_match = re.search(r'\{[\s\S]*\}', response_text)
        if json_match:
            try:
                parsed = json.loads(json_match.group())
                return AIAnalysisResponse(
                    analysis=parsed.get('analysis', response_text),
                    insights=parsed.get('insights', []),
                    recommendations=parsed.get('recommendations', []),
                    alerts=parsed.get('alerts', []),
                    spending_patterns=category_spending,
                    forecast={
                        "monthly_balance": total_income - total_expenses,
                        "savings_rate": round((total_savings / total_income * 100) if total_income > 0 else 0, 1),
                        "debt_ratio": round((total_debts / total_income * 100) if total_income > 0 else 0, 1),
                    }
                )
            except json.JSONDecodeError:
                pass
        
        # Fallback if JSON parsing fails
        return AIAnalysisResponse(
            analysis=response_text,
            insights=["تم تحليل بياناتك المالية"],
            recommendations=["استمر في تتبع مصاريفك بانتظام"],
            spending_patterns=category_spending,
            forecast={
                "monthly_balance": total_income - total_expenses,
            }
        )
        
    except Exception as e:
        logger.error(f"AI Analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"فشل التحليل: {str(e)}")

# Quick Tips Endpoint
@api_router.post("/ai/tips")
async def get_quick_tips(request: AIAnalysisRequest):
    """Get quick financial tips based on data"""
    try:
        if not EMERGENT_LLM_KEY:
            raise HTTPException(status_code=500, detail="AI service not configured")
        
        data = request.financial_data
        total_expenses = sum(e.get('amount', 0) for e in data.expenses)
        total_income = sum(i.get('amount', 0) for i in data.incomes)
        
        prompt = f"""بناءً على أن المستخدم:
- دخله الشهري: {total_income} {data.currency}
- مصروفاته: {total_expenses} {data.currency}
- عدد معاملاته: {len(data.expenses)}

أعطني 3 نصائح سريعة ومفيدة بالعربية (كل نصيحة جملة واحدة فقط). أجب بصيغة JSON:
{{"tips": ["نصيحة 1", "نصيحة 2", "نصيحة 3"]}}"""

        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"masrofi-tips-{uuid.uuid4()}",
            system_message="أنت مستشار مالي. أعطِ نصائح قصيرة ومفيدة."
        ).with_model("gemini", "gemini-2.5-flash")
        
        response_text = await chat.send_message(UserMessage(text=prompt))
        
        import json
        import re
        json_match = re.search(r'\{[\s\S]*\}', response_text)
        if json_match:
            try:
                parsed = json.loads(json_match.group())
                return {"tips": parsed.get('tips', [])}
            except:
                pass
        
        return {"tips": ["تابع مصاريفك يومياً", "حدد ميزانية شهرية", "ادخر 20% من دخلك"]}
        
    except Exception as e:
        logger.error(f"Tips error: {str(e)}")
        return {"tips": ["تابع مصاريفك يومياً", "حدد ميزانية شهرية", "ادخر 20% من دخلك"]}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks(skip: int = 0, limit: int = 20):
    status_checks = await db.status_checks.find().skip(skip).limit(min(limit, 50)).to_list(50)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
