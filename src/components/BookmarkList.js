'use client';

import { useState } from 'react';
import Link from 'next/link';
import BookmarkItem from './BookmarkItem';

export default function BookmarkList({ bookmarks: initialBookmarks, showRemoveButton = true }) {
  const [bookmarks, setBookmarks] = useState(initialBookmarks);
  
  const handleRemoveBookmark = (bookmarkId) => {
    setBookmarks(bookmarks.filter(bookmark => bookmark.id !== bookmarkId));
  };
  
  if (bookmarks.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <div className="text-gray-500 mb-4">暂无收藏文章</div>
        <Link href="/" className="text-blue-500 hover:underline">
          浏览文章
        </Link>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 gap-6">
      {bookmarks.map((bookmark) => (
        <BookmarkItem 
          key={bookmark.id} 
          bookmark={bookmark} 
          onRemove={handleRemoveBookmark} 
          showRemoveButton={showRemoveButton}
        />
      ))}
    </div>
  );
} 