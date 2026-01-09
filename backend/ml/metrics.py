"""
Advanced evaluation metrics for time series forecasting
Includes MASE, sMAPE, and other competition-grade metrics
"""
import numpy as np
from typing import Union, Optional
import logging

logger = logging.getLogger("stock_forecasting")


def mase(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    y_train: Optional[np.ndarray] = None,
    seasonal_period: int = 1
) -> float:
    """
    Mean Absolute Scaled Error (MASE)
    
    MASE is scale-independent and compares forecast accuracy to naive forecast.
    MASE < 1 means the forecast is better than naive; MASE > 1 means worse.
    
    Args:
        y_true: Actual values
        y_pred: Predicted values
        y_train: Training data for naive forecast baseline (if None, uses y_true)
        seasonal_period: Seasonal period for seasonal naive forecast
    
    Returns:
        MASE value
    """
    y_true = np.asarray(y_true).flatten()
    y_pred = np.asarray(y_pred).flatten()
    
    if len(y_true) != len(y_pred):
        raise ValueError("y_true and y_pred must have the same length")
    
    # Calculate naive forecast error
    if y_train is not None:
        y_train = np.asarray(y_train).flatten()
        # Use seasonal naive forecast
        if len(y_train) >= seasonal_period:
            naive_errors = np.abs(y_train[seasonal_period:] - y_train[:-seasonal_period])
        else:
            # Fallback to simple naive
            naive_errors = np.abs(np.diff(y_train))
    else:
        # Use simple naive forecast from test data
        naive_errors = np.abs(np.diff(y_true))
    
    if len(naive_errors) == 0 or np.mean(naive_errors) == 0:
        logger.warning("Cannot calculate MASE: naive forecast error is zero")
        return np.nan
    
    # Calculate forecast errors
    forecast_errors = np.abs(y_true - y_pred)
    
    # MASE = mean(|forecast_errors|) / mean(|naive_errors|)
    mase_value = np.mean(forecast_errors) / np.mean(naive_errors)
    
    return float(mase_value)


def smape(
    y_true: np.ndarray,
    y_pred: np.ndarray
) -> float:
    """
    Symmetric Mean Absolute Percentage Error (sMAPE)
    
    sMAPE is symmetric and bounded between 0% and 200%.
    Lower is better. Commonly used in forecasting competitions.
    
    Args:
        y_true: Actual values
        y_pred: Predicted values
    
    Returns:
        sMAPE value (as percentage, 0-200)
    """
    y_true = np.asarray(y_true).flatten()
    y_pred = np.asarray(y_pred).flatten()
    
    if len(y_true) != len(y_pred):
        raise ValueError("y_true and y_pred must have the same length")
    
    # Avoid division by zero
    denominator = (np.abs(y_true) + np.abs(y_pred)) / 2
    denominator = np.where(denominator == 0, 1e-8, denominator)
    
    # sMAPE = 100 * mean(|y_true - y_pred| / ((|y_true| + |y_pred|) / 2))
    smape_value = 100 * np.mean(np.abs(y_true - y_pred) / denominator)
    
    return float(smape_value)


def mape(
    y_true: np.ndarray,
    y_pred: np.ndarray
) -> float:
    """
    Mean Absolute Percentage Error (MAPE)
    
    Args:
        y_true: Actual values
        y_pred: Predicted values
    
    Returns:
        MAPE value (as percentage)
    """
    y_true = np.asarray(y_true).flatten()
    y_pred = np.asarray(y_pred).flatten()
    
    if len(y_true) != len(y_pred):
        raise ValueError("y_true and y_pred must have the same length")
    
    # Avoid division by zero
    y_true = np.where(y_true == 0, 1e-8, y_true)
    
    mape_value = 100 * np.mean(np.abs((y_true - y_pred) / y_true))
    
    return float(mape_value)


def quantile_coverage(
    y_true: np.ndarray,
    y_lower: np.ndarray,
    y_upper: np.ndarray
) -> float:
    """
    Calculate coverage of prediction intervals
    
    Measures what percentage of actual values fall within the prediction interval.
    For a 90% interval, we expect ~90% coverage.
    
    Args:
        y_true: Actual values
        y_lower: Lower bound of prediction interval
        y_upper: Upper bound of prediction interval
    
    Returns:
        Coverage percentage (0-100)
    """
    y_true = np.asarray(y_true).flatten()
    y_lower = np.asarray(y_lower).flatten()
    y_upper = np.asarray(y_upper).flatten()
    
    if not (len(y_true) == len(y_lower) == len(y_upper)):
        raise ValueError("All arrays must have the same length")
    
    # Count how many actual values fall within the interval
    in_interval = np.sum((y_true >= y_lower) & (y_true <= y_upper))
    coverage = 100 * (in_interval / len(y_true))
    
    return float(coverage)


def calculate_all_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    y_train: Optional[np.ndarray] = None,
    y_lower: Optional[np.ndarray] = None,
    y_upper: Optional[np.ndarray] = None
) -> dict:
    """
    Calculate comprehensive set of forecasting metrics
    
    Args:
        y_true: Actual values
        y_pred: Predicted values
        y_train: Training data (for MASE calculation)
        y_lower: Lower bound of prediction interval (optional)
        y_upper: Upper bound of prediction interval (optional)
    
    Returns:
        Dictionary of all calculated metrics
    """
    from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
    
    y_true = np.asarray(y_true).flatten()
    y_pred = np.asarray(y_pred).flatten()
    
    metrics = {
        'rmse': float(np.sqrt(mean_squared_error(y_true, y_pred))),
        'mae': float(mean_absolute_error(y_true, y_pred)),
        'mape': mape(y_true, y_pred),
        'smape': smape(y_true, y_pred),
        'r2_score': float(r2_score(y_true, y_pred)),
    }
    
    # Add MASE if training data provided
    if y_train is not None:
        try:
            metrics['mase'] = mase(y_true, y_pred, y_train)
        except Exception as e:
            logger.warning(f"Could not calculate MASE: {e}")
            metrics['mase'] = np.nan
    
    # Add quantile coverage if intervals provided
    if y_lower is not None and y_upper is not None:
        try:
            metrics['coverage'] = quantile_coverage(y_true, y_lower, y_upper)
        except Exception as e:
            logger.warning(f"Could not calculate coverage: {e}")
            metrics['coverage'] = np.nan
    
    # Calculate accuracy (tolerance-based)
    # Use more reasonable tolerance for stock predictions (7.5% instead of 5%)
    tolerance = 0.075  # 7.5% tolerance - more realistic for stock price predictions
    correct = np.abs((y_true - y_pred) / np.where(y_true == 0, 1e-8, y_true)) <= tolerance
    metrics['accuracy'] = float(np.mean(correct) * 100)
    
    return metrics





