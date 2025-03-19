'use client';

import { useRef, useEffect } from 'react';
import SendMessageForm from './SendMessageForm';

const SendMessageModal = ({ isOpen, onClose, recipientId, recipientName }) => {
  const modalRef = useRef(null);
  
  // 处理点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // 阻止背景滚动
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      // 恢复滚动
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);
  
  // 处理ESC键关闭
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-md"
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">发送私信</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label="关闭"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-4">
          <SendMessageForm 
            recipientId={recipientId} 
            recipientName={recipientName}
            onSuccess={onClose}
          />
        </div>
      </div>
    </div>
  );
};

export default SendMessageModal; 