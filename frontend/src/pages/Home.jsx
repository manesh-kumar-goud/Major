import React, { useEffect, useRef, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { FaRobot, FaChartLine, FaBrain, FaArrowRight, FaGithub, FaLinkedin, FaCheckCircle, FaMagic, FaChartBar, FaCogs, FaUserGraduate, FaEnvelope, FaPlayCircle } from 'react-icons/fa';

const TYPING_TEXT = 'Intelligent Stock Market Forecasting';
const HERO_SUB = 'Deep Learning. Real Results. LSTM vs RNN — Visualized, Compared, and Explained.';
const TICKERS = [
  { symbol: 'AAPL', price: 212.34, change: '+1.2%' },
  { symbol: 'GOOGL', price: 3124.56, change: '-0.8%' },
  { symbol: 'TSLA', price: 812.12, change: '+2.1%' },
  { symbol: 'MSFT', price: 412.78, change: '+0.5%' },
  { symbol: 'AMZN', price: 3122.11, change: '-1.1%' },
];

function useTypingEffect(text, speed = 60) {
  const [displayed, setDisplayed] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  useEffect(() => {
    let i = 0;
    setDisplayed('');
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i === text.length) clearInterval(interval);
    }, speed);
    const cursorInterval = setInterval(() => setShowCursor(c => !c), 500);
    return () => { clearInterval(interval); clearInterval(cursorInterval); };
  }, [text, speed]);
  return [displayed, showCursor];
}

const AnimatedBlobs = () => (
  <>
    <motion.div
      className="absolute -top-32 -left-32 w-[40vw] h-[40vw] bg-gradient-to-br from-blue-500/60 to-emerald-400/40 rounded-full blur-3xl opacity-60 z-0"
      animate={{ scale: [1, 1.1, 1], rotate: [0, 30, 0] }}
      transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.div
      className="absolute top-1/2 right-0 w-[30vw] h-[30vw] bg-gradient-to-br from-indigo-500/60 to-purple-400/40 rounded-full blur-2xl opacity-50 z-0"
      animate={{ scale: [1, 1.08, 1], rotate: [0, -20, 0] }}
      transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
    />
  </>
);

const AnimatedTicker = () => {
  const [offset, setOffset] = useState(0);
  const [prices, setPrices] = useState(TICKERS);
  useEffect(() => {
    const interval = setInterval(() => {
      setOffset(o => (o + 1) % TICKERS.length);
      setPrices(prices => prices.map((t, i) => {
        // Simulate price change
        const change = (Math.random() * 2 - 1).toFixed(2);
        const newPrice = +(t.price + parseFloat(change));
        const newChange = (change > 0 ? '+' : '') + change + '%';
        return { ...t, price: newPrice, change: newChange };
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="flex gap-4 flex-wrap items-center justify-center w-full overflow-x-auto py-2 select-none">
      {prices.map((t, i) => (
        <motion.div
          key={t.symbol}
          className={`flex items-center gap-2 px-6 py-2 rounded-full bg-white/10 backdrop-blur border border-white/20 text-lg font-mono shadow transition-all duration-300 ${i === offset ? 'scale-110 bg-gradient-to-r from-blue-500/30 to-emerald-400/30 ring-2 ring-blue-400/40' : ''}`}
          animate={{ opacity: i === offset ? 1 : 0.7 }}
          whileHover={{ boxShadow: '0 0 16px #60a5fa, 0 0 32px #34d399', scale: 1.12 }}
          transition={{ duration: 0.5 }}
        >
          <FaChartLine className="text-blue-400" />
          <span>{t.symbol}</span>
          <motion.span
            key={t.price}
            className={t.change.startsWith('+') ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}
            animate={{ scale: [1, 1.2, 1], color: t.change.startsWith('+') ? '#34d399' : '#f87171' }}
            transition={{ duration: 0.6 }}
          >
            {t.price.toFixed(2)}
          </motion.span>
          <span className={t.change.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}>{t.change}</span>
        </motion.div>
      ))}
    </div>
  );
};

const Hero = () => {
  const [typed, showCursor] = useTypingEffect(TYPING_TEXT, 40);
  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 py-16 overflow-hidden bg-transparent w-full">
      <div className="noise-bg" />
      <motion.div
        className="relative z-10 flex flex-col items-center gap-8 w-full max-w-3xl mx-auto"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <div className="flex flex-col items-center gap-2 w-full">
          <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-emerald-400 to-indigo-400 drop-shadow-xl tracking-tight text-center leading-tight md:leading-tight">
            <span>{typed}</span>
            <span className={`inline-block w-2 h-8 align-middle ml-1 ${showCursor ? 'bg-blue-400' : 'bg-transparent'} rounded-sm transition-all duration-200`} />
          </h1>
          <p className="text-xl md:text-2xl font-medium text-center max-w-2xl mt-2 mb-2 tracking-wide leading-relaxed text-slate-200/90 dark:text-slate-100/80">
            {HERO_SUB}
          </p>
        </div>
        <AnimatedTicker />
        <div className="flex gap-4 mt-4 w-full justify-center">
          <motion.a
            href="#project-summary"
            className="inline-flex items-center gap-2 px-8 py-3 md:px-8 md:py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-emerald-500 text-white font-bold shadow-xl hover:scale-105 active:scale-95 transition-transform text-lg tracking-wide relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-400 fixed bottom-8 right-8 md:static md:bottom-auto md:right-auto z-50"
            whileTap={{ scale: 0.97 }}
            whileHover={{ boxShadow: '0 0 24px #60a5fa, 0 0 48px #34d399', scale: 1.07 }}
          >
            <FaArrowRight className="text-xl" /> Live Demo
          </motion.a>
        </div>
      </motion.div>
    </section>
  );
};

const WhyLstmVsRnn = () => (
  <section className="py-24 px-8 max-w-6xl mx-auto w-full">
    <motion.h2 className="text-3xl font-bold text-center mb-12 text-blue-300" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>Why LSTM vs RNN?</motion.h2>
    <div className="grid md:grid-cols-2 gap-10">
      <motion.div
        className="group bg-gradient-to-br from-blue-900/40 to-blue-400/10 rounded-2xl p-8 shadow-xl backdrop-blur-xl border border-blue-400/20 flex flex-col items-center hover:scale-105 transition-transform cursor-pointer"
        whileHover={{ y: -8, boxShadow: '0 8px 32px 0 rgba(31,38,135,0.22)' }}
      >
        <FaBrain className="text-5xl text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
        <h3 className="text-2xl font-bold text-blue-200 mb-2">LSTM</h3>
        <p className="text-slate-200/90 text-center">Long Short-Term Memory networks excel at learning long-term dependencies, making them ideal for time series forecasting like stock prices.</p>
      </motion.div>
      <motion.div
        className="group bg-gradient-to-br from-purple-900/40 to-purple-400/10 rounded-2xl p-8 shadow-xl backdrop-blur-xl border border-purple-400/20 flex flex-col items-center hover:scale-105 transition-transform cursor-pointer"
        whileHover={{ y: -8, boxShadow: '0 8px 32px 0 rgba(31,38,135,0.22)' }}
      >
        <FaRobot className="text-5xl text-purple-300 mb-4 group-hover:scale-110 transition-transform" />
        <h3 className="text-2xl font-bold text-purple-200 mb-2">RNN</h3>
        <p className="text-slate-200/90 text-center">Recurrent Neural Networks are designed for sequential data but can struggle with long-term dependencies. Simpler, but less powerful for complex time series.</p>
      </motion.div>
    </div>
  </section>
);

const Features = () => {
  const features = [
    { icon: <FaMagic />, title: 'AI-Powered Forecasts', desc: 'Harness deep learning for accurate, real-time stock predictions.' },
    { icon: <FaChartBar />, title: 'Interactive Charts', desc: 'Visualize actual vs predicted prices with beautiful, animated graphs.' },
    { icon: <FaCogs />, title: 'Model Comparison', desc: 'Compare LSTM and RNN performance with animated metrics.' },
    { icon: <FaUserGraduate />, title: 'Academic & Pro Ready', desc: 'Designed for both research and real-world deployment.' },
    { icon: <FaCheckCircle />, title: 'Live Stock Ticker', desc: 'See real-time (mock) stock data for popular tickers.' },
  ];
  return (
    <section className="py-24 px-8 max-w-6xl mx-auto w-full">
      <motion.h2 className="text-3xl font-bold text-center mb-12 text-emerald-300" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>Key Features</motion.h2>
      <div className="grid md:grid-cols-3 gap-10">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            className="group bg-gradient-to-br from-blue-900/40 to-emerald-400/10 rounded-2xl p-8 shadow-xl backdrop-blur-xl border border-emerald-400/20 flex flex-col items-center hover:scale-105 transition-transform cursor-pointer"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            whileHover={{ y: -8, boxShadow: '0 8px 32px 0 rgba(31,38,135,0.22)' }}
          >
            <span className="text-4xl mb-4 text-emerald-300 group-hover:scale-110 transition-transform">{f.icon}</span>
            <h3 className="text-xl font-bold text-emerald-200 mb-2">{f.title}</h3>
            <p className="text-slate-200/90 text-center">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

const Timeline = () => {
  const steps = [
    { icon: <FaChartLine />, label: 'Input Stock & Dates', desc: 'Enter ticker and date range.' },
    { icon: <FaRobot />, label: 'Select Model', desc: 'Choose LSTM, RNN, or both.' },
    { icon: <FaPlayCircle />, label: 'Run Prediction', desc: 'AI models forecast future prices.' },
    { icon: <FaChartBar />, label: 'View Results', desc: 'See interactive charts and metrics.' },
  ];
  return (
    <section className="py-24 px-8 max-w-6xl mx-auto w-full">
      <motion.h2 className="text-3xl font-bold text-center mb-12 text-indigo-300" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>How It Works</motion.h2>
      <div className="flex flex-col md:flex-row items-center justify-center gap-10">
        {steps.map((s, i) => (
          <motion.div
            key={s.label}
            className="flex flex-col items-center gap-3 px-6 py-8 bg-gradient-to-br from-indigo-900/40 to-blue-400/10 rounded-2xl shadow-xl border border-indigo-400/20 backdrop-blur-xl min-w-[180px] max-w-xs"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.15 }}
          >
            <span className="text-4xl text-indigo-300 mb-2">{s.icon}</span>
            <h4 className="text-lg font-bold text-indigo-100">{s.label}</h4>
            <p className="text-slate-200/80 text-center text-sm">{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

const Screenshots = () => (
  <section className="py-24 px-8 max-w-6xl mx-auto w-full">
    <motion.h2 className="text-3xl font-bold text-center mb-12 text-purple-300" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>Screenshots & Results</motion.h2>
    <div className="grid md:grid-cols-3 gap-10">
      {[1, 2, 3].map(i => (
        <motion.div
          key={i}
          className="relative group rounded-2xl overflow-hidden shadow-xl border border-purple-400/20 bg-gradient-to-br from-purple-900/40 to-purple-400/10 cursor-pointer"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: i * 0.1 }}
        >
          <img src={`https://placehold.co/400x250?text=App+Mockup+${i}`} alt={`App Screenshot ${i}`} className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300" />
          <motion.div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300" initial={{ opacity: 0 }} whileHover={{ opacity: 1 }}>
            <span className="text-white text-lg font-bold">View Full</span>
          </motion.div>
        </motion.div>
      ))}
    </div>
  </section>
);

const Team = () => {
  const members = [
    { name: 'Alice', role: 'Lead ML Engineer', img: 'https://randomuser.me/api/portraits/women/44.jpg', linkedin: '#', github: '#' },
    { name: 'Bob', role: 'Frontend Developer', img: 'https://randomuser.me/api/portraits/men/32.jpg', linkedin: '#', github: '#' },
    { name: 'Carol', role: 'Data Scientist', img: 'https://randomuser.me/api/portraits/women/68.jpg', linkedin: '#', github: '#' },
  ];
  return (
    <section className="py-24 px-8 max-w-6xl mx-auto w-full">
      <motion.h2 className="text-3xl font-bold text-center mb-12 text-pink-300" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>Meet the Team</motion.h2>
      <div className="flex flex-wrap gap-10 justify-center items-center">
        {members.map((m, i) => (
          <motion.div
            key={m.name}
            className="group bg-gradient-to-br from-pink-900/40 to-pink-400/10 rounded-2xl p-8 shadow-xl border border-pink-400/20 backdrop-blur-xl flex flex-col items-center w-64 hover:scale-105 transition-transform"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          >
            <img src={m.img} alt={m.name} className="w-24 h-24 rounded-full object-cover border-4 border-pink-300 mb-4 group-hover:border-pink-400 transition" />
            <h4 className="text-lg font-bold text-pink-100 mb-1">{m.name}</h4>
            <p className="text-pink-200 text-sm mb-3">{m.role}</p>
            <div className="flex gap-3">
              <a href={m.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition"><FaLinkedin className="text-xl" /></a>
              <a href={m.github} target="_blank" rel="noopener noreferrer" className="hover:text-gray-100 transition"><FaGithub className="text-xl" /></a>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

const CTA = () => (
  <section className="py-24 px-8 max-w-4xl mx-auto w-full flex flex-col items-center justify-center">
    <motion.h2 className="text-4xl font-extrabold text-center mb-8 bg-gradient-to-r from-blue-400 via-emerald-400 to-indigo-400 text-transparent bg-clip-text drop-shadow-xl" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>Ready to Forecast the Future?</motion.h2>
    <motion.a href="#" className="inline-flex items-center gap-2 px-12 py-5 rounded-2xl bg-gradient-to-r from-blue-600 to-emerald-500 text-white font-bold shadow-xl hover:scale-105 active:scale-95 transition-transform text-lg tracking-wide relative overflow-hidden" whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.05 }}>
      <FaArrowRight className="text-xl" /> Try Prediction Now
    </motion.a>
  </section>
);

const Footer = () => (
  <footer className="w-full py-8 flex flex-col items-center gap-2 text-slate-400/80 text-sm border-t border-slate-700 bg-gradient-to-t from-[#0f172a] via-[#312e81] to-transparent">
    <div className="flex gap-4 items-center mb-2">
      <a href="mailto:contact@stockai.com" className="hover:text-white transition"><FaEnvelope className="text-lg" /></a>
      <a href="https://github.com/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition"><FaGithub className="text-lg" /></a>
      <a href="https://linkedin.com/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition"><FaLinkedin className="text-lg" /></a>
    </div>
    <span>© {new Date().getFullYear()} Intelligent Stock Market Forecasting</span>
    <span>Made with <span className="text-blue-400">♥</span> using React, Tailwind, Framer Motion</span>
  </footer>
);

const sectionClass =
  "relative w-full max-w-7xl mx-auto flex flex-col items-center justify-center px-4 md:px-8 py-20 md:py-28 space-y-8 md:space-y-12 z-10";

const Home = () => (
  <main className="relative min-h-screen flex flex-col bg-transparent">
    <Hero />
    <section id="project-summary" className={sectionClass + " md:flex-row gap-16 md:gap-24 items-center justify-between bg-transparent"}>
      {/* ...animated summary, icons, and chart preview... */}
      <div className="flex-1 flex flex-col gap-6 max-w-xl w-full mx-auto md:mx-0">
        <motion.h2 className="text-3xl font-bold text-blue-300 mb-4 flex items-center gap-2" initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
          <FaRobot className="text-2xl text-emerald-400" /> Project Summary
        </motion.h2>
        <motion.p className="text-lg text-slate-200/90" initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.1 }}>
          This project leverages advanced deep learning (LSTM & RNN) to forecast stock prices, providing interactive, real-time, and visually rich insights for both academic and professional users.
        </motion.p>
      </div>
      <div className="flex-1 flex items-center justify-center max-w-lg w-full mx-auto md:mx-0">
        <FaChartLine className="text-[8rem] text-blue-400/30 animate-pulse drop-shadow-2xl" />
      </div>
    </section>
    <WhyLstmVsRnn />
    <Features />
    <Timeline />
    <Screenshots />
    <Team />
    <CTA />
    <Footer />
    <div className="h-8 md:h-12" />
  </main>
);

export default Home;
