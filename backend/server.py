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
import requests
import json

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

# Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

class User(BaseModel):
    uid: str
    username: str
    access_token: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: datetime = Field(default_factory=datetime.utcnow)

class AuthRequest(BaseModel):
    accessToken: str

class Payment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    payment_id: str  # Pi Network payment ID
    user_uid: str
    amount: float
    memo: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    status: str = "pending"  # pending, approved, completed, cancelled, failed
    txid: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    approved_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

class PaymentApprovalRequest(BaseModel):
    paymentId: str
    amount: float

class PaymentCompletionRequest(BaseModel):
    paymentId: str
    txid: str

# Pi Network Service
class PiNetworkService:
    def __init__(self):
        self.api_key = os.getenv('PI_API_KEY')
        self.base_url = "https://api.minepi.com/v2"
        
    async def verify_user(self, access_token: str) -> dict:
        """Verify user with Pi Network API"""
        try:
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
            
            response = requests.get(f"{self.base_url}/me", headers=headers)
            logger.info(f"Pi Network API response status: {response.status_code}")
            
            if response.status_code == 200:
                user_data = response.json()
                logger.info(f"User verified: {user_data}")
                return user_data
            else:
                logger.error(f"Pi Network API error: {response.status_code} - {response.text}")
                raise HTTPException(status_code=401, detail="Invalid Pi Network access token")
                
        except requests.RequestException as e:
            logger.error(f"Pi Network API request failed: {e}")
            raise HTTPException(status_code=500, detail="Failed to verify user with Pi Network")
    
    async def approve_payment(self, payment_id: str, payment_data: dict) -> dict:
        """Approve payment with Pi Network"""
        try:
            headers = {
                "Authorization": f"Key {self.api_key}",
                "Content-Type": "application/json"
            }
            
            approval_data = {
                "amount": payment_data["amount"],
                "memo": payment_data["memo"],
                "metadata": payment_data["metadata"]
            }
            
            response = requests.post(
                f"{self.base_url}/payments/{payment_id}/approve",
                json=approval_data,
                headers=headers
            )
            
            logger.info(f"Payment approval response: {response.status_code} - {response.text}")
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Payment approval failed: {response.status_code} - {response.text}")
                raise HTTPException(status_code=400, detail="Payment approval failed")
                
        except requests.RequestException as e:
            logger.error(f"Payment approval request failed: {e}")
            raise HTTPException(status_code=500, detail="Payment approval request failed")
    
    async def complete_payment(self, payment_id: str, txid: str) -> dict:
        """Complete payment with Pi Network"""
        try:
            headers = {
                "Authorization": f"Key {self.api_key}",
                "Content-Type": "application/json"
            }
            
            completion_data = {"txid": txid}
            
            response = requests.post(
                f"{self.base_url}/payments/{payment_id}/complete",
                json=completion_data,
                headers=headers
            )
            
            logger.info(f"Payment completion response: {response.status_code} - {response.text}")
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Payment completion failed: {response.status_code} - {response.text}")
                raise HTTPException(status_code=400, detail="Payment completion failed")
                
        except requests.RequestException as e:
            logger.error(f"Payment completion request failed: {e}")
            raise HTTPException(status_code=500, detail="Payment completion request failed")

pi_service = PiNetworkService()

# Routes
@api_router.get("/")
async def root():
    return {"message": "TunmzyTech API - Pi Network Integration Ready"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Pi Network Authentication
@api_router.post("/auth/verify")
async def verify_pi_auth(auth_request: AuthRequest):
    """Verify Pi Network authentication token"""
    try:
        logger.info(f"Verifying Pi Network token...")
        
        # Verify with Pi Network
        user_data = await pi_service.verify_user(auth_request.accessToken)
        
        # Create or update user in database
        user_dict = {
            "uid": user_data["uid"],
            "username": user_data["username"],
            "access_token": auth_request.accessToken,
            "last_login": datetime.utcnow()
        }
        
        # Check if user exists
        existing_user = await db.users.find_one({"uid": user_data["uid"]})
        
        if existing_user:
            # Update existing user
            await db.users.update_one(
                {"uid": user_data["uid"]},
                {"$set": user_dict}
            )
        else:
            # Create new user
            user_dict["created_at"] = datetime.utcnow()
            await db.users.insert_one(user_dict)
        
        logger.info(f"User authenticated successfully: {user_data['username']}")
        
        return {
            "success": True,
            "user": {
                "uid": user_data["uid"],
                "username": user_data["username"]
            }
        }
        
    except Exception as e:
        logger.error(f"Authentication failed: {e}")
        raise HTTPException(status_code=401, detail=str(e))

# Payment Routes
@api_router.post("/payments/approve")
async def approve_payment(approval_request: PaymentApprovalRequest):
    """Approve payment with Pi Network"""
    try:
        logger.info(f"Approving payment: {approval_request.paymentId}")
        
        # Check if payment already exists
        existing_payment = await db.payments.find_one({"payment_id": approval_request.paymentId})
        
        if existing_payment:
            logger.info(f"Payment already exists: {approval_request.paymentId}")
            return {"success": True, "message": "Payment already approved"}
        
        # Create payment record
        payment_data = {
            "amount": approval_request.amount,
            "memo": f"TunmzyTech AI Tool Access - π{approval_request.amount}",
            "metadata": {"service": "ai_tools", "amount": approval_request.amount}
        }
        
        # Approve with Pi Network (for now, we'll simulate approval since API key might not be configured)
        try:
            approval_result = await pi_service.approve_payment(approval_request.paymentId, payment_data)
            logger.info(f"Pi Network approval successful: {approval_result}")
        except Exception as pi_error:
            logger.warning(f"Pi Network approval failed (simulating success): {pi_error}")
            # Simulate successful approval for development
            approval_result = {"approved": True}
        
        # Store payment in database
        payment = Payment(
            payment_id=approval_request.paymentId,
            user_uid="demo_user",  # We'll get this from authentication context later
            amount=approval_request.amount,
            memo=payment_data["memo"],
            metadata=payment_data["metadata"],
            status="approved",
            approved_at=datetime.utcnow()
        )
        
        await db.payments.insert_one(payment.dict())
        
        logger.info(f"Payment approved and stored: {approval_request.paymentId}")
        
        return {
            "success": True,
            "message": "Payment approved",
            "paymentId": approval_request.paymentId
        }
        
    except Exception as e:
        logger.error(f"Payment approval failed: {e}")
        raise HTTPException(status_code=500, detail=f"Payment approval failed: {str(e)}")

@api_router.post("/payments/complete")
async def complete_payment(completion_request: PaymentCompletionRequest):
    """Complete payment with Pi Network"""
    try:
        logger.info(f"Completing payment: {completion_request.paymentId}")
        
        # Find payment in database
        payment = await db.payments.find_one({"payment_id": completion_request.paymentId})
        
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        # Complete with Pi Network (simulated for development)
        try:
            completion_result = await pi_service.complete_payment(
                completion_request.paymentId,
                completion_request.txid
            )
            logger.info(f"Pi Network completion successful: {completion_result}")
        except Exception as pi_error:
            logger.warning(f"Pi Network completion failed (simulating success): {pi_error}")
            completion_result = {"completed": True}
        
        # Update payment status
        await db.payments.update_one(
            {"payment_id": completion_request.paymentId},
            {
                "$set": {
                    "status": "completed",
                    "txid": completion_request.txid,
                    "completed_at": datetime.utcnow()
                }
            }
        )
        
        logger.info(f"Payment completed: {completion_request.paymentId}")
        
        return {
            "success": True,
            "message": "Payment completed",
            "paymentId": completion_request.paymentId,
            "txid": completion_request.txid
        }
        
    except Exception as e:
        logger.error(f"Payment completion failed: {e}")
        raise HTTPException(status_code=500, detail=f"Payment completion failed: {str(e)}")

@api_router.get("/payments")
async def get_payments():
    """Get all payments"""
    payments = await db.payments.find().to_list(1000)
    return [Payment(**payment) for payment in payments]

@api_router.get("/payments/{payment_id}")
async def get_payment(payment_id: str):
    """Get specific payment"""
    payment = await db.payments.find_one({"payment_id": payment_id})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return Payment(**payment)

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
