"""
Supabase JWT Token Decoding
Extract user_id from Supabase JWT tokens
"""
try:
    import jwt
    JWT_AVAILABLE = True
except ImportError:
    try:
        from jose import jwt
        JWT_AVAILABLE = True
    except ImportError:
        JWT_AVAILABLE = False

from typing import Optional
from core.config import settings
import logging

logger = logging.getLogger("stock_forecasting")


def decode_supabase_token(token: str) -> Optional[dict]:
    """
    Decode Supabase JWT token to extract user information
    
    Args:
        token: JWT token string
        
    Returns:
        Dictionary with user info including 'sub' (user_id) or None if invalid
    """
    if not JWT_AVAILABLE:
        logger.warning("JWT library not available. Install PyJWT or python-jose")
        return None
    
    try:
        # Supabase JWT tokens don't require secret verification for reading
        # They're signed but we can decode without verification for user_id extraction
        # In production, you might want to verify with Supabase JWT secret
        if hasattr(jwt, 'decode'):
            # PyJWT
            decoded = jwt.decode(
                token,
                options={"verify_signature": False}  # We just need user_id, not full verification
            )
        else:
            # python-jose
            decoded = jwt.decode(
                token,
                options={"verify_signature": False}
            )
        return decoded
    except Exception as e:
        logger.warning(f"Failed to decode Supabase token: {e}")
        return None


def get_user_id_from_token(token: str) -> Optional[str]:
    """
    Extract user_id from Supabase JWT token
    
    Args:
        token: JWT token string
        
    Returns:
        User ID (UUID) or None if not found
    """
    decoded = decode_supabase_token(token)
    if decoded:
        # Supabase uses 'sub' claim for user_id
        user_id = decoded.get('sub') or decoded.get('user_id')
        return user_id
    return None

