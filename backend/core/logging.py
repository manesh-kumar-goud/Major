"""
Logging configuration
"""
import logging
import sys
from core.config import settings

def setup_logging():
    """Setup application logging"""
    logging.basicConfig(
        level=getattr(logging, settings.LOG_LEVEL.upper()),
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )
    
    logger = logging.getLogger("stock_forecasting")
    return logger



