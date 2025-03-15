"use client";

import { useState } from 'react';

export default function TabSwitcher({ children, tabs }) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="w-full">
      <div className="flex border-b border-border/60 mb-4">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={`px-4 py-2 font-medium text-sm transition-colors relative
              ${activeTab === index 
                ? 'text-primary border-b-2 border-primary -mb-px' 
                : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <div className="flex items-center gap-2">
              {tab.icon}
              {tab.label}
            </div>
          </button>
        ))}
      </div>
      <div>
        {children[activeTab]}
      </div>
    </div>
  );
} 