export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="bg-card border border-border/50 rounded-xl p-8 max-w-md w-full text-center">
        <div className="mb-6 text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
            <line x1="1" y1="1" x2="23" y2="23"></line>
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
            <path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path>
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
            <line x1="12" y1="20" x2="12.01" y2="20"></line>
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-4">您当前处于离线状态</h1>
        <p className="text-muted-foreground mb-6">
          看起来您的网络连接已断开。请检查您的网络连接并重试。
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          重新连接
        </button>
      </div>
    </div>
  );
} 