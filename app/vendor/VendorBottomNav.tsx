"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Home,
  Package,
  MessageSquare,
  Settings,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* 🌟 Vendor Bottom Navigation — Yellow/Green World-class UI + Cache + Shimmer */
/* -------------------------------------------------------------------------- */

const navItems = [
  { label: "Dashboard", href: "/vendor/dashboard", icon: Home },
  { label: "Orders", href: "/vendor/orders", icon: Package },
  { label: "Messages", href: "/vendor/messages", icon: MessageSquare },
  { label: "Settings", href: "/vendor/settings", icon: Settings },
];

export default function VendorBottomNav() {
  const pathname = usePathname();
  const [active, setActive] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const CACHE_KEY = "vendor_bottom_nav_active";
  const CACHE_EXPIRY_MS = 10 * 60 * 1000;

  /* -------------------------------------------------------------------------- */
  /* ⚡ Load Cached Active Tab + Silent Refresh                                 */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    const now = Date.now();
    const cached = localStorage.getItem(CACHE_KEY);
    const cachedTime = localStorage.getItem(`${CACHE_KEY}_time`);

    if (cached && cachedTime && now - parseInt(cachedTime) < CACHE_EXPIRY_MS) {
      setActive(cached);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (pathname) {
      setActive(pathname);
      localStorage.setItem(CACHE_KEY, pathname);
      localStorage.setItem(`${CACHE_KEY}_time`, Date.now().toString());
    }
  }, [pathname]);

  /* -------------------------------------------------------------------------- */
  /* ✨ Shimmer Loader (First Render)                                           */
  /* -------------------------------------------------------------------------- */
  const ShimmerNav = () => (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-t border-gray-100 h-[68px] flex justify-around items-center md:hidden animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-2">
          <div className="w-5 h-5 bg-gray-200 rounded-full" />
          <div className="w-8 h-2 bg-gray-100 rounded" />
        </div>
      ))}
    </nav>
  );

  /* -------------------------------------------------------------------------- */
  /* 🧱 Render Navigation                                                       */
  /* -------------------------------------------------------------------------- */
  if (loading) return <ShimmerNav />;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-gray-100 h-[68px] flex justify-around items-center md:hidden shadow-[0_-3px_10px_rgba(0,0,0,0.05)] animate-fadeIn">
      {navItems.map(({ label, href, icon: Icon }) => {
        const isActive = active?.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center justify-center transition-all duration-200 ${
              isActive ? "scale-110" : "opacity-90 hover:opacity-100"
            }`}
          >
            <div
              className={`p-2 rounded-full ${
                isActive
                  ? "bg-gradient-to-br from-yellow-400 to-green-500 text-black shadow-sm"
                  : "text-gray-600"
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-all ${
                  isActive ? "text-black" : "text-gray-500"
                }`}
              />
            </div>
            <span
              className={`text-[12px] mt-1 font-medium transition-all ${
                isActive
                  ? "text-gray-900 font-semibold"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

/* -------------------------------------------------------------------------- */
/* 🎬 Fade Animation Injection (Global once)                                   */
/* -------------------------------------------------------------------------- */
if (typeof window !== "undefined" && !document.getElementById("fadein-style")) {
  const style = document.createElement("style");
  style.id = "fadein-style";
  style.innerHTML = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fadeIn { animation: fadeIn 0.25s ease-in-out; }
  `;
  document.head.appendChild(style);
}
