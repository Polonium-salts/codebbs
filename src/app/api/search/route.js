import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { memoryCache } from '@/lib/utils';

// 创建缓存键
function createCacheKey(query) {
  return `search_${query.toLowerCase().trim()}`;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  
  if (!query.trim()) {
    return NextResponse.json({ posts: [], users: [] });
  }

  // 检查缓存中是否有结果
  const cacheKey = createCacheKey(query);
  const cachedResult = memoryCache.get(cacheKey);
  
  if (cachedResult) {
    return NextResponse.json(cachedResult);
  }

  try {
    // 优化查询：减少返回的字段，限制结果数量
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
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        views: true,
        author: { 
          select: { 
            name: true, 
            image: true 
          } 
        },
        category: { 
          select: { 
            name: true 
          } 
        },
        _count: { 
          select: { 
            comments: true 
          } 
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // 对文章内容进行截断，减少返回的数据量
    const processedPosts = posts.map(post => ({
      ...post,
      content: post.content.length > 200 ? post.content.substring(0, 200) + '...' : post.content
    }));

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

    const result = { 
      posts: processedPosts, 
      users,
      query 
    };

    // 将结果存入缓存，30秒过期
    memoryCache.set(cacheKey, result, 30000);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Search error:', error);
    
    // 如果上面的方法失败，尝试使用原生 SQL 查询作为备用方案
    try {
      // 优化SQL查询，只选择必要的字段，并限制返回的内容大小
      const posts = await prisma.$queryRaw`
        SELECT 
          p.id, p.title, 
          SUBSTRING(p.content, 1, 200) as content, 
          p.createdAt, p.views,
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
        content: post.content + (post.content.length >= 200 ? '...' : ''),
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

      const result = { 
        posts: formattedPosts, 
        users: formattedUsers,
        query 
      };
      
      // 将SQL查询结果存入缓存，30秒过期
      memoryCache.set(cacheKey, result, 30000);

      return NextResponse.json(result);
    } catch (sqlError) {
      console.error('SQL fallback search error:', sqlError);
      return NextResponse.json(
        { error: 'Failed to perform search', details: error.message },
        { status: 500 }
      );
    }
  }
} 