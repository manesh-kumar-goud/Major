"""
Prediction History Service
Tracks user predictions for portfolio integration
"""
import json
import os
from typing import List, Dict, Optional
from datetime import datetime
import logging

logger = logging.getLogger("stock_forecasting")

class PredictionHistoryService:
    """Service to track and retrieve prediction history"""
    
    def __init__(self):
        self.history_file = "data/prediction_history.json"
        self._ensure_directory()
    
    def _ensure_directory(self):
        """Ensure data directory exists"""
        os.makedirs(os.path.dirname(self.history_file), exist_ok=True)
    
    def save_prediction(self, prediction_data: Dict) -> bool:
        """
        Save a prediction to history
        
        Args:
            prediction_data: Dictionary containing prediction details
        
        Returns:
            True if saved successfully
        """
        try:
            # Load existing history
            history = self.load_all_predictions()
            
            # Add new prediction
            prediction_entry = {
                "id": len(history) + 1,
                "ticker": prediction_data.get("ticker", ""),
                "model_type": prediction_data.get("model_type", ""),
                "timestamp": datetime.now().isoformat(),
                "last_price": prediction_data.get("last_price", 0),
                "predicted_price": prediction_data.get("future_predictions", {}).get("predictions", [0])[0] if prediction_data.get("future_predictions") else prediction_data.get("last_price", 0),
                "metrics": prediction_data.get("metrics", {}),
                "period": prediction_data.get("period", "1y"),
                "prediction_days": prediction_data.get("prediction_days", 30)
            }
            
            history.append(prediction_entry)
            
            # Save to file
            with open(self.history_file, 'w') as f:
                json.dump(history, f, indent=2)
            
            logger.info(f"Saved prediction for {prediction_entry['ticker']}")
            return True
            
        except Exception as e:
            logger.error(f"Error saving prediction: {e}", exc_info=True)
            return False
    
    def load_all_predictions(self) -> List[Dict]:
        """Load all prediction history"""
        try:
            if os.path.exists(self.history_file):
                with open(self.history_file, 'r') as f:
                    return json.load(f)
            return []
        except Exception as e:
            logger.error(f"Error loading prediction history: {e}")
            return []
    
    def get_recent_predictions(self, limit: int = 10) -> List[Dict]:
        """Get recent predictions"""
        history = self.load_all_predictions()
        # Sort by timestamp descending
        history.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        return history[:limit]
    
    def get_predictions_by_ticker(self, ticker: str) -> List[Dict]:
        """Get all predictions for a specific ticker"""
        history = self.load_all_predictions()
        return [p for p in history if p.get("ticker", "").upper() == ticker.upper()]
    
    def get_unique_tickers(self) -> List[str]:
        """Get list of unique tickers that have predictions"""
        history = self.load_all_predictions()
        tickers = set()
        for pred in history:
            ticker = pred.get("ticker", "")
            if ticker:
                tickers.add(ticker.upper())
        return sorted(list(tickers))

# Global instance
_prediction_history_service = None

def get_prediction_history_service() -> PredictionHistoryService:
    """Get global prediction history service instance"""
    global _prediction_history_service
    if _prediction_history_service is None:
        _prediction_history_service = PredictionHistoryService()
    return _prediction_history_service














