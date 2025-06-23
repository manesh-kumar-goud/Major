import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, Radar, Cell, PieChart, Pie 
} from 'recharts';
import { 
  FaBrain, FaRobot, FaChartBar, FaClock, FaMemory, 
  FaCheckCircle, FaTimes, FaArrowRight, FaLightbulb,
  FaGraduationCap, FaIndustry, FaDatabase
} from 'react-icons/fa';

const Comparison = () => {
  const [activeComparison, setActiveComparison] = useState('architecture');

  // Mock performance data for visualization
  const performanceData = [
    { metric: 'Accuracy', LSTM: 92.5, RNN: 87.3 },
    { metric: 'Speed', LSTM: 75.2, RNN: 89.7 },
    { metric: 'Memory Efficiency', LSTM: 68.4, RNN: 85.1 },
    { metric: 'Long-term Dependencies', LSTM: 94.8, RNN: 72.6 },
    { metric: 'Training Stability', LSTM: 89.3, RNN: 76.8 },
    { metric: 'Convergence Speed', LSTM: 73.5, RNN: 88.2 }
  ];

  const complexityData = [
    { name: 'Model Complexity', LSTM: 85, RNN: 45 },
    { name: 'Training Time', LSTM: 78, RNN: 35 },
    { name: 'Resource Usage', LSTM: 82, RNN: 48 },
    { name: 'Implementation Difficulty', LSTM: 75, RNN: 30 }
  ];

  const useCaseData = [
    { name: 'Short-term Patterns', value: 35, color: '#8B5CF6' },
    { name: 'Long-term Dependencies', value: 65, color: '#3B82F6' }
  ];

  const architectureComparison = {
    LSTM: {
      title: "LSTM (Long Short-Term Memory)",
      icon: <FaBrain className="text-4xl text-blue-400" />,
      color: "blue",
      features: [
        { name: "Cell State", present: true, description: "Maintains long-term memory through cell state" },
        { name: "Forget Gate", present: true, description: "Decides what information to discard" },
        { name: "Input Gate", present: true, description: "Controls what new information to store" },
        { name: "Output Gate", present: true, description: "Determines what parts of cell state to output" },
        { name: "Vanishing Gradient", present: false, description: "Effectively handles vanishing gradient problem" },
        { name: "Long Dependencies", present: true, description: "Excels at learning long-term dependencies" }
      ],
      strengths: [
        "Superior performance on long sequences",
        "Handles vanishing gradient problem",
        "Better at capturing long-term dependencies",
        "More stable training process",
        "Industry standard for time series"
      ],
      weaknesses: [
        "Higher computational complexity",
        "Requires more memory",
        "Slower training and inference",
        "More parameters to tune",
        "Complex architecture"
      ],
      bestFor: [
        "Long-term stock price prediction",
        "Natural language processing",
        "Complex sequential patterns",
        "Time series with long dependencies",
        "High-accuracy requirements"
      ]
    },
    RNN: {
      title: "RNN (Recurrent Neural Network)",
      icon: <FaRobot className="text-4xl text-purple-400" />,
      color: "purple",
      features: [
        { name: "Cell State", present: false, description: "No dedicated long-term memory mechanism" },
        { name: "Forget Gate", present: false, description: "No selective forgetting mechanism" },
        { name: "Input Gate", present: false, description: "Simple input processing" },
        { name: "Output Gate", present: false, description: "Direct output from hidden state" },
        { name: "Vanishing Gradient", present: true, description: "Suffers from vanishing gradient problem" },
        { name: "Long Dependencies", present: false, description: "Struggles with long-term dependencies" }
      ],
      strengths: [
        "Simpler architecture",
        "Faster training and inference",
        "Lower memory requirements",
        "Easier to implement",
        "Good for short sequences"
      ],
      weaknesses: [
        "Vanishing gradient problem",
        "Poor long-term memory",
        "Limited context understanding",
        "Unstable for long sequences",
        "Lower accuracy on complex tasks"
      ],
      bestFor: [
        "Short-term predictions",
        "Simple sequential patterns",
        "Resource-constrained environments",
        "Quick prototyping",
        "Real-time applications"
      ]
    }
  };

  const ComparisonCard = ({ title, children, delay = 0 }) => (
    <motion.div
      className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
    >
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
        <FaLightbulb className="text-yellow-400" />
        {title}
      </h3>
      {children}
    </motion.div>
  );

  const FeatureComparison = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {Object.entries(architectureComparison).map(([key, model], index) => (
        <motion.div
          key={key}
          className={`bg-gradient-to-br from-${model.color}-900/40 to-${model.color}-600/20 rounded-2xl p-6 border border-${model.color}-500/30`}
          initial={{ opacity: 0, x: index === 0 ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex items-center gap-4 mb-6">
            {model.icon}
            <h3 className="text-2xl font-bold text-white">{model.title}</h3>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-lg font-semibold text-gray-200 mb-3">Architecture Features</h4>
              <div className="space-y-2">
                {model.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                    {feature.present ? (
                      <FaCheckCircle className="text-green-400 text-sm" />
                    ) : (
                      <FaTimes className="text-red-400 text-sm" />
                    )}
                    <div>
                      <span className="text-white font-medium">{feature.name}</span>
                      <p className="text-gray-300 text-sm">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-green-300 mb-2">Strengths</h4>
              <ul className="space-y-1">
                {model.strengths.map((strength, idx) => (
                  <li key={idx} className="text-gray-300 text-sm flex items-center gap-2">
                    <FaCheckCircle className="text-green-400 text-xs" />
                    {strength}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-red-300 mb-2">Weaknesses</h4>
              <ul className="space-y-1">
                {model.weaknesses.map((weakness, idx) => (
                  <li key={idx} className="text-gray-300 text-sm flex items-center gap-2">
                    <FaTimes className="text-red-400 text-xs" />
                    {weakness}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-blue-300 mb-2">Best Use Cases</h4>
              <ul className="space-y-1">
                {model.bestFor.map((useCase, idx) => (
                  <li key={idx} className="text-gray-300 text-sm flex items-center gap-2">
                    <FaArrowRight className="text-blue-400 text-xs" />
                    {useCase}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );

  const PerformanceComparison = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-4">Performance Metrics</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="metric" 
                  stroke="#9CA3AF"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="LSTM" fill="#3B82F6" name="LSTM" />
                <Bar dataKey="RNN" fill="#8B5CF6" name="RNN" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-4">Complexity Analysis</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={complexityData}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 100]} 
                  tick={{ fontSize: 10, fill: '#9CA3AF' }}
                />
                <Radar 
                  name="LSTM" 
                  dataKey="LSTM" 
                  stroke="#3B82F6" 
                  fill="#3B82F6" 
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Radar 
                  name="RNN" 
                  dataKey="RNN" 
                  stroke="#8B5CF6" 
                  fill="#8B5CF6" 
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
        <h3 className="text-xl font-bold text-white mb-4">Use Case Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={useCaseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {useCaseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-purple-500 rounded-full"></div>
              <div>
                <div className="text-white font-semibold">RNN - Short-term Patterns</div>
                <div className="text-gray-300 text-sm">
                  Ideal for simple sequential patterns and quick predictions
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
              <div>
                <div className="text-white font-semibold">LSTM - Long-term Dependencies</div>
                <div className="text-gray-300 text-sm">
                  Superior for complex patterns requiring long-term memory
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const PracticalComparison = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <ComparisonCard title="Academic Research" delay={0.1}>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <FaGraduationCap className="text-blue-400 text-xl" />
            <span className="text-white font-semibold">Research Focus</span>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-blue-300 font-medium">LSTM</div>
              <div className="text-gray-300 text-sm">
                Extensive research on attention mechanisms, transformer architectures, and advanced variants
              </div>
            </div>
            <div>
              <div className="text-purple-300 font-medium">RNN</div>
              <div className="text-gray-300 text-sm">
                Foundation for understanding sequential processing, still relevant for educational purposes
              </div>
            </div>
          </div>
        </div>
      </ComparisonCard>

      <ComparisonCard title="Industry Applications" delay={0.2}>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <FaIndustry className="text-green-400 text-xl" />
            <span className="text-white font-semibold">Real-world Usage</span>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-blue-300 font-medium">LSTM</div>
              <div className="text-gray-300 text-sm">
                Financial forecasting, speech recognition, machine translation, medical diagnosis
              </div>
            </div>
            <div>
              <div className="text-purple-300 font-medium">RNN</div>
              <div className="text-gray-300 text-sm">
                Simple chatbots, basic sentiment analysis, real-time processing systems
              </div>
            </div>
          </div>
        </div>
      </ComparisonCard>

      <ComparisonCard title="Resource Requirements" delay={0.3}>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <FaDatabase className="text-orange-400 text-xl" />
            <span className="text-white font-semibold">Resource Usage</span>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-blue-300 font-medium">LSTM</div>
              <div className="text-gray-300 text-sm">
                High GPU memory, longer training time, more computational resources
              </div>
            </div>
            <div>
              <div className="text-purple-300 font-medium">RNN</div>
              <div className="text-gray-300 text-sm">
                Lower resource requirements, faster training, suitable for edge devices
              </div>
            </div>
          </div>
        </div>
      </ComparisonCard>
    </div>
  );

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
            🔬 LSTM vs RNN Deep Dive
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Comprehensive comparison of Long Short-Term Memory and Recurrent Neural Networks for stock market forecasting
          </p>
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div 
          className="flex flex-wrap justify-center gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {[
            { id: 'architecture', label: 'Architecture', icon: <FaBrain /> },
            { id: 'performance', label: 'Performance', icon: <FaChartBar /> },
            { id: 'practical', label: 'Practical Use', icon: <FaIndustry /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveComparison(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                activeComparison === tab.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Content Sections */}
        <motion.div
          key={activeComparison}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.5 }}
        >
          {activeComparison === 'architecture' && <FeatureComparison />}
          {activeComparison === 'performance' && <PerformanceComparison />}
          {activeComparison === 'practical' && <PracticalComparison />}
        </motion.div>

        {/* Decision Guide */}
        <motion.div 
          className="mt-12 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl p-8 border border-blue-500/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            🎯 Which Model Should You Choose?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-blue-600/20 rounded-xl p-6 border border-blue-500/30">
              <div className="flex items-center gap-3 mb-4">
                <FaBrain className="text-blue-400 text-2xl" />
                <h3 className="text-xl font-bold text-blue-300">Choose LSTM When:</h3>
              </div>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-400 text-sm" />
                  You need high accuracy predictions
                </li>
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-400 text-sm" />
                  Working with long-term dependencies
                </li>
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-400 text-sm" />
                  Have sufficient computational resources
                </li>
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-400 text-sm" />
                  Complex sequential patterns exist
                </li>
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-400 text-sm" />
                  Production-level applications
                </li>
              </ul>
            </div>

            <div className="bg-purple-600/20 rounded-xl p-6 border border-purple-500/30">
              <div className="flex items-center gap-3 mb-4">
                <FaRobot className="text-purple-400 text-2xl" />
                <h3 className="text-xl font-bold text-purple-300">Choose RNN When:</h3>
              </div>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-400 text-sm" />
                  Working with short sequences
                </li>
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-400 text-sm" />
                  Limited computational resources
                </li>
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-400 text-sm" />
                  Need fast training/inference
                </li>
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-400 text-sm" />
                  Prototyping and experimentation
                </li>
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-400 text-sm" />
                  Real-time processing requirements
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Comparison;
