import React from 'react';
import { motion } from 'framer-motion';

const TeamCard = ({ name, role, image, linkedin, github }) => (
  <motion.div
    className="flex flex-col items-center bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-2xl transition group"
    whileHover={{ scale: 1.04 }}
  >
    <img
      src={image}
      alt={name}
      className="w-24 h-24 rounded-full object-cover mb-4 border-4 border-blue-400 group-hover:border-blue-600 transition"
    />
    <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">{name}</h4>
    <p className="text-blue-600 dark:text-blue-400 text-sm mb-3">{role}</p>
    <div className="flex gap-3">
      {linkedin && (
        <a href={linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-blue-700 dark:hover:text-blue-300 transition">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-11 19h-3v-10h3v10zm-1.5-11.28c-.97 0-1.75-.79-1.75-1.75s.78-1.75 1.75-1.75 1.75.79 1.75 1.75-.78 1.75-1.75 1.75zm15.5 11.28h-3v-5.6c0-1.34-.03-3.07-1.87-3.07-1.87 0-2.16 1.46-2.16 2.97v5.7h-3v-10h2.89v1.36h.04c.4-.75 1.38-1.54 2.84-1.54 3.04 0 3.6 2 3.6 4.59v5.59z"/></svg>
        </a>
      )}
      {github && (
        <a href={github} target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 dark:hover:text-gray-100 transition">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.63 0-12 5.37-12 12 0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.605-2.665-.305-5.466-1.332-5.466-5.93 0-1.31.468-2.38 1.236-3.22-.124-.304-.535-1.527.117-3.18 0 0 1.008-.322 3.3 1.23.96-.267 1.98-.399 3-.404 1.02.005 2.04.137 3 .404 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.876.12 3.18.77.84 1.235 1.91 1.235 3.22 0 4.61-2.803 5.624-5.475 5.92.43.37.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .322.216.694.825.576 4.765-1.587 8.2-6.086 8.2-11.384 0-6.63-5.373-12-12-12z"/></svg>
        </a>
      )}
    </div>
  </motion.div>
);

export default TeamCard;
