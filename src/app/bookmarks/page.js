import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import BookmarkList from '@/components/BookmarkList';

export default async function BookmarksPage({ searchParams }) {
  const session = await getServerSession(authOptions);
  const userId = searchParams.userId || (session?.user?.id || null);
  
  if (!userId) {
    redirect('/auth/signin');
  }
  
  // 获取要显示的用户信息
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, image: true }
  });
  
  if (!targetUser) {
    redirect('/');
  }
  
  // 检查是否是当前用户
  const isCurrentUser = session?.user?.id === userId;
  
  // 如果不是当前用户，且没有userId参数，则重定向
  if (!isCurrentUser && !searchParams.userId) {
    redirect('/');
  }
  
  // 获取用户收藏的文章
  const bookmarks = await prisma.bookmark.findMany({
    where: {
      userId: userId
    },
    include: {
      post: {
        select: {
          id: true,
          title: true,
          content: true,
          createdAt: true,
          views: true,
          author: {
            select: {
              id: true,
              name: true,
              image: true
            }
          },
          category: true,
          _count: {
            select: {
              comments: true,
              likes: true,
              bookmarks: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  // 序列化日期
  const serializedBookmarks = bookmarks.map(bookmark => ({
    ...bookmark,
    createdAt: bookmark.createdAt.toISOString(),
    post: {
      ...bookmark.post,
      createdAt: bookmark.post.createdAt.toISOString(),
    }
  }));
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">
          {isCurrentUser ? '我收藏的文章' : `${targetUser.name} 收藏的文章`}
        </h1>
        <div className="flex gap-2">
          {!isCurrentUser && (
            <Link href={`/users/${targetUser.id}`} className="text-blue-500 hover:underline">
              返回用户主页
            </Link>
          )}
          <Link href="/" className="text-blue-500 hover:underline">
            返回首页
          </Link>
        </div>
      </div>
      
      <BookmarkList bookmarks={serializedBookmarks} showRemoveButton={isCurrentUser} />
    </div>
  );
} 