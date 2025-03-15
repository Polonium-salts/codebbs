import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  
  if (!query.trim()) {
    return NextResponse.json({ posts: [], users: [] });
  }

  try {
    // 尝试使用基本的 Prisma 查询，因为这在 SQLite 中也应该可以工作
    const posts = await prisma.post.findMany({
      where: {
        AND: [
          { published: true },
          {
            OR: [
              { title: { contains: query } },
              { content: { contains: query } },
            ],
          },
        ],
      },
      include: {
        author: { select: { name: true, image: true } },
        category: { select: { name: true } },
        _count: { select: { comments: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { email: { contains: query } },
        ],
      },
      select: {
        id: true,
        name: true,
        image: true,
        email: true,
        _count: { select: { posts: true } }
      },
      take: 5,
    });

    return NextResponse.json({ 
      posts, 
      users,
      query 
    });
  } catch (error) {
    console.error('Search error:', error);
    
    // 如果上面的方法失败，尝试使用原生 SQL 查询作为备用方案
    try {
      const posts = await prisma.$queryRaw`
        SELECT 
          p.id, p.title, p.content, p.createdAt, p.views,
          u.id as authorId, u.name as authorName, u.image as authorImage,
          c.id as categoryId, c.name as categoryName,
          COUNT(cm.id) as commentCount
        FROM Post p
        JOIN User u ON p.authorId = u.id
        JOIN Category c ON p.categoryId = c.id
        LEFT JOIN Comment cm ON cm.postId = p.id
        WHERE p.published = 1
          AND (p.title LIKE ${'%' + query + '%'} OR p.content LIKE ${'%' + query + '%'})
        GROUP BY p.id
        ORDER BY p.createdAt DESC
        LIMIT 10
      `;

      const users = await prisma.$queryRaw`
        SELECT 
          u.id, u.name, u.email, u.image,
          COUNT(p.id) as postCount
        FROM User u
        LEFT JOIN Post p ON p.authorId = u.id
        WHERE u.name LIKE ${'%' + query + '%'} OR u.email LIKE ${'%' + query + '%'}
        GROUP BY u.id
        LIMIT 5
      `;

      // 格式化结果以匹配之前的响应结构
      const formattedPosts = posts.map(post => ({
        id: post.id,
        title: post.title,
        content: post.content,
        createdAt: new Date(post.createdAt).toISOString(),
        views: Number(post.views),
        author: {
          name: post.authorName,
          image: post.authorImage
        },
        category: {
          name: post.categoryName
        },
        _count: {
          comments: Number(post.commentCount)
        }
      }));

      const formattedUsers = users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        _count: {
          posts: Number(user.postCount)
        }
      }));

      return NextResponse.json({ 
        posts: formattedPosts, 
        users: formattedUsers,
        query 
      });
    } catch (sqlError) {
      console.error('SQL fallback search error:', sqlError);
      return NextResponse.json(
        { error: 'Failed to perform search', details: error.message },
        { status: 500 }
      );
    }
  }
} 