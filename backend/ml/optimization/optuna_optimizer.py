"""
Optuna-based Hyperparameter Optimization for StockNeuro
Implements Bayesian optimization with TPE (Tree-structured Parzen Estimator)
"""
import numpy as np
from typing import Dict, Callable, Optional, Any
import logging

try:
    import optuna
    from optuna.samplers import TPESampler
    from optuna.pruners import MedianPruner
    OPTUNA_AVAILABLE = True
except ImportError:
    OPTUNA_AVAILABLE = False
    optuna = None
    TPESampler = None
    MedianPruner = None

from core.config import settings

logger = logging.getLogger("stock_forecasting")


class OptunaOptimizer:
    """
    Hyperparameter optimization using Optuna
    """
    
    def __init__(
        self,
        n_trials: int = 20,
        timeout: Optional[float] = None,
        direction: str = "minimize"
    ):
        """
        Initialize Optuna optimizer
        
        Args:
            n_trials: Number of optimization trials
            timeout: Maximum time in seconds (None for no limit)
            direction: "minimize" or "maximize" the objective
        """
        if not OPTUNA_AVAILABLE:
            raise ImportError(
                "Optuna is not installed. Install with: pip install optuna"
            )
        
        self.n_trials = n_trials
        self.timeout = timeout
        self.direction = direction
        
        # Create study
        self.study = optuna.create_study(
            direction=direction,
            sampler=TPESampler(seed=42),
            pruner=MedianPruner(n_startup_trials=5, n_warmup_steps=10)
        )
    
    def optimize(
        self,
        objective_fn: Callable,
        search_space: Dict[str, Dict[str, Any]],
        verbose: bool = True
    ) -> Dict:
        """
        Run hyperparameter optimization
        
        Args:
            objective_fn: Function that takes trial and returns metric to optimize
            search_space: Dictionary defining search space
                Example: {
                    "epochs": {"type": "int", "low": 10, "high": 100},
                    "batch_size": {"type": "int", "low": 16, "high": 128, "log": True},
                    "learning_rate": {"type": "float", "low": 1e-5, "high": 1e-2, "log": True},
                    "units": {"type": "categorical", "choices": [32, 50, 64, 100]}
                }
            verbose: Print optimization progress
        
        Returns:
            Dictionary with best parameters and study results
        """
        def objective(trial):
            # Suggest hyperparameters based on search space
            params = {}
            for param_name, param_config in search_space.items():
                param_type = param_config.get("type", "float")
                
                if param_type == "int":
                    params[param_name] = trial.suggest_int(
                        param_name,
                        param_config["low"],
                        param_config["high"],
                        log=param_config.get("log", False)
                    )
                elif param_type == "float":
                    params[param_name] = trial.suggest_float(
                        param_name,
                        param_config["low"],
                        param_config["high"],
                        log=param_config.get("log", False)
                    )
                elif param_type == "categorical":
                    params[param_name] = trial.suggest_categorical(
                        param_name,
                        param_config["choices"]
                    )
                else:
                    raise ValueError(f"Unknown parameter type: {param_type}")
            
            # Call objective function
            try:
                result = objective_fn(trial, params)
                return result
            except Exception as e:
                logger.error(f"Error in trial: {e}")
                # Return worst possible value
                return float('inf') if self.direction == "minimize" else float('-inf')
        
        # Run optimization
        try:
            self.study.optimize(
                objective,
                n_trials=self.n_trials,
                timeout=self.timeout,
                show_progress_bar=verbose
            )
        except KeyboardInterrupt:
            logger.info("Optimization interrupted by user")
        
        # Get best results
        best_params = self.study.best_params
        best_value = self.study.best_value
        
        results = {
            "best_params": best_params,
            "best_value": best_value,
            "n_trials": len(self.study.trials),
            "study": self.study
        }
        
        if verbose:
            logger.info(f"Optimization complete:")
            logger.info(f"  Best value: {best_value:.6f}")
            logger.info(f"  Best params: {best_params}")
            logger.info(f"  Trials: {len(self.study.trials)}")
        
        return results
    
    def get_best_params(self) -> Dict:
        """Get best parameters from optimization"""
        return self.study.best_params
    
    def get_trial_dataframe(self):
        """Get pandas DataFrame of all trials"""
        if OPTUNA_AVAILABLE:
            try:
                return self.study.trials_dataframe()
            except Exception:
                return None
        return None


def optimize_model_hyperparameters(
    model_class: type,
    X_train: np.ndarray,
    y_train: np.ndarray,
    X_val: np.ndarray,
    y_val: np.ndarray,
    search_space: Dict,
    n_trials: int = 20,
    metric: str = "rmse"
) -> Dict:
    """
    Optimize hyperparameters for a model
    
    Args:
        model_class: Model class to optimize
        X_train: Training features
        y_train: Training targets
        X_val: Validation features
        y_val: Validation targets
        search_space: Hyperparameter search space
        n_trials: Number of optimization trials
        metric: Metric to optimize ("rmse", "mae", "mase", "smape")
    
    Returns:
        Dictionary with best parameters and results
    """
    optimizer = OptunaOptimizer(n_trials=n_trials)
    
    def objective(trial, params):
        # Create model with suggested parameters
        model = model_class(**params)
        
        # Train model
        epochs = params.get("epochs", 20)
        batch_size = params.get("batch_size", 32)
        
        model.train(X_train, y_train, epochs=epochs, batch_size=batch_size, verbose=0)
        
        # Make predictions
        predictions = model.predict(X_val)
        
        # Calculate metric
        from ml.metrics import calculate_all_metrics
        metrics = calculate_all_metrics(y_val, predictions, y_train=y_train)
        
        return metrics.get(metric, float('inf'))
    
    return optimizer.optimize(objective, search_space)














