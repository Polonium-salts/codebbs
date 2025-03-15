// 检查浏览器是否支持Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Service Worker 注册成功:', registration.scope);
      })
      .catch((error) => {
        console.log('Service Worker 注册失败:', error);
      });
  });
}

// 添加安装提示
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  // 阻止Chrome 67及更早版本自动显示安装提示
  e.preventDefault();
  // 保存事件，以便稍后触发
  deferredPrompt = e;
  // 更新UI通知用户可以安装PWA
  if (window.showInstallPromotion) {
    window.showInstallPromotion();
  }
});

// 导出安装函数，可以在应用中调用
window.installPWA = () => {
  if (!deferredPrompt) {
    return;
  }
  // 显示安装提示
  deferredPrompt.prompt();
  // 等待用户响应提示
  deferredPrompt.userChoice.then((choiceResult) => {
    if (choiceResult.outcome === 'accepted') {
      console.log('用户接受了安装提示');
    } else {
      console.log('用户拒绝了安装提示');
    }
    // 清除保存的提示，因为它只能使用一次
    deferredPrompt = null;
  });
}; 