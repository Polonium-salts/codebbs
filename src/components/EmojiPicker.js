'use client';

import { useState, useRef, useEffect } from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { useTheme } from 'next-themes';

const EmojiPicker = ({ onEmojiSelect, buttonClassName }) => {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef(null);
  const { theme } = useTheme();

  const handleEmojiSelect = (emoji) => {
    if (onEmojiSelect) {
      onEmojiSelect(emoji.native);
    }
    setShowPicker(false);
  };

  // 处理点击外部关闭选择器
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPicker]);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className={buttonClassName || "p-2 text-muted-foreground hover:text-foreground rounded-md transition-colors"}
        aria-label="插入表情"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
          <line x1="9" y1="9" x2="9.01" y2="9"></line>
          <line x1="15" y1="9" x2="15.01" y2="9"></line>
        </svg>
      </button>

      {showPicker && (
        <div 
          ref={pickerRef}
          className="absolute bottom-10 right-0 z-50"
          style={{ boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}
        >
          <Picker
            data={data}
            onEmojiSelect={handleEmojiSelect}
            theme={theme === 'dark' ? 'dark' : 'light'}
            previewPosition="none"
            skinTonePosition="none"
            maxFrequentRows={1}
          />
        </div>
      )}
    </div>
  );
};

export default EmojiPicker; 