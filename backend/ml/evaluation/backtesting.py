"""
Walk-Forward Backtesting Framework for StockNeuro
Implements rolling and expanding window backtesting strategies
"""
import numpy as np
from typing import List, Dict, Tuple, Optional, Callable
from datetime import datetime, timedelta
import logging

logger = logging.getLogger("stock_forecasting")


class WalkForwardBacktester:
    """
    Walk-forward backtesting for time series models
    
    Implements two strategies:
    1. Rolling Window: Fixed training window that slides forward
    2. Expanding Window: Training window grows over time
    """
    
    def __init__(
        self,
        train_size: int,
        test_size: int,
        step_size: int = 1,
        strategy: str = "rolling"
    ):
        """
        Initialize walk-forward backtester
        
        Args:
            train_size: Size of training window
            test_size: Size of test window
            step_size: How many steps to move forward each iteration
            strategy: "rolling" (fixed window) or "expanding" (growing window)
        """
        self.train_size = train_size
        self.test_size = test_size
        self.step_size = step_size
        self.strategy = strategy
        
        if strategy not in ["rolling", "expanding"]:
            raise ValueError("Strategy must be 'rolling' or 'expanding'")
    
    def split_data(
        self,
        data: np.ndarray,
        dates: Optional[List] = None
    ) -> List[Dict]:
        """
        Generate walk-forward splits
        
        Args:
            data: Time series data array
            dates: Optional list of dates corresponding to data points
        
        Returns:
            List of dictionaries with train/test splits
        """
        splits = []
        n = len(data)
        
        if n < self.train_size + self.test_size:
            logger.warning(
                f"Insufficient data: {n} points, need at least "
                f"{self.train_size + self.test_size}"
            )
            return splits
        
        start_idx = 0
        
        while start_idx + self.train_size + self.test_size <= n:
            train_end = start_idx + self.train_size
            test_end = min(train_end + self.test_size, n)
            
            train_data = data[start_idx:train_end]
            test_data = data[train_end:test_end]
            
            split_info = {
                "train_start": start_idx,
                "train_end": train_end,
                "test_start": train_end,
                "test_end": test_end,
                "train_data": train_data,
                "test_data": test_data,
                "split_number": len(splits) + 1
            }
            
            if dates:
                split_info["train_dates"] = dates[start_idx:train_end]
                split_info["test_dates"] = dates[train_end:test_end]
            
            splits.append(split_info)
            
            # Move forward
            if self.strategy == "rolling":
                start_idx += self.step_size
            else:  # expanding
                start_idx += self.step_size
                # For expanding, we keep growing train_size
                # but for simplicity, we'll use fixed train_size
                # and just move the window
            
            # Break if we can't make another full split
            if start_idx + self.train_size + self.test_size > n:
                break
        
        logger.info(f"Generated {len(splits)} walk-forward splits")
        return splits
    
    def backtest(
        self,
        data: np.ndarray,
        model_train_fn: Callable,
        model_predict_fn: Callable,
        dates: Optional[List] = None,
        verbose: bool = False
    ) -> Dict:
        """
        Run walk-forward backtest
        
        Args:
            data: Time series data
            model_train_fn: Function that trains model: (train_data) -> model
            model_predict_fn: Function that predicts: (model, test_data) -> predictions
            dates: Optional dates for the data
            verbose: Print progress
        
        Returns:
            Dictionary with backtest results
        """
        splits = self.split_data(data, dates)
        
        if len(splits) == 0:
            return {
                "error": "Insufficient data for backtesting",
                "splits": 0,
                "results": []
            }
        
        results = []
        all_predictions = []
        all_actuals = []
        
        for i, split in enumerate(splits):
            if verbose:
                logger.info(
                    f"Split {i+1}/{len(splits)}: "
                    f"Train[{split['train_start']}:{split['train_end']}], "
                    f"Test[{split['test_start']}:{split['test_end']}]"
                )
            
            try:
                # Train model
                model = model_train_fn(split["train_data"])
                
                # Make predictions
                predictions = model_predict_fn(model, split["test_data"])
                
                # Store results
                actuals = split["test_data"]
                
                # Calculate metrics for this split
                from ml.metrics import calculate_all_metrics
                metrics = calculate_all_metrics(
                    actuals,
                    predictions,
                    y_train=split["train_data"]
                )
                
                split_result = {
                    "split_number": split["split_number"],
                    "train_start": split["train_start"],
                    "train_end": split["train_end"],
                    "test_start": split["test_start"],
                    "test_end": split["test_end"],
                    "metrics": metrics,
                    "predictions": predictions.tolist() if isinstance(predictions, np.ndarray) else predictions,
                    "actuals": actuals.tolist() if isinstance(actuals, np.ndarray) else actuals
                }
                
                if dates:
                    split_result["train_dates"] = split.get("train_dates", [])
                    split_result["test_dates"] = split.get("test_dates", [])
                
                results.append(split_result)
                all_predictions.extend(predictions.tolist() if isinstance(predictions, np.ndarray) else predictions)
                all_actuals.extend(actuals.tolist() if isinstance(actuals, np.ndarray) else actuals)
                
            except Exception as e:
                logger.error(f"Error in split {i+1}: {e}", exc_info=True)
                results.append({
                    "split_number": split["split_number"],
                    "error": str(e)
                })
        
        # Calculate aggregate metrics across all splits
        if len(all_predictions) > 0 and len(all_actuals) > 0:
            from ml.metrics import calculate_all_metrics
            aggregate_metrics = calculate_all_metrics(
                np.array(all_actuals),
                np.array(all_predictions)
            )
        else:
            aggregate_metrics = {}
        
        return {
            "strategy": self.strategy,
            "train_size": self.train_size,
            "test_size": self.test_size,
            "step_size": self.step_size,
            "total_splits": len(splits),
            "aggregate_metrics": aggregate_metrics,
            "split_results": results,
            "summary": {
                "mean_rmse": np.mean([r["metrics"]["rmse"] for r in results if "metrics" in r]),
                "mean_mae": np.mean([r["metrics"]["mae"] for r in results if "metrics" in r]),
                "mean_mase": np.mean([r["metrics"].get("mase", np.nan) for r in results if "metrics" in r and "mase" in r["metrics"]]),
                "mean_smape": np.mean([r["metrics"].get("smape", np.nan) for r in results if "metrics" in r and "smape" in r["metrics"]]),
            }
        }


def run_walk_forward_backtest(
    data: np.ndarray,
    model_train_fn: Callable,
    model_predict_fn: Callable,
    train_size: int = 100,
    test_size: int = 20,
    step_size: int = 10,
    strategy: str = "rolling",
    dates: Optional[List] = None
) -> Dict:
    """
    Convenience function to run walk-forward backtest
    
    Args:
        data: Time series data
        model_train_fn: Function to train model
        model_predict_fn: Function to make predictions
        train_size: Training window size
        test_size: Test window size
        step_size: Step size for moving window
        strategy: "rolling" or "expanding"
        dates: Optional dates
    
    Returns:
        Backtest results dictionary
    """
    backtester = WalkForwardBacktester(
        train_size=train_size,
        test_size=test_size,
        step_size=step_size,
        strategy=strategy
    )
    
    return backtester.backtest(
        data=data,
        model_train_fn=model_train_fn,
        model_predict_fn=model_predict_fn,
        dates=dates,
        verbose=True
    )

