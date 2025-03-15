"use client";

import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export default function CommentList({ comments }) {
  if (comments.length === 0) {
    return (
      <div className="text-center py-8">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <p className="text-muted-foreground">暂无评论，成为第一个评论者！</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {comments.map((comment) => (
        <div key={comment.id} className="group">
          <div className="flex items-start gap-3">
            <div className="avatar">
              <div className="w-8 h-8 rounded-full overflow-hidden">
                <img 
                  src={comment.author.image || `https://ui-avatars.com/api/?name=${comment.author.name}`} 
                  alt={comment.author.name} 
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{comment.author.name}</span>
                  <Link 
                    href={`/users/${comment.author.id}`} 
                    className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                  >
                    查看资料
                  </Link>
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </div>
              </div>
              <div className="text-sm whitespace-pre-wrap break-words bg-accent/5 p-3 rounded-lg">
                {comment.content}
              </div>
              <div className="mt-2 flex items-center text-xs text-muted-foreground">
                <button className="inline-flex items-center hover:text-primary transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                  </svg>
                  赞同
                </button>
                <span className="inline-block mx-2">•</span>
                <button className="inline-flex items-center hover:text-primary transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  回复
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 