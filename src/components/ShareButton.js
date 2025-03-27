"use client";

import { useState, useRef, useEffect } from 'react';
import { Share, X, Copy, Check, Twitter, Facebook, Linkedin, Mail, QrCode } from 'lucide-react';
import { generateQRCodeURL } from '@/lib/utils';

export default function ShareButton({ title, url, className }) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const shareMenuRef = useRef(null);
  
  // 使用当前页面 URL 如果没有提供
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const shareTitle = title || document.title;
  
  // 处理点击事件
  const handleShare = (e) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
    setShowQR(false); // 重置QR码状态
  };
  
  // 复制链接到剪贴板
  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      (err) => {
        console.error('无法复制: ', err);
      }
    );
  };
  
  // 关闭分享菜单的点击外部事件监听
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowQR(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  
  // 使用 Web Share API (如果可用)
  const handleNativeShare = () => {
    if (navigator.share) {
      navigator.share({
        title: shareTitle,
        url: shareUrl
      }).then(() => {
        console.log('分享成功');
        logShare('NativeShare');
      }).catch((error) => {
        console.log('分享失败', error);
      });
    } else {
      setIsOpen(true);
    }
  };
  
  // 切换显示QR码
  const toggleQRCode = () => {
    setShowQR(!showQR);
  };
  
  // 记录分享统计
  const logShare = async (platform) => {
    try {
      const postId = shareUrl.split('/').pop().split('?')[0];
      
      if (postId) {
        await fetch('/api/posts/share', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            postId,
            platform
          })
        });
      }
    } catch (error) {
      console.error('记录分享统计失败:', error);
    }
  };
  
  // 处理社交媒体分享
  const handleSocialShare = (platform) => {
    logShare(platform);
    setIsOpen(false);
  };
  
  return (
    <div className="relative" ref={shareMenuRef}>
      <button 
        onClick={navigator.share ? handleNativeShare : handleShare}
        className={`inline-flex items-center gap-2 transition-colors ${className || ''}`}
      >
        <Share className="h-5 w-5" />
        分享
      </button>
      
      {isOpen && (
        <div className="absolute right-0 bottom-full mb-2 bg-card border border-border rounded-lg shadow-lg p-3 min-w-[220px] z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex justify-between items-center mb-2 pb-2 border-b border-border">
            <span className="text-sm font-medium">{showQR ? '扫码分享' : '分享到'}</span>
            <button 
              onClick={() => {
                if (showQR) {
                  setShowQR(false);
                } else {
                  setIsOpen(false);
                }
              }}
              className="p-1 hover:bg-accent rounded-full"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          {showQR ? (
            <div className="flex flex-col items-center p-2">
              <div className="bg-white p-2 rounded-md mb-2">
                <img 
                  src={generateQRCodeURL(shareUrl)}
                  alt="QR Code"
                  className="w-[150px] h-[150px]"
                />
              </div>
              <p className="text-xs text-center text-muted-foreground mt-1 mb-3">
                扫描二维码在移动设备上查看
              </p>
              <button 
                onClick={() => setShowQR(false)}
                className="w-full text-sm py-1.5 px-3 bg-accent/50 rounded-md hover:bg-accent transition-colors"
              >
                返回分享选项
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <a 
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 hover:bg-accent rounded-md transition-colors"
                  onClick={() => handleSocialShare('Twitter')}
                >
                  <Twitter className="h-4 w-4 text-[#1DA1F2]" />
                  <span className="text-sm">Twitter</span>
                </a>
                
                <a 
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 hover:bg-accent rounded-md transition-colors"
                  onClick={() => handleSocialShare('Facebook')}
                >
                  <Facebook className="h-4 w-4 text-[#1877F2]" />
                  <span className="text-sm">Facebook</span>
                </a>
                
                <a 
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 hover:bg-accent rounded-md transition-colors"
                  onClick={() => handleSocialShare('LinkedIn')}
                >
                  <Linkedin className="h-4 w-4 text-[#0A66C2]" />
                  <span className="text-sm">LinkedIn</span>
                </a>
                
                <a 
                  href={`mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(shareUrl)}`}
                  className="flex items-center gap-2 p-2 hover:bg-accent rounded-md transition-colors"
                  onClick={() => handleSocialShare('Email')}
                >
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">邮件</span>
                </a>
              </div>
              
              <div className="mt-2 pt-2 border-t border-border space-y-2">
                <button 
                  onClick={copyToClipboard}
                  className="w-full flex items-center justify-center gap-2 p-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-md transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span className="text-sm">已复制</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span className="text-sm">复制链接</span>
                    </>
                  )}
                </button>
                
                <button 
                  onClick={toggleQRCode}
                  className="w-full flex items-center justify-center gap-2 p-2 bg-accent/50 hover:bg-accent text-accent-foreground rounded-md transition-colors"
                >
                  <QrCode className="h-4 w-4" />
                  <span className="text-sm">显示二维码</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
} 