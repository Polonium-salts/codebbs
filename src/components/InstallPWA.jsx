"use client";

import { useState, useEffect } from 'react';
import { Download, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function InstallPWA() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 检测iOS设备
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);

    // 监听beforeinstallprompt事件
    const handleBeforeInstallPrompt = (e) => {
      // 阻止Chrome 67及更早版本自动显示安装提示
      e.preventDefault();
      // 显示安装按钮
      setIsInstallable(true);
      // 保存事件，以便稍后触发
      window.deferredPrompt = e;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 监听appinstalled事件
    const handleAppInstalled = () => {
      // 隐藏安装按钮
      setIsInstallable(false);
      // 清除保存的提示
      window.deferredPrompt = null;
      console.log('PWA 已成功安装');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // 清理事件监听器
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!window.deferredPrompt) {
      return;
    }

    // 显示安装提示
    window.deferredPrompt.prompt();

    // 等待用户响应提示
    const { outcome } = await window.deferredPrompt.userChoice;
    console.log(`用户 ${outcome === 'accepted' ? '接受' : '拒绝'}了安装提示`);

    // 清除保存的提示，因为它只能使用一次
    window.deferredPrompt = null;
  };

  // 如果不可安装，则不显示按钮
  if (!isInstallable && !isIOS) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isInstallable ? (
        <Button onClick={handleInstallClick}>
          <Download className="h-4 w-4" />
          安装应用
        </Button>
      ) : isIOS ? (
        <div className="bg-gray-900/80 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-gray-700 max-w-xs">
          <p className="text-sm mb-2 text-white">在iOS上安装此应用:</p>
          <ol className="text-xs text-gray-300 space-y-1 list-decimal pl-4">
            <li>点击底部的<span className="inline-flex items-center mx-1"><Share className="h-4 w-4 mr-1" />分享</span>按钮</li>
            <li>滚动并选择<span className="font-medium text-white">添加到主屏幕</span></li>
          </ol>
        </div>
      ) : null}
    </div>
  );
} 