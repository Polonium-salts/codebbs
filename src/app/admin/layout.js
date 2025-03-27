"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  MessageSquare, 
  BarChart, 
  Tag,
  ChevronRight,
  ChevronLeft,
  Menu,
  LogOut,
  Github,
  Puzzle,
  Database,
  Globe
} from 'lucide-react';

// 管理员菜单项
const adminMenuItems = [
  { name: '控制台', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: '文章管理', href: '/admin/posts', icon: FileText },
  { name: '评论管理', href: '/admin/comments', icon: MessageSquare },
  { name: '用户管理', href: '/admin/users', icon: Users },
  { name: '分类管理', href: '/admin/categories', icon: Tag },
  { name: '语言管理', href: '/admin/languages', icon: Globe },
  { name: '数据统计', href: '/admin/stats', icon: BarChart },
  { name: '数据库管理', href: '/admin/database', icon: Database },
  { name: '插件管理', href: '/admin/plugins', icon: Puzzle },
  { name: 'GitHub同步', href: '/admin/github-sync', icon: Github },
  { name: '系统设置', href: '/admin/settings', icon: Settings }
];

export default function AdminLayout({ children }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // 检查用户是否为管理员
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!session || session.user.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
        <h1 className="text-3xl font-bold text-red-500 mb-4">访问被拒绝</h1>
        <p className="text-lg text-muted-foreground mb-6">您没有权限访问管理后台。</p>
        <Link 
          href="/"
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
        >
          返回首页
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* 侧边栏 */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 bg-card border-r border-border`}>
        {/* 侧边栏头部 */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-border">
          {sidebarOpen && (
            <Link href="/admin/dashboard" className="text-xl font-bold">
              后台管理
            </Link>
          )}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md hover:bg-accent"
          >
            {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>
        
        {/* 侧边栏菜单 */}
        <nav className="p-4">
          <ul className="space-y-1">
            {adminMenuItems.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-x-3 rounded-md p-2 text-sm font-medium
                    ${pathname === item.href || pathname.startsWith(`${item.href}/`)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }
                    ${!sidebarOpen && 'justify-center'}
                  `}
                >
                  <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  {sidebarOpen && <span>{item.name}</span>}
                </Link>
              </li>
            ))}
          </ul>
          
          <div className="mt-8 pt-4 border-t border-border">
            <Link
              href="/"
              className={`
                flex items-center gap-x-3 rounded-md p-2 text-sm font-medium
                text-muted-foreground hover:bg-accent hover:text-accent-foreground
                ${!sidebarOpen && 'justify-center'}
              `}
            >
              <Menu className="h-5 w-5 shrink-0" aria-hidden="true" />
              {sidebarOpen && <span>返回前台</span>}
            </Link>
          </div>
        </nav>
      </div>
      
      {/* 主内容区 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部导航 */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-border">
          <div className="flex items-center">
            <h1 className="text-lg font-medium">
              {adminMenuItems.find(item => pathname === item.href || pathname.startsWith(`${item.href}/`))?.name || '管理后台'}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {session?.user?.image ? (
              <img 
                src={session.user.image} 
                alt={session.user.name || "管理员"} 
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-bold text-primary">
                  {session?.user?.name?.[0] || session?.user?.email?.[0] || "A"}
                </span>
              </div>
            )}
            <span className="text-sm font-medium">{session?.user?.name || session?.user?.email}</span>
          </div>
        </header>
        
        {/* 页面内容 */}
        <main className="flex-1 overflow-y-auto p-6 bg-background/50">
          {children}
        </main>
      </div>
    </div>
  );
} 