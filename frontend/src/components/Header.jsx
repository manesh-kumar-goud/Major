import React from 'react';
import { motion } from 'framer-motion';
import ThemeToggle from './ThemeToggle';

const Header = () => (
  <motion.header
    className="flex items-center justify-end px-6 py-4 bg-white dark:bg-gray-900 shadow-md z-20"
    initial={{ y: -60, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ duration: 0.7 }}
  >
    <ThemeToggle />
  </motion.header>
);

export default Header;
