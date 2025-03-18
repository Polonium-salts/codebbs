import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import FollowTabs from '@/components/follows/FollowTabs';

export default async function FollowsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/signin');
  }
  
  // 获取用户关注的人
  const following = await prisma.follow.findMany({
    where: {
      followerId: session.user.id
    },
    include: {
      following: {
        select: {
          id: true,
          name: true,
          image: true,
          bio: true,
          _count: {
            select: {
              followers: true,
              following: true,
              posts: true
            }
          }
        }
      }
    }
  });
  
  // 获取关注用户的人（粉丝）
  const followers = await prisma.follow.findMany({
    where: {
      followingId: session.user.id
    },
    include: {
      follower: {
        select: {
          id: true,
          name: true,
          image: true,
          bio: true,
          _count: {
            select: {
              followers: true,
              following: true,
              posts: true
            }
          }
        }
      }
    }
  });
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">关注管理</h1>
      <FollowTabs 
        following={following.map(f => f.following)} 
        followers={followers.map(f => f.follower)}
      />
    </div>
  );
} 