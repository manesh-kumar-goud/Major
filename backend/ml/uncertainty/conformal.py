"""
Conformal Prediction Implementation for StockNeuro
Distribution-Free Uncertainty Quantification
Based on: "Conformal Prediction" framework
"""
import numpy as np
from typing import Dict, List, Tuple, Optional
import logging

logger = logging.getLogger("stock_forecasting")


class ConformalPrediction:
    """
    Conformal Prediction for uncertainty quantification
    
    Key Features:
    - Distribution-free guarantees
    - Adaptive Conformal Inference (ACI)
    - Risk-aware predictions
    - Coverage guarantees
    """
    
    def __init__(
        self,
        coverage: float = 0.9,
        alpha: Optional[float] = None,
        adaptive: bool = True
    ):
        """
        Initialize Conformal Prediction
        
        Args:
            coverage: Target coverage level (e.g., 0.9 for 90%)
            alpha: Significance level (1 - coverage)
            adaptive: Use Adaptive Conformal Inference
        """
        self.coverage = coverage
        self.alpha = alpha if alpha is not None else 1 - coverage
        self.adaptive = adaptive
        
        self.calibration_scores = []
        self.quantile = None
        self.coverage_history = []
        
        logger.info(f"Initialized Conformal Prediction: coverage={coverage}, adaptive={adaptive}")
    
    def calibrate(
        self,
        predictions: np.ndarray,
        actuals: np.ndarray
    ):
        """
        Calibrate on calibration set
        
        Args:
            predictions: Model predictions
            actuals: Actual values
        """
        # Calculate non-conformity scores
        scores = np.abs(predictions - actuals)
        self.calibration_scores = scores.tolist()
        
        # Calculate quantile for coverage
        quantile_level = (1 + len(scores)) * (1 - self.alpha) / len(scores)
        quantile_level = min(quantile_level, 1.0)
        
        self.quantile = np.quantile(scores, quantile_level)
        
        logger.info(f"Calibrated: quantile={self.quantile:.4f}, coverage target={self.coverage}")
    
    def predict_with_intervals(
        self,
        predictions: np.ndarray,
        adaptive_alpha: Optional[float] = None
    ) -> Dict[str, np.ndarray]:
        """
        Generate prediction intervals
        
        Args:
            predictions: Point predictions
            adaptive_alpha: Adaptive alpha (for ACI)
        
        Returns:
            Dictionary with 'predictions', 'lower', 'upper', 'interval_width'
        """
        if self.quantile is None:
            raise ValueError("Model must be calibrated before prediction")
        
        alpha = adaptive_alpha if adaptive_alpha is not None else self.alpha
        
        # Calculate interval width
        if self.adaptive and len(self.coverage_history) > 0:
            # Adaptive: adjust based on recent coverage
            recent_coverage = np.mean(self.coverage_history[-10:]) if len(self.coverage_history) >= 10 else self.coverage
            if recent_coverage < self.coverage:
                # Increase interval width
                width_multiplier = 1.1
            elif recent_coverage > self.coverage:
                # Decrease interval width
                width_multiplier = 0.95
            else:
                width_multiplier = 1.0
            
            interval_width = self.quantile * width_multiplier
        else:
            interval_width = self.quantile
        
        # Generate intervals
        lower = predictions - interval_width
        upper = predictions + interval_width
        
        return {
            "predictions": predictions,
            "lower": lower,
            "upper": upper,
            "interval_width": np.full_like(predictions, interval_width),
            "coverage": self.coverage,
            "alpha": alpha
        }
    
    def update_coverage(
        self,
        predictions: np.ndarray,
        actuals: np.ndarray
    ):
        """
        Update coverage history (for ACI)
        
        Args:
            predictions: Model predictions
            actuals: Actual values
        """
        if not self.adaptive:
            return
        
        # Calculate coverage
        intervals = self.predict_with_intervals(predictions)
        covered = (actuals >= intervals["lower"]) & (actuals <= intervals["upper"])
        coverage = np.mean(covered)
        
        self.coverage_history.append(coverage)
        
        # Keep only recent history
        if len(self.coverage_history) > 100:
            self.coverage_history = self.coverage_history[-100:]
        
        logger.debug(f"Updated coverage: {coverage:.4f}, target: {self.coverage}")
    
    def get_coverage_stats(self) -> Dict[str, float]:
        """Get coverage statistics"""
        if not self.coverage_history:
            return {
                "current_coverage": self.coverage,
                "average_coverage": self.coverage,
                "coverage_history_length": 0
            }
        
        return {
            "current_coverage": self.coverage_history[-1] if self.coverage_history else self.coverage,
            "average_coverage": np.mean(self.coverage_history),
            "coverage_history_length": len(self.coverage_history),
            "target_coverage": self.coverage
        }


class AdaptiveConformalInference(ConformalPrediction):
    """
    Adaptive Conformal Inference (ACI)
    Dynamically adjusts intervals based on recent performance
    """
    
    def __init__(self, coverage: float = 0.9, learning_rate: float = 0.01):
        """
        Initialize ACI
        
        Args:
            coverage: Target coverage level
            learning_rate: Learning rate for alpha adjustment
        """
        super().__init__(coverage=coverage, adaptive=True)
        self.learning_rate = learning_rate
        self.current_alpha = self.alpha
    
    def update_alpha(self, recent_coverage: float):
        """
        Update alpha based on recent coverage
        
        Args:
            recent_coverage: Recent empirical coverage
        """
        error = recent_coverage - self.coverage
        self.current_alpha += self.learning_rate * error
        self.current_alpha = np.clip(self.current_alpha, 0.01, 0.5)
        
        logger.debug(f"Updated alpha: {self.current_alpha:.4f}, error: {error:.4f}")


def wrap_predictions_with_intervals(
    predictions: np.ndarray,
    calibration_predictions: np.ndarray,
    calibration_actuals: np.ndarray,
    coverage: float = 0.9
) -> Dict[str, np.ndarray]:
    """
    Convenience function to wrap predictions with conformal intervals
    
    Args:
        predictions: Point predictions to wrap
        calibration_predictions: Predictions on calibration set
        calibration_actuals: Actuals on calibration set
        coverage: Target coverage level
    
    Returns:
        Dictionary with prediction intervals
    """
    cp = ConformalPrediction(coverage=coverage)
    cp.calibrate(calibration_predictions, calibration_actuals)
    return cp.predict_with_intervals(predictions)














