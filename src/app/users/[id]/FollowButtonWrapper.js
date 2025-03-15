"use client";

import { useState } from "react";
import FollowButton from "@/components/FollowButton";

// 此组件用于在服务器组件中包装客户端组件
export default function FollowButtonWrapper({ userId }) {
  const [statUpdateCount, setStatUpdateCount] = useState(0);

  // 当关注状态更改时更新统计数据
  const handleFollowSuccess = (isFollowing) => {
    // 增加更新计数，这会促使组件在关注状态改变时重新渲染
    setStatUpdateCount(prev => prev + 1);
  };

  return (
    <FollowButton 
      userId={userId} 
      onSuccess={handleFollowSuccess}
      key={`follow-button-${userId}-${statUpdateCount}`}
    />
  );
} 