"""
Performance Benchmark Script
Compares PatchTST vs LSTM vs RNN on multiple assets
"""
import numpy as np
import pandas as pd
from typing import Dict, List
import logging
from datetime import datetime

from ml.models import LSTMModel, RNNModel
from ml.utils import preprocess_data, create_sequences, inverse_transform
from ml.metrics import calculate_advanced_metrics

logger = logging.getLogger("stock_forecasting")


class ModelBenchmark:
    """Benchmark different models on stock prediction"""
    
    def __init__(self, sequence_length: int = 60):
        self.sequence_length = sequence_length
        self.results = []
    
    def benchmark_model(
        self,
        model,
        model_name: str,
        close_prices: np.ndarray,
        train_split: float = 0.8
    ) -> Dict[str, float]:
        """
        Benchmark a single model
        
        Args:
            model: Model instance (must have train, predict, evaluate methods)
            model_name: Name of the model
            close_prices: Historical close prices
            train_split: Train/test split ratio
        
        Returns:
            Dictionary of metrics
        """
        logger.info(f"Benchmarking {model_name}...")
        
        try:
            # Preprocess data
            scaled_data, scaler = preprocess_data(close_prices)
            
            # Create sequences
            X, y = create_sequences(scaled_data, self.sequence_length)
            
            if len(X) == 0:
                return {"error": "Insufficient data for sequences"}
            
            # Split data
            split_idx = int(len(X) * train_split)
            X_train, X_test = X[:split_idx], X[split_idx:]
            y_train, y_test = y[:split_idx], y[split_idx:]
            
            # Train model
            model.train(X_train, y_train, epochs=20, batch_size=32, verbose=0)
            
            # Make predictions
            predictions = model.predict(X_test)
            
            # Inverse transform
            predictions_rescaled = inverse_transform(predictions, scaler)
            actual_rescaled = inverse_transform(y_test, scaler)
            
            # Calculate metrics
            metrics = model.evaluate(actual_rescaled, predictions_rescaled, y_train=y_train)
            metrics['model_name'] = model_name
            metrics['train_samples'] = len(X_train)
            metrics['test_samples'] = len(X_test)
            
            logger.info(f"{model_name} - RMSE: {metrics.get('rmse', 'N/A'):.4f}, MAE: {metrics.get('mae', 'N/A'):.4f}")
            
            return metrics
            
        except Exception as e:
            logger.error(f"Error benchmarking {model_name}: {e}", exc_info=True)
            return {"error": str(e), "model_name": model_name}
    
    def run_benchmark(
        self,
        ticker: str,
        close_prices: np.ndarray
    ) -> Dict[str, Dict]:
        """
        Run benchmark on all models
        
        Args:
            ticker: Stock ticker symbol
            close_prices: Historical close prices
        
        Returns:
            Dictionary with results for each model
        """
        logger.info(f"Running benchmark for {ticker} ({len(close_prices)} data points)")
        
        results = {}
        
        # Benchmark LSTM
        try:
            lstm_model = LSTMModel(units=50)
            results['LSTM'] = self.benchmark_model(lstm_model, 'LSTM', close_prices)
        except Exception as e:
            logger.error(f"LSTM benchmark failed: {e}")
            results['LSTM'] = {"error": str(e)}
        
        # Benchmark RNN
        try:
            rnn_model = RNNModel(units=50)
            results['RNN'] = self.benchmark_model(rnn_model, 'RNN', close_prices)
        except Exception as e:
            logger.error(f"RNN benchmark failed: {e}")
            results['RNN'] = {"error": str(e)}
        
        # Benchmark PatchTST (if available)
        try:
            from ml.models.patchtst import PatchTSTModel
            patchtst_model = PatchTSTModel(
                context_window=self.sequence_length,
                patch_len=16,
                stride=8,
                revin=True
            )
            results['PatchTST'] = self.benchmark_model(patchtst_model, 'PatchTST', close_prices)
        except ImportError:
            logger.warning("PatchTST not available, skipping")
            results['PatchTST'] = {"error": "PatchTST not available"}
        except Exception as e:
            logger.error(f"PatchTST benchmark failed: {e}")
            results['PatchTST'] = {"error": str(e)}
        
        # Add metadata
        results['ticker'] = ticker
        results['data_points'] = len(close_prices)
        results['timestamp'] = datetime.now().isoformat()
        
        self.results.append(results)
        return results
    
    def generate_report(self) -> pd.DataFrame:
        """Generate benchmark report as DataFrame"""
        if not self.results:
            return pd.DataFrame()
        
        rows = []
        for result in self.results:
            ticker = result.get('ticker', 'Unknown')
            for model_name in ['LSTM', 'RNN', 'PatchTST']:
                if model_name in result and 'error' not in result[model_name]:
                    metrics = result[model_name]
                    rows.append({
                        'Ticker': ticker,
                        'Model': model_name,
                        'RMSE': metrics.get('rmse', np.nan),
                        'MAE': metrics.get('mae', np.nan),
                        'MASE': metrics.get('mase', np.nan),
                        'sMAPE': metrics.get('smape', np.nan),
                        'R²': metrics.get('r2_score', np.nan),
                        'Accuracy': metrics.get('accuracy', np.nan),
                        'Train Samples': metrics.get('train_samples', np.nan),
                        'Test Samples': metrics.get('test_samples', np.nan)
                    })
        
        df = pd.DataFrame(rows)
        return df
    
    def save_report(self, filename: str = None):
        """Save benchmark report to CSV"""
        if filename is None:
            filename = f"benchmark_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        
        df = self.generate_report()
        if not df.empty:
            df.to_csv(filename, index=False)
            logger.info(f"Benchmark report saved to {filename}")
        else:
            logger.warning("No results to save")


def run_benchmark_suite(
    test_data: Dict[str, np.ndarray],
    sequence_length: int = 60
) -> ModelBenchmark:
    """
    Run benchmark suite on multiple tickers
    
    Args:
        test_data: Dictionary of {ticker: close_prices}
        sequence_length: Sequence length for models
    
    Returns:
        ModelBenchmark instance with results
    """
    benchmark = ModelBenchmark(sequence_length=sequence_length)
    
    for ticker, prices in test_data.items():
        benchmark.run_benchmark(ticker, prices)
    
    # Generate and save report
    report = benchmark.generate_report()
    if not report.empty:
        print("\n" + "="*80)
        print("BENCHMARK RESULTS")
        print("="*80)
        print(report.to_string(index=False))
        print("="*80)
        
        # Calculate averages
        if len(report) > 0:
            print("\nAVERAGE METRICS BY MODEL:")
            print("-"*80)
            avg_metrics = report.groupby('Model').agg({
                'RMSE': 'mean',
                'MAE': 'mean',
                'MASE': 'mean',
                'sMAPE': 'mean',
                'R²': 'mean',
                'Accuracy': 'mean'
            }).round(4)
            print(avg_metrics.to_string())
            print("-"*80)
    
    benchmark.save_report()
    return benchmark


if __name__ == "__main__":
    # Example usage
    # Create dummy test data
    np.random.seed(42)
    test_data = {
        'AAPL': np.cumsum(np.random.randn(500)) + 150,
        'TSLA': np.cumsum(np.random.randn(500)) + 200,
        'MSFT': np.cumsum(np.random.randn(500)) + 300
    }
    
    benchmark = run_benchmark_suite(test_data, sequence_length=60)





