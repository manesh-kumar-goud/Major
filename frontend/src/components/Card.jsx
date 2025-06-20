import React from 'react';
import { motion } from 'framer-motion';

const Card = ({ children, className = '', style = {}, ...props }) => (
  <motion.div
    className={`rounded-2xl shadow-xl bg-white/20 dark:bg-gray-800/40 backdrop-blur-lg border border-white/30 dark:border-gray-700/40 p-8 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${className}`}
    style={{
      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18), 0 1.5px 4px 0 rgba(0,0,0,0.08)',
      ...style,
    }}
    whileHover={{ scale: 1.03, boxShadow: '0 16px 48px 0 rgba(31,38,135,0.22)' }}
    transition={{ type: 'spring', stiffness: 300 }}
    {...props}
  >
    {children}
  </motion.div>
);

export default Card;
