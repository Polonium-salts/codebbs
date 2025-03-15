"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("两次输入的密码不匹配");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "注册失败");
      }

      // Redirect to login page on successful registration
      router.push("/login?registered=true");
    } catch (error) {
      setError(error.message || "注册失败，请重试。");
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-16">
      <div className="flex flex-col items-center justify-center">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">创建账号</h1>
          <p className="text-muted-foreground">加入我们的社区，开始分享您的想法</p>
        </div>

        {/* 注册卡片 */}
        <div className="w-full max-w-md bg-card border border-border/50 rounded-xl shadow-sm overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-primary"></div>
          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500">
                <p className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">用户名</label>
                <input
                  type="text"
                  name="name"
                  placeholder="你的用户名"
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">电子邮箱</label>
                <input
                  type="email"
                  name="email"
                  placeholder="your@email.com"
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">密码</label>
                <input
                  type="password"
                  name="password"
                  placeholder="至少8位字符"
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                />
                <p className="text-xs text-muted-foreground">密码至少需要8个字符</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">确认密码</label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="再次输入密码"
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  minLength={8}
                />
              </div>
              
              <div>
                <button
                  type="submit"
                  className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors disabled:opacity-70 relative"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center relative z-10">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      创建中...
                    </span>
                  ) : (
                    <span className="relative z-10">创建账号</span>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 border-t border-border pt-6 text-center">
              <p className="text-sm text-muted-foreground">
                已有账号？{" "}
                <Link href="/login" className="text-primary hover:underline">
                  立即登录
                </Link>
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            注册即表示您同意我们的{" "}
            <Link href="/terms" className="text-primary hover:underline">
              服务条款
            </Link>
            {" "}和{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              隐私政策
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 