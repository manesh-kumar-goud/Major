"""
Auto-Learning "Brain" System for StockNeuro
Uses Optuna for hyperparameter optimization and learns from past runs
"""
import logging
from typing import Dict, Any, Optional, List
import numpy as np

try:
    import optuna
    from optuna.samplers import TPESampler
    from optuna.pruners import MedianPruner
    OPTUNA_AVAILABLE = True
except ImportError:
    OPTUNA_AVAILABLE = False
    optuna = None

try:
    import mlflow
    MLFLOW_AVAILABLE = True
except ImportError:
    MLFLOW_AVAILABLE = False
    mlflow = None

from core.config import settings
from ml.metrics import calculate_all_metrics

logger = logging.getLogger("stock_forecasting")


class AutoLearningBrain:
    """
    Auto-learning system that:
    1. Learns from past training runs (via MLflow)
    2. Uses Optuna to optimize hyperparameters
    3. Proposes optimal settings for new training runs
    """
    
    def __init__(self):
        self.optuna_enabled = OPTUNA_AVAILABLE and settings.OPTUNA_ENABLED
        self.mlflow_enabled = MLFLOW_AVAILABLE and settings.MLFLOW_ENABLED
        
        if self.optuna_enabled:
            # Initialize Optuna study storage
            study_name = "StockNeuro_Hyperopt"
            storage_url = getattr(settings, 'OPTUNA_DB_URL', 'sqlite:///optuna.db')
            
            try:
                self.study = optuna.create_study(
                    study_name=study_name,
                    storage=storage_url,
                    load_if_exists=True,
                    direction='minimize',  # Minimize RMSE
                    sampler=TPESampler(seed=42),
                    pruner=MedianPruner(n_startup_trials=5, n_warmup_steps=10)
                )
                logger.info(f"Optuna study '{study_name}' initialized")
            except Exception as e:
                logger.warning(f"Could not initialize Optuna study: {e}")
                self.study = None
        else:
            self.study = None
            logger.info("Optuna not available or disabled")
    
    def suggest_hyperparameters(
        self,
        model_type: str,
        data_size: int,
        previous_runs: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Suggest optimal hyperparameters based on:
        - Historical runs (from MLflow)
        - Optuna optimization
        - Data characteristics
        
        Args:
            model_type: "LSTM" or "RNN"
            data_size: Number of training samples
            previous_runs: List of previous run results (optional)
        
        Returns:
            Dictionary of suggested hyperparameters
        """
        # Base suggestions
        suggestions = {
            "units": 50,
            "epochs": 20,
            "batch_size": 32,
            "learning_rate": 0.001,
            "dropout": 0.2
        }
        
        # Adjust based on data size
        if data_size < 100:
            suggestions["epochs"] = 10
            suggestions["batch_size"] = 16
        elif data_size > 1000:
            suggestions["epochs"] = 30
            suggestions["batch_size"] = 64
        
        # Use Optuna if available
        if self.optuna_enabled and self.study:
            try:
                # Create a trial to get suggestions
                trial = self.study.ask()
                
                # Suggest hyperparameters
                suggestions["units"] = trial.suggest_int("units", 32, 128, step=16)
                suggestions["epochs"] = trial.suggest_int("epochs", 10, 50, step=5)
                suggestions["batch_size"] = trial.suggest_int("batch_size", 16, 128, step=16)
                suggestions["learning_rate"] = trial.suggest_float("learning_rate", 1e-4, 1e-2, log=True)
                suggestions["dropout"] = trial.suggest_float("dropout", 0.0, 0.5)
                
                logger.info(f"Optuna suggested hyperparameters for {model_type}: {suggestions}")
            except Exception as e:
                logger.warning(f"Optuna suggestion failed: {e}, using defaults")
        
        # Learn from previous runs if available
        if previous_runs and self.mlflow_enabled:
            try:
                best_run = self._get_best_previous_run(model_type, previous_runs)
                if best_run:
                    # Blend best previous with current suggestions
                    for key in suggestions:
                        if key in best_run.get("params", {}):
                            # Weighted average: 70% best previous, 30% current suggestion
                            suggestions[key] = 0.7 * best_run["params"][key] + 0.3 * suggestions[key]
                    logger.info(f"Blended suggestions with best previous run for {model_type}")
            except Exception as e:
                logger.warning(f"Could not learn from previous runs: {e}")
        
        return suggestions
    
    def _get_best_previous_run(
        self,
        model_type: str,
        previous_runs: List[Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        """Get the best previous run based on RMSE"""
        if not previous_runs:
            return None
        
        best_run = None
        best_rmse = float('inf')
        
        for run in previous_runs:
            if run.get("model_type") == model_type:
                rmse = run.get("metrics", {}).get("rmse", float('inf'))
                if rmse < best_rmse:
                    best_rmse = rmse
                    best_run = run
        
        return best_run
    
    def report_trial_result(
        self,
        trial_number: int,
        metrics: Dict[str, float],
        params: Dict[str, Any],
        model_type: str
    ):
        """
        Report trial results to Optuna for learning
        
        Args:
            trial_number: Trial number
            metrics: Dictionary of metrics (must include 'rmse')
            params: Dictionary of hyperparameters used
            model_type: "LSTM" or "RNN"
        """
        if not self.optuna_enabled or not self.study:
            return
        
        try:
            # Get the trial
            trial = self.study.trials[trial_number] if trial_number < len(self.study.trials) else None
            
            if trial:
                # Report the objective value (RMSE)
                rmse = metrics.get("rmse", float('inf'))
                self.study.tell(trial, rmse)
                logger.info(f"Reported trial {trial_number} result: RMSE={rmse}")
        except Exception as e:
            logger.warning(f"Could not report trial result: {e}")
    
    def get_best_hyperparameters(self, model_type: str) -> Optional[Dict[str, Any]]:
        """
        Get best hyperparameters from Optuna study
        
        Args:
            model_type: "LSTM" or "RNN"
        
        Returns:
            Dictionary of best hyperparameters or None
        """
        if not self.optuna_enabled or not self.study:
            return None
        
        try:
            if len(self.study.trials) == 0:
                return None
            
            best_trial = self.study.best_trial
            return best_trial.params
        except Exception as e:
            logger.warning(f"Could not get best hyperparameters: {e}")
            return None
    
    def optimize_hyperparameters(
        self,
        objective_func,
        n_trials: int = None,
        timeout: int = None
    ) -> Dict[str, Any]:
        """
        Run Optuna optimization
        
        Args:
            objective_func: Function that takes a trial and returns a metric to minimize
            n_trials: Number of trials (defaults to settings.OPTUNA_N_TRIALS)
            timeout: Timeout in seconds
        
        Returns:
            Best hyperparameters found
        """
        if not self.optuna_enabled or not self.study:
            logger.warning("Optuna not available for optimization")
            return {}
        
        n_trials = n_trials or settings.OPTUNA_N_TRIALS
        
        try:
            self.study.optimize(
                objective_func,
                n_trials=n_trials,
                timeout=timeout,
                show_progress_bar=True
            )
            
            return self.study.best_params
        except Exception as e:
            logger.error(f"Optuna optimization failed: {e}")
            return {}


# Global brain instance
_brain_instance: Optional[AutoLearningBrain] = None

def get_brain() -> AutoLearningBrain:
    """Get global auto-learning brain instance"""
    global _brain_instance
    if _brain_instance is None:
        _brain_instance = AutoLearningBrain()
    return _brain_instance





