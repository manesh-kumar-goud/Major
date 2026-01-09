"""
FinSrag: Financial Retrieval-Augmented Generation
Historical Analogue Retrieval for Stock Forecasting
"""
import numpy as np
from typing import Dict, List, Tuple, Optional
import logging
from datetime import datetime, timedelta

logger = logging.getLogger("stock_forecasting")


class FinSragRetriever:
    """
    Financial RAG Retriever
    Retrieves historically similar market conditions for forecasting
    """
    
    def __init__(
        self,
        similarity_threshold: float = 0.7,
        max_results: int = 5
    ):
        """
        Initialize FinSrag Retriever
        
        Args:
            similarity_threshold: Minimum similarity score (0-1)
            max_results: Maximum number of analogues to retrieve
        """
        self.similarity_threshold = similarity_threshold
        self.max_results = max_results
        self.historical_segments = []
        
        logger.info(f"Initialized FinSrag Retriever: threshold={similarity_threshold}")
    
    def add_historical_segment(
        self,
        data: np.ndarray,
        metadata: Dict[str, any]
    ):
        """
        Add historical segment to database
        
        Args:
            data: Time series segment
            metadata: Metadata (ticker, date range, market conditions, etc.)
        """
        segment = {
            "data": data,
            "metadata": metadata,
            "features": self._extract_features(data)
        }
        self.historical_segments.append(segment)
        
        logger.debug(f"Added historical segment: {metadata.get('ticker', 'Unknown')}")
    
    def _extract_features(self, data: np.ndarray) -> Dict[str, float]:
        """Extract features for similarity matching"""
        if len(data) < 2:
            return {}
        
        returns = np.diff(data) / data[:-1]
        
        return {
            "mean": np.mean(data),
            "std": np.std(data),
            "volatility": np.std(returns),
            "trend": (data[-1] - data[0]) / data[0],
            "max_drawdown": self._calculate_max_drawdown(data),
            "skewness": self._calculate_skewness(returns),
            "kurtosis": self._calculate_kurtosis(returns)
        }
    
    def _calculate_max_drawdown(self, data: np.ndarray) -> float:
        """Calculate maximum drawdown"""
        peak = np.maximum.accumulate(data)
        drawdown = (data - peak) / peak
        return abs(np.min(drawdown))
    
    def _calculate_skewness(self, returns: np.ndarray) -> float:
        """Calculate skewness"""
        if len(returns) < 3:
            return 0.0
        mean = np.mean(returns)
        std = np.std(returns) + 1e-8
        return np.mean(((returns - mean) / std) ** 3)
    
    def _calculate_kurtosis(self, returns: np.ndarray) -> float:
        """Calculate kurtosis"""
        if len(returns) < 4:
            return 0.0
        mean = np.mean(returns)
        std = np.std(returns) + 1e-8
        return np.mean(((returns - mean) / std) ** 4) - 3
    
    def retrieve_analogues(
        self,
        query_data: np.ndarray,
        query_metadata: Optional[Dict[str, any]] = None
    ) -> List[Dict[str, any]]:
        """
        Retrieve historically similar segments
        
        Args:
            query_data: Current market segment to match
            query_metadata: Optional metadata for filtering
        
        Returns:
            List of similar historical segments with similarity scores
        """
        if len(self.historical_segments) == 0:
            logger.warning("No historical segments available")
            return []
        
        query_features = self._extract_features(query_data)
        
        similarities = []
        for segment in self.historical_segments:
            similarity = self._calculate_similarity(query_features, segment["features"])
            
            if similarity >= self.similarity_threshold:
                similarities.append({
                    "segment": segment,
                    "similarity": similarity,
                    "metadata": segment["metadata"]
                })
        
        # Sort by similarity (descending)
        similarities.sort(key=lambda x: x["similarity"], reverse=True)
        
        # Return top results
        results = similarities[:self.max_results]
        
        logger.info(f"Retrieved {len(results)} analogues (similarity >= {self.similarity_threshold})")
        return results
    
    def _calculate_similarity(
        self,
        features1: Dict[str, float],
        features2: Dict[str, float]
    ) -> float:
        """Calculate similarity between feature sets"""
        if not features1 or not features2:
            return 0.0
        
        # Normalize features and calculate cosine similarity
        keys = set(features1.keys()) & set(features2.keys())
        if not keys:
            return 0.0
        
        vec1 = np.array([features1[k] for k in keys])
        vec2 = np.array([features2[k] for k in keys])
        
        # Normalize
        norm1 = np.linalg.norm(vec1) + 1e-8
        norm2 = np.linalg.norm(vec2) + 1e-8
        
        similarity = np.dot(vec1 / norm1, vec2 / norm2)
        
        return float(similarity)
    
    def get_analogue_summary(self, analogues: List[Dict[str, any]]) -> Dict[str, any]:
        """
        Generate summary of retrieved analogues
        
        Args:
            analogues: List of analogue segments
        
        Returns:
            Summary dictionary
        """
        if not analogues:
            return {
                "count": 0,
                "average_similarity": 0.0,
                "periods": [],
                "tickers": []
            }
        
        similarities = [a["similarity"] for a in analogues]
        tickers = [a["metadata"].get("ticker", "Unknown") for a in analogues]
        periods = [a["metadata"].get("period", "Unknown") for a in analogues]
        
        return {
            "count": len(analogues),
            "average_similarity": np.mean(similarities),
            "max_similarity": np.max(similarities),
            "min_similarity": np.min(similarities),
            "periods": list(set(periods)),
            "tickers": list(set(tickers)),
            "top_analogue": {
                "ticker": tickers[0] if tickers else "Unknown",
                "similarity": similarities[0] if similarities else 0.0,
                "period": periods[0] if periods else "Unknown"
            }
        }


class FinSragForecaster:
    """
    FinSrag-based Forecaster
    Uses historical analogues to guide predictions
    """
    
    def __init__(self, retriever: FinSragRetriever):
        """
        Initialize FinSrag Forecaster
        
        Args:
            retriever: FinSrag Retriever instance
        """
        self.retriever = retriever
    
    def forecast_with_analogues(
        self,
        current_data: np.ndarray,
        base_predictions: np.ndarray,
        horizon: int
    ) -> Dict[str, any]:
        """
        Generate forecast using historical analogues
        
        Args:
            current_data: Current market data
            base_predictions: Base model predictions
            horizon: Forecast horizon
        
        Returns:
            Dictionary with adjusted predictions and analogue info
        """
        # Retrieve analogues
        analogues = self.retriever.retrieve_analogues(current_data)
        
        if not analogues:
            return {
                "predictions": base_predictions,
                "analogues_used": 0,
                "adjustment_factor": 1.0
            }
        
        # Calculate adjustment based on analogues
        # Use average future performance of similar periods
        adjustment_factors = []
        for analogue in analogues:
            segment_data = analogue["segment"]["data"]
            similarity = analogue["similarity"]
            
            # Calculate what happened after similar periods
            if len(segment_data) > horizon:
                future_return = (segment_data[horizon] - segment_data[0]) / segment_data[0]
                adjustment_factors.append(future_return * similarity)
        
        if adjustment_factors:
            avg_adjustment = np.mean(adjustment_factors)
            # Apply adjustment to base predictions
            adjusted_predictions = base_predictions * (1 + avg_adjustment * 0.3)  # Conservative adjustment
        else:
            adjusted_predictions = base_predictions
            avg_adjustment = 0.0
        
        return {
            "predictions": adjusted_predictions,
            "analogues_used": len(analogues),
            "adjustment_factor": 1 + avg_adjustment * 0.3,
            "analogue_summary": self.retriever.get_analogue_summary(analogues)
        }





