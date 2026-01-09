"""
Contact form endpoints
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import logging
from datetime import datetime

router = APIRouter()
security = HTTPBearer(auto_error=False)
logger = logging.getLogger("stock_forecasting")

class ContactRequest(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str

@router.post("/submit")
async def submit_contact(
    contact: ContactRequest,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
):
    """Submit contact form"""
    try:
        # TODO: Implement email sending functionality
        # For now, just log the contact form submission
        logger.info(f"Contact form submission: {contact.name} ({contact.email}) - {contact.subject}")
        logger.info(f"Message: {contact.message}")
        
        # In production, you would:
        # 1. Send email using SMTP or email service (SendGrid, AWS SES, etc.)
        # 2. Store in database
        # 3. Send confirmation email to user
        
        return {
            "success": True,
            "message": "Thank you for your message! We'll get back to you soon.",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Contact form error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to submit contact form")





