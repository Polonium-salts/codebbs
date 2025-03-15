"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfileForm({ user }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: user.name || "",
    bio: user.bio || "",
    image: user.image || "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess("个人资料更新成功！");
        router.refresh(); // 刷新页面以显示更新后的数据
      } else {
        const data = await response.json();
        setError(data.message || "更新失败，请重试");
      }
    } catch (err) {
      console.error("更新个人资料时出错:", err);
      setError("发生错误，请稍后再试");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 错误或成功消息 */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <p>{success}</p>
        </div>
      )}

      {/* 用户名 */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-2">
          用户名
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
          required
        />
      </div>

      {/* 头像链接 */}
      <div>
        <label htmlFor="image" className="block text-sm font-medium mb-2">
          头像链接
        </label>
        <input
          type="text"
          id="image"
          name="image"
          value={formData.image}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder="https://example.com/avatar.jpg"
        />
        <p className="text-xs text-muted-foreground mt-1">
          输入头像图片的URL，或使用 <a href="https://ui-avatars.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">ui-avatars.com</a> 生成头像
        </p>
      </div>

      {/* 个人简介 */}
      <div>
        <label htmlFor="bio" className="block text-sm font-medium mb-2">
          个人简介
        </label>
        <textarea
          id="bio"
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          rows="4"
          className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          placeholder="写一些关于你自己的介绍..."
        ></textarea>
      </div>

      {/* 提交按钮 */}
      <div>
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors ${
            isLoading ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {isLoading ? "保存中..." : "保存更改"}
        </button>
      </div>
    </form>
  );
} 