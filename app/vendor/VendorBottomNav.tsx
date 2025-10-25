"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, MessageSquare, Settings } from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/vendor/dashboard", icon: Home },
  { label: "Orders", href: "/vendor/orders", icon: Package },
  { label: "Messages", href: "/vendor/messages", icon: MessageSquare },
  { label: "Settings", href: "/vendor/settings", icon: Settings },
];

export default function VendorBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 h-[68px] flex justify-around items-center md:hidden">
      {navItems.map(({ label, href, icon: Icon }) => {
        const isActive = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center justify-center text-center"
          >
            <Icon
              className={`w-5 h-5 mb-1 transition-all ${
                isActive ? "text-teal-600" : "text-gray-700"
              }`}
            />
            <span
              className={`text-[13px] font-medium ${
                isActive ? "text-black font-semibold" : "text-gray-600"
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
