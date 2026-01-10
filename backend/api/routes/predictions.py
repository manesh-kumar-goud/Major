"""
Prediction endpoints
"""
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from services.prediction_service import PredictionService
import csv
import io
import logging
import traceback

logger = logging.getLogger("stock_forecasting")

router = APIRouter()
security = HTTPBearer(auto_error=False)
prediction_service = PredictionService()

class PredictionRequest(BaseModel):
    ticker: str
    model: str = "LSTM"  # LSTM, RNN, or PATCHTST
    period: str = "3y"  # Changed from "1y" to "3y" for more data (better accuracy)
    prediction_days: int = 30
    predictionDays: int = None  # Accept camelCase for frontend compatibility
    epochs: int = None  # Optional: override default epochs
    batch_size: int = None  # Optional: override default batch size
    sequence_length: int = None  # Optional: override default sequence length (lookback)
    
    def __init__(self, **data):
        # Handle both snake_case and camelCase
        if 'predictionDays' in data and 'prediction_days' not in data:
            data['prediction_days'] = data.pop('predictionDays')
        if 'batchSize' in data and 'batch_size' not in data:
            data['batch_size'] = data.pop('batchSize')
        if 'sequenceLength' in data and 'sequence_length' not in data:
            data['sequence_length'] = data.pop('sequenceLength')
        super().__init__(**data)

class ComparisonRequest(BaseModel):
    ticker: str
    period: str = "3y"  # Changed from "1y" to "3y" for more data (better accuracy)

@router.post("/predict")
async def predict_stock(
    request: PredictionRequest,
    background_tasks: BackgroundTasks,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
):
    """Make stock price prediction using LSTM or RNN"""
    try:
        # Prepare hyperparameters if provided
        predict_kwargs = {
            'ticker': request.ticker.upper(),
            'model_type': request.model.upper(),
            'period': request.period,
            'prediction_days': request.prediction_days
        }
        
        # Add optional hyperparameters if provided
        if request.epochs is not None:
            predict_kwargs['epochs'] = request.epochs
            logger.info(f"Using custom epochs: {request.epochs}")
        if request.batch_size is not None:
            predict_kwargs['batch_size'] = request.batch_size
            logger.info(f"Using custom batch_size: {request.batch_size}")
        if request.sequence_length is not None:
            predict_kwargs['sequence_length'] = request.sequence_length
            logger.info(f"Using custom sequence_length: {request.sequence_length}")
        
        result = await prediction_service.predict(**predict_kwargs)
        
        # Save prediction to history for portfolio tracking
        try:
            # Try Supabase first
            from services.supabase_service import get_supabase_service
            from core.supabase_auth import get_user_id_from_token
            supabase_service = get_supabase_service()
            
            if supabase_service.is_enabled() and credentials:
                # Extract user_id from Supabase JWT token
                try:
                    token = credentials.credentials
                    user_id = get_user_id_from_token(token)
                    if user_id:
                        await supabase_service.save_prediction(
                            user_id=user_id,
                            ticker=request.ticker.upper(),
                            model_type=request.model.upper(),
                            prediction_data=result,
                            period=request.period,
                            prediction_days=request.prediction_days
                        )
                        logger.info(f"✅ Saved prediction to Supabase for user {user_id}")
                    else:
                        logger.debug("No user_id found in token, skipping Supabase save")
                except Exception as e:
                    logger.warning(f"Could not save prediction to Supabase: {e}")
            
            # Fallback to file-based history
            from services.prediction_history import get_prediction_history_service
            history_service = get_prediction_history_service()
            history_service.save_prediction({
                "ticker": request.ticker.upper(),
                "model_type": request.model.upper(),
                "period": request.period,
                "prediction_days": request.prediction_days,
                **result
            })
        except Exception as e:
            logger.warning(f"Could not save prediction to history: {e}")
        
        return result
    except Exception as e:
        error_msg = str(e)
        error_traceback = traceback.format_exc()
        logger.error(f"Prediction error: {error_msg}\n{error_traceback}")
        raise HTTPException(status_code=500, detail=error_msg)

@router.post("/compare")
async def compare_models(
    request: ComparisonRequest,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
):
    """Compare LSTM vs RNN models"""
    try:
        result = await prediction_service.compare_models(
            ticker=request.ticker.upper(),
            period=request.period
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/export")
async def export_predictions(
    request: PredictionRequest,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
):
    """Export predictions as CSV"""
    try:
        result = await prediction_service.predict(
            ticker=request.ticker.upper(),
            model_type=request.model.upper(),
            period=request.period,
            prediction_days=request.prediction_days
        )
        
        # Create CSV in memory
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow(["Date", "Actual Price", "Predicted Price", "Type"])
        
        # Write historical data
        if "historical_data" in result:
            hist_data = result["historical_data"]
            for i, date in enumerate(hist_data.get("dates", [])):
                writer.writerow([
                    date,
                    hist_data.get("actual", [])[i] if i < len(hist_data.get("actual", [])) else "",
                    hist_data.get("predicted", [])[i] if i < len(hist_data.get("predicted", [])) else "",
                    "Historical"
                ])
        
        # Write future predictions
        if "future_predictions" in result:
            future_data = result["future_predictions"]
            for i, date in enumerate(future_data.get("dates", [])):
                writer.writerow([
                    date,
                    "",
                    future_data.get("predictions", [])[i] if i < len(future_data.get("predictions", [])) else "",
                    "Future"
                ])
        
        output.seek(0)
        
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename={request.ticker}_predictions.csv"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


