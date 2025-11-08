"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, Home, Package, MessageSquare, Settings, Menu, X } from "lucide-react";

/* -------------------------------------------------------------------------- */
/* 🌟 Vendor Header — Direct2Kariakoo Brand (Yellow + Teal)                   */
/* -------------------------------------------------------------------------- */
export default function VendorHeader({ vendor: propVendor }: { vendor?: any }) {
  const router = useRouter();
  const pathname = usePathname();
  const [vendor, setVendor] = useState<any>(propVendor || null);
  const [loading, setLoading] = useState(!propVendor);
  const [showMenu, setShowMenu] = useState(false);

  const CACHE_KEY = "vendor_header_cache";
  const CACHE_EXPIRY_MS = 5 * 60 * 1000;

  /* -------------------------------------------------------------------------- */
  /* ⚡ Load Vendor (Cache + Silent Refresh)                                   */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    const now = Date.now();
    const cached = localStorage.getItem(CACHE_KEY);
    const cachedTime = localStorage.getItem(`${CACHE_KEY}_time`);

    if (cached && cachedTime && now - parseInt(cachedTime) < CACHE_EXPIRY_MS) {
      setVendor(JSON.parse(cached));
      setLoading(false);
    }

    const stored = localStorage.getItem("vendor");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setVendor(parsed);
        localStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
        localStorage.setItem(`${CACHE_KEY}_time`, Date.now().toString());
      } catch {}
    }

    setLoading(false);
  }, []);

  /* -------------------------------------------------------------------------- */
  /* ✨ Shimmer Loader                                                         */
  /* -------------------------------------------------------------------------- */
  const HeaderShimmer = () => (
    <header className="bg-white shadow-sm border-b border-gray-100 animate-pulse">
      <div className="flex justify-between items-center px-5 py-4">
        <div className="w-32 h-7 bg-gray-200 rounded" />
        <div className="w-6 h-6 bg-gray-200 rounded-full" />
      </div>
    </header>
  );

  /* -------------------------------------------------------------------------- */
  /* 🧩 Navigation Items                                                       */
  /* -------------------------------------------------------------------------- */
  const navItems = [
    { label: "Dashboard", href: "/vendor/dashboard", icon: Home },
    { label: "Orders", href: "/vendor/orders", icon: Package },
    { label: "Messages", href: "/vendor/messages", icon: MessageSquare },
    { label: "Settings", href: "/vendor/settings", icon: Settings },
  ];

  /* -------------------------------------------------------------------------- */
  /* 🧱 Render                                                                 */
  /* -------------------------------------------------------------------------- */
  if (loading) return <HeaderShimmer />;

  return (
    <header className="w-full sticky top-0 z-50 animate-fadeIn">
      {/* 🌟 Yellow Top Bar */}
      <div className="bg-[#FFD43B] flex items-center justify-between px-4 md:px-10 py-3 shadow-sm">
        {/* Left: Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="md:hidden focus:outline-none text-gray-800"
          >
            {showMenu ? <X size={22} /> : <Menu size={22} />}
          </button>

          <Image
            src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/logooo.png`}
            alt="Direct2Kariakoo Vendor"
            width={165}
            height={38}
            className="cursor-pointer"
            onClick={() => router.push("/vendor/dashboard")}
          />
        </div>

        {/* Right: Notification */}
        <div className="relative cursor-pointer hover:scale-105 transition">
          <Bell className="w-6 h-6 text-gray-900" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-teal-600 text-white text-[10px] flex items-center justify-center rounded-full font-semibold">
            0
          </span>
        </div>
      </div>

      {/* 💫 Center Nav (Desktop) */}
      <nav className="hidden md:flex justify-center items-center gap-10 py-2 bg-white/80 backdrop-blur-md border-t border-gray-100">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 px-2 py-1 text-sm transition-all duration-200 ${
                isActive
                  ? "text-teal-700 font-semibold border-b-2 border-teal-600"
                  : "text-gray-700 hover:text-teal-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* 📱 Mobile Drawer */}
      {showMenu && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-md py-3 px-5 animate-fadeIn">
          <div className="flex flex-col gap-3">
            {navItems.map(({ label, href, icon: Icon }) => {
              const isActive = pathname.startsWith(href);
              return (
                <button
                  key={href}
                  onClick={() => {
                    setShowMenu(false);
                    router.push(href);
                  }}
                  className={`flex items-center gap-3 text-left w-full transition ${
                    isActive
                      ? "text-teal-700 font-semibold"
                      : "text-gray-700 hover:text-teal-700"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ✨ Animation */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-in-out; }
      `}</style>
    </header>
  );
}
