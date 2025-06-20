import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HomeIcon, TrendingUpIcon, BarChart2Icon, UsersIcon, MailIcon, MenuIcon, XIcon } from 'lucide-react';

const navLinks = [
  { name: 'Home', path: '/', icon: <HomeIcon /> },
  { name: 'Prediction', path: '/prediction', icon: <TrendingUpIcon /> },
  { name: 'Comparison', path: '/comparison', icon: <BarChart2Icon /> },
  { name: 'About', path: '/about', icon: <UsersIcon /> },
  { name: 'Contact', path: '/contact', icon: <MailIcon /> },
];

const Sidebar = () => {
  const [hovered, setHovered] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setHovered(null);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sidebarWidth = 72;

  return (
    <>
      {/* Hamburger for mobile */}
      <button
        className="fixed top-5 left-5 z-40 p-2 rounded-md bg-blue-600 text-white dark:bg-blue-400 focus:outline-none lg:hidden shadow-lg"
        onClick={() => setMobileOpen(o => !o)}
        aria-label="Toggle sidebar"
      >
        {mobileOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
      </button>
      {/* Sidebar (desktop & mobile) */}
      <AnimatePresence>
        {(mobileOpen || window.innerWidth >= 1024) && (
          <motion.aside
            initial={{ x: mobileOpen ? -sidebarWidth : 0, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -sidebarWidth, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`fixed top-0 left-0 h-full z-30 flex flex-col pt-20 pb-8 px-2 gap-2 bg-white/20 dark:bg-gray-900/40 shadow-xl backdrop-blur-xl border-r border-white/20 dark:border-gray-700/40 transition-all duration-300 w-[72px]`}
          >
            {navLinks.map(link => (
              <div key={link.name} className="relative w-full flex justify-center">
                <Link
                  to={link.path}
                  className={`group flex items-center justify-center px-0 py-3 my-1 rounded-lg transition-colors relative ${location.pathname === link.path ? 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-800'}`}
                  onClick={() => setMobileOpen(false)}
                  tabIndex={0}
                  onMouseEnter={() => setHovered(link.name)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <motion.span
                    className={`text-2xl flex-shrink-0 rounded-lg p-2 transition-all ${hovered === link.name ? 'ring-2 ring-blue-400/60 shadow-lg bg-white/30 dark:bg-blue-900/30' : ''}`}
                    animate={hovered === link.name ? { scale: 1.15 } : { scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    {link.icon}
                  </motion.span>
                  <AnimatePresence>
                    {hovered === link.name && (
                      <motion.span
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 16 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-1 rounded bg-gray-900/90 text-white text-sm shadow-lg whitespace-nowrap pointer-events-none"
                        style={{ zIndex: 100 }}
                      >
                        {link.name}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              </div>
            ))}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
