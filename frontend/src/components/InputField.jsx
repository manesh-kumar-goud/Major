import React from 'react';

const InputField = ({ label, type = 'text', value, onChange, className = '', ...props }) => (
  <div className="mb-4">
    {label && <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">{label}</label>}
    <input
      type={type}
      value={value}
      onChange={onChange}
      className={`w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 transition ${className}`}
      {...props}
    />
  </div>
);

export default InputField;
