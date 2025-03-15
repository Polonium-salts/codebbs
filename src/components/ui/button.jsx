"use client";

import React from 'react';

export function Button({ children, className, ...props }) {
  return (
    <button
      className={`flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg shadow-lg transition-colors ${className || ''}`}
      {...props}
    >
      {children}
    </button>
  );
} 