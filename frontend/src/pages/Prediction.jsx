import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer
} from 'recharts';
import { 
  FaRobot, FaBrain, FaChartLine, FaPlay, 
  FaSpinner, FaCheckCircle, FaExclamationTriangle,
  FaArrowUp, FaArrowDown, FaEquals
} from 'react-icons/fa';
import axios from 'axios';
import { API_BASE_URL, USE_MOCK_DATA, MOCK_DATA } from '../config/api';

const Prediction = () => {
  const [formData, setFormData] = useState({
    ticker: 'AAPL',
    model: 'LSTM',
    period: '1y',
    predictionDays: 30
  });
  
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [popularStocks, setPopularStocks] = useState([]);
  const [activeTab, setActiveTab] = useState('prediction');

  // Fetch popular stocks on component mount
  useEffect(() => {
    fetchPopularStocks();
  }, []);

  const fetchPopularStocks = async () => {
    try {
      if (USE_MOCK_DATA) {
        // Use mock data for frontend-only deployment
        setPopularStocks(MOCK_DATA.popularStocks);
        return;
      }
      
      const response = await axios.get(`${API_BASE_URL}/popular-stocks`);
      setPopularStocks(response.data.stocks || []);
    } catch (err) {
      console.error('Error fetching popular stocks:', err);
      // Fallback to mock data if API fails
      setPopularStocks(MOCK_DATA.popularStocks);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePredict = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (USE_MOCK_DATA) {
        // Use mock data for frontend-only deployment
        setTimeout(() => {
          const mockResult = MOCK_DATA.generatePrediction(formData.ticker, formData.predictionDays);
          setResults(mockResult);
          setLoading(false);
        }, 2000); // Simulate API delay
        return;
      }
      
      const response = await axios.post(`${API_BASE_URL}/predict`, formData);
      setResults(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to make prediction');
      console.error('Prediction error:', err);
      
      // Fallback to mock data if API fails
      const mockResult = MOCK_DATA.generatePrediction(formData.ticker, formData.predictionDays);
      setResults(mockResult);
    } finally {
      if (!USE_MOCK_DATA) {
        setLoading(false);
      }
    }
  };

  const handleCompareModels = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (USE_MOCK_DATA) {
        // Use mock data for frontend-only deployment
        setTimeout(() => {
          const lstmResult = MOCK_DATA.generatePrediction(formData.ticker, formData.predictionDays);
          const rnnResult = MOCK_DATA.generatePrediction(formData.ticker, formData.predictionDays);
          
          const mockComparison = {
            ticker: formData.ticker,
            LSTM: lstmResult,
            RNN: rnnResult
          };
          
          setResults(mockComparison);
          setActiveTab('comparison');
          setLoading(false);
        }, 2500); // Simulate API delay
        return;
      }
      
      const response = await axios.post(`${API_BASE_URL}/compare-models`, {
        ticker: formData.ticker,
        period: formData.period
      });
      setResults(response.data);
      setActiveTab('comparison');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to compare models');
      console.error('Comparison error:', err);
      
      // Fallback to mock data if API fails
      const lstmResult = MOCK_DATA.generatePrediction(formData.ticker, formData.predictionDays);
      const rnnResult = MOCK_DATA.generatePrediction(formData.ticker, formData.predictionDays);
      
      const mockComparison = {
        ticker: formData.ticker,
        LSTM: lstmResult,
        RNN: rnnResult
      };
      
      setResults(mockComparison);
      setActiveTab('comparison');
    } finally {
      if (!USE_MOCK_DATA) {
        setLoading(false);
      }
    }
  };

  const formatChartData = (data) => {
    if (!data || !data.historical_data) return [];
    
    const { dates, actual, predicted } = data.historical_data;
    const { future_predictions } = data;
    
    const historicalData = dates.map((date, index) => ({
      date,
      actual: actual[index],
      predicted: predicted[index],
      type: 'historical'
    }));
    
    const futureData = future_predictions.dates.map((date, index) => ({
      date,
      predicted: future_predictions.predictions[index],
      type: 'future'
    }));
    
    return [...historicalData, ...futureData];
  };

  const formatComparisonData = (data) => {
    if (!data || !data.comparison_data) return [];
    
    const { dates, actual, lstm_predictions, rnn_predictions } = data.comparison_data;
    
    return dates.map((date, index) => ({
      date,
      actual: actual[index],
      lstm: lstm_predictions[index],
      rnn: rnn_predictions[index]
    }));
  };

  const getTrendIcon = (summary) => {
    if (!summary) return <FaEquals className="text-gray-400" />;
    
    if (summary.trend === 'bullish') {
      return <FaArrowUp className="text-green-400" />;
    } else if (summary.trend === 'bearish') {
      return <FaArrowDown className="text-red-400" />;
    }
    return <FaEquals className="text-gray-400" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-4">
            🚀 AI Stock Prediction
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Leverage the power of LSTM and RNN deep learning models to forecast stock prices with unprecedented accuracy
          </p>
        </motion.div>

        {/* Input Panel */}
        <motion.div 
          className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 mb-8 border border-white/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Stock Ticker */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Stock Ticker
              </label>
              <input
                type="text"
                name="ticker"
                value={formData.ticker}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., AAPL"
              />
            </div>

            {/* Model Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                AI Model
              </label>
              <select
                name="model"
                value={formData.model}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="LSTM">🧠 LSTM (Long Short-Term Memory)</option>
                <option value="RNN">🤖 RNN (Recurrent Neural Network)</option>
              </select>
            </div>

            {/* Period */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Historical Period
              </label>
              <select
                name="period"
                value={formData.period}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="3mo">3 Months</option>
                <option value="6mo">6 Months</option>
                <option value="1y">1 Year</option>
                <option value="2y">2 Years</option>
                <option value="5y">5 Years</option>
              </select>
            </div>

            {/* Prediction Days */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Forecast Days
              </label>
              <input
                type="number"
                name="predictionDays"
                value={formData.predictionDays}
                onChange={handleInputChange}
                min="1"
                max="90"
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <motion.button
              onClick={handlePredict}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-lg transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <FaPlay />
              )}
              {loading ? 'Predicting...' : 'Predict Stock Price'}
            </motion.button>

            <motion.button
              onClick={handleCompareModels}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-lg transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <FaChartLine />
              )}
              {loading ? 'Comparing...' : 'Compare LSTM vs RNN'}
            </motion.button>
          </div>
        </motion.div>

        {/* Popular Stocks */}
        {popularStocks.length > 0 && (
          <motion.div 
            className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 mb-8 border border-white/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h3 className="text-xl font-bold text-white mb-4">🏆 Popular Stocks</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {popularStocks.slice(0, 10).map((stock) => (
                <motion.div
                  key={stock.symbol}
                  onClick={() => setFormData(prev => ({ ...prev, ticker: stock.symbol }))}
                  className="bg-gray-800/50 rounded-lg p-4 cursor-pointer hover:bg-gray-700/50 transition-all duration-200 border border-gray-600 hover:border-blue-500"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="text-white font-bold text-lg">{stock.symbol}</div>
                  <div className="text-gray-300 text-sm">${stock.price}</div>
                  <div className={`text-sm ${stock.change_percent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {stock.change_percent >= 0 ? '+' : ''}{stock.change_percent.toFixed(2)}%
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-8 flex items-center gap-3"
            >
              <FaExclamationTriangle className="text-red-400 text-xl" />
              <span className="text-red-300">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Display */}
        <AnimatePresence>
          {results && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="space-y-8"
            >
              {/* Tabs */}
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setActiveTab('prediction')}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === 'prediction'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                  }`}
                >
                  Prediction Results
                </button>
                {results.comparison_data && (
                  <button
                    onClick={() => setActiveTab('comparison')}
                    className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                      activeTab === 'comparison'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                    }`}
                  >
                    Model Comparison
                  </button>
                )}
              </div>

              {/* Prediction Results */}
              {activeTab === 'prediction' && results.historical_data && (
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                  <div className="flex items-center gap-3 mb-6">
                    <FaRobot className="text-blue-400 text-2xl" />
                    <h2 className="text-2xl font-bold text-white">
                      {results.ticker} - {results.model_type} Prediction
                    </h2>
                  </div>

                  {/* Summary Cards */}
                  {results.prediction_summary && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          {getTrendIcon(results.prediction_summary)}
                          <span className="text-gray-300 text-sm">Trend</span>
                        </div>
                        <div className="text-white font-bold text-lg">
                          {results.prediction_summary.trend?.toUpperCase()}
                        </div>
                      </div>
                      
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <div className="text-gray-300 text-sm mb-2">Avg Predicted Price</div>
                        <div className="text-white font-bold text-lg">
                          ${results.prediction_summary.avg_predicted_price?.toFixed(2)}
                        </div>
                      </div>
                      
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <div className="text-gray-300 text-sm mb-2">Expected Change</div>
                        <div className={`font-bold text-lg ${
                          results.prediction_summary.price_change_percent >= 0 
                            ? 'text-green-400' 
                            : 'text-red-400'
                        }`}>
                          {results.prediction_summary.price_change_percent >= 0 ? '+' : ''}
                          {results.prediction_summary.price_change_percent?.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Chart */}
                  <div className="h-96 mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={formatChartData(results)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#9CA3AF"
                          fontSize={12}
                        />
                        <YAxis 
                          stroke="#9CA3AF"
                          fontSize={12}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px'
                          }}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="actual" 
                          stroke="#10B981" 
                          strokeWidth={2}
                          name="Actual Price"
                          connectNulls={false}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="predicted" 
                          stroke="#3B82F6" 
                          strokeWidth={2}
                          name="Predicted Price"
                          strokeDasharray="5 5"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Metrics */}
                  {results.metrics && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <div className="text-gray-300 text-sm mb-1">RMSE</div>
                        <div className="text-white font-bold">
                          {results.metrics.rmse?.toFixed(4)}
                        </div>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <div className="text-gray-300 text-sm mb-1">MAE</div>
                        <div className="text-white font-bold">
                          {results.metrics.mae?.toFixed(4)}
                        </div>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <div className="text-gray-300 text-sm mb-1">Accuracy</div>
                        <div className="text-white font-bold">
                          {results.metrics.accuracy?.toFixed(2)}%
                        </div>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <div className="text-gray-300 text-sm mb-1">R² Score</div>
                        <div className="text-white font-bold">
                          {results.metrics.r2_score?.toFixed(4)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Model Comparison */}
              {activeTab === 'comparison' && results.comparison_data && (
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                  <div className="flex items-center gap-3 mb-6">
                    <FaBrain className="text-purple-400 text-2xl" />
                    <h2 className="text-2xl font-bold text-white">
                      LSTM vs RNN Comparison - {results.ticker}
                    </h2>
                  </div>

                  {/* Winner Badge */}
                  {results.winner && (
                    <div className="mb-6 text-center">
                      <div className="inline-flex items-center gap-2 bg-green-600/20 border border-green-500/50 rounded-full px-6 py-3">
                        <FaCheckCircle className="text-green-400" />
                        <span className="text-green-300 font-bold">
                          {results.winner} performs better!
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Comparison Chart */}
                  <div className="h-96 mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={formatComparisonData(results)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#9CA3AF"
                          fontSize={12}
                        />
                        <YAxis 
                          stroke="#9CA3AF"
                          fontSize={12}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px'
                          }}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="actual" 
                          stroke="#10B981" 
                          strokeWidth={2}
                          name="Actual Price"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="lstm" 
                          stroke="#3B82F6" 
                          strokeWidth={2}
                          name="LSTM Prediction"
                          strokeDasharray="5 5"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="rnn" 
                          stroke="#8B5CF6" 
                          strokeWidth={2}
                          name="RNN Prediction"
                          strokeDasharray="10 5"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Model Metrics Comparison */}
                  {results.model_metrics && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-blue-600/20 border border-blue-500/50 rounded-lg p-4">
                        <h3 className="text-blue-300 font-bold text-lg mb-3 flex items-center gap-2">
                          <FaBrain /> LSTM Metrics
                        </h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-300">RMSE:</span>
                            <span className="text-white font-bold">
                              {results.model_metrics.lstm?.rmse?.toFixed(4)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">MAE:</span>
                            <span className="text-white font-bold">
                              {results.model_metrics.lstm?.mae?.toFixed(4)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Accuracy:</span>
                            <span className="text-white font-bold">
                              {results.model_metrics.lstm?.accuracy?.toFixed(2)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">R² Score:</span>
                            <span className="text-white font-bold">
                              {results.model_metrics.lstm?.r2_score?.toFixed(4)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-purple-600/20 border border-purple-500/50 rounded-lg p-4">
                        <h3 className="text-purple-300 font-bold text-lg mb-3 flex items-center gap-2">
                          <FaRobot /> RNN Metrics
                        </h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-300">RMSE:</span>
                            <span className="text-white font-bold">
                              {results.model_metrics.rnn?.rmse?.toFixed(4)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">MAE:</span>
                            <span className="text-white font-bold">
                              {results.model_metrics.rnn?.mae?.toFixed(4)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Accuracy:</span>
                            <span className="text-white font-bold">
                              {results.model_metrics.rnn?.accuracy?.toFixed(2)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">R² Score:</span>
                            <span className="text-white font-bold">
                              {results.model_metrics.rnn?.r2_score?.toFixed(4)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Prediction;
