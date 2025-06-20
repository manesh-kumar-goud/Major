import React from 'react';

const Button = ({ children, onClick, type = 'button', className = '', ...props }) => (
  <button
    type={type}
    onClick={onClick}
    className={`px-6 py-2 rounded-lg font-semibold bg-blue-600 text-white dark:bg-blue-400 dark:text-gray-900 hover:bg-blue-700 dark:hover:bg-blue-500 transition shadow ${className}`}
    {...props}
  >
    {children}
  </button>
);

export default Button;
