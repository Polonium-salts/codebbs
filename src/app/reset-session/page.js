"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ResetSessionPage() {
  const router = useRouter();

  useEffect(() => {
    const resetSession = async () => {
      // 清空当前会话状态
      await signOut({ redirect: false });
      
      // 将用户引导到登录页面
      setTimeout(() => {
        router.push("/login?reset=true");
      }, 1500);
    };

    resetSession();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center flex-col">
      <div className="text-2xl font-bold mb-2">重置会话状态中...</div>
      <p className="text-muted-foreground">正在刷新您的登录状态，请稍候...</p>
      <div className="mt-4 animate-pulse text-primary">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-loader">
          <line x1="12" x2="12" y1="2" y2="6" />
          <line x1="12" x2="12" y1="18" y2="22" />
          <line x1="4.93" x2="7.76" y1="4.93" y2="7.76" />
          <line x1="16.24" x2="19.07" y1="16.24" y2="19.07" />
          <line x1="2" x2="6" y1="12" y2="12" />
          <line x1="18" x2="22" y1="12" y2="12" />
          <line x1="4.93" x2="7.76" y1="19.07" y2="16.24" />
          <line x1="16.24" x2="19.07" y1="7.76" y2="4.93" />
        </svg>
      </div>
    </div>
  );
} 