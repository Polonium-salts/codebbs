"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import SendMessageModal from "@/components/SendMessageModal";

export default function SendMessageButtonWrapper({ recipientId, recipientName }) {
  const { data: session } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 不显示给自己发送私信的按钮
  if (!session || session.user.id === recipientId) {
    return null;
  }
  
  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ml-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        发送私信
      </button>
      
      <SendMessageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        recipientId={recipientId}
        recipientName={recipientName}
      />
    </>
  );
} 