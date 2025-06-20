import React from 'react';
import { motion } from 'framer-motion';

const ChartCard = ({ title, children, className = '' }) => (
  <motion.div
    className={`rounded-xl shadow-lg bg-white dark:bg-gray-800 p-6 ${className}`}
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.7 }}
  >
    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">{title}</h3>
    {children}
  </motion.div>
);

export default ChartCard;
