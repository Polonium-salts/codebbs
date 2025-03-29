"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { useTranslation } from "./LanguageProvider";

// Same navigation items as in Sidebar
const navigation = [
  { name: "sidebar.feed", href: "/", icon: HomeIcon },
  { name: "categories.title", href: "/categories", icon: FolderIcon },
  { name: "common.messages", href: "/messages", icon: MessageSquareIcon },
  { name: "common.profile", href: "/profile", icon: UserIcon },
];

export function MobileNavbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { t } = useTranslation();

  return (
    <motion.div 
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-md border-t border-border/50 shadow-lg pb-safe"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-60" />
      <nav className="px-2 sm:px-4 max-w-md mx-auto">
        <ul className="flex justify-around">
          {navigation.map((item) => (
            <li key={item.name} className="relative">
              <Link
                href={item.href}
                className={`
                  flex flex-col items-center py-3 px-2
                  ${pathname === item.href
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                  }
                `}
              >
                <div className={`p-1.5 rounded-full mb-1 ${pathname === item.href ? 'bg-primary/10' : ''}`}>
                  <item.icon 
                    className="h-5 w-5" 
                    aria-hidden="true" 
                  />
                </div>
                <span className="text-xs font-medium">{t(item.name)}</span>
                {pathname === item.href && (
                  <motion.div
                    className="absolute -bottom-0 left-1/4 right-1/4 h-1 bg-primary rounded-t-full"
                    layoutId="mobile-navbar-indicator"
                    transition={{ duration: 0.3 }}
                  />
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </motion.div>
  );
}

// Icons (same as in Sidebar.js)
function HomeIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function DocumentIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function FolderIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
    </svg>
  );
}

function MessageSquareIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function UserIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
} 