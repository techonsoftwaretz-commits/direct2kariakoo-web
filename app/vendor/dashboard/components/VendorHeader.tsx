"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Home, Package, MessageSquare, Settings } from "lucide-react";

export default function VendorHeader({ vendor }: { vendor?: any }) {
  const pathname = usePathname();

  /* ------------------------ DYNAMIC PAGE TITLE ------------------------ */
  const getPageTitle = () => {
    if (pathname.includes("/vendor/orders")) return "Orders";
    if (pathname.includes("/vendor/messages")) return "Messages";
    if (pathname.includes("/vendor/settings")) return "Settings";
    if (pathname.includes("/vendor/products")) return "My Products";
    return "Dashboard";
  };

  /* ------------------------ IMAGE HANDLER ------------------------ */
  const logoUrl = vendor?.logo
    ? vendor.logo.startsWith("http")
      ? vendor.logo
      : `${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "")}/storage/${vendor.logo}`
    : null;

  /* ------------------------ NAVIGATION LINKS ------------------------ */
  const navItems = [
    { label: "Dashboard", href: "/vendor/dashboard", icon: Home },
    { label: "Orders", href: "/vendor/orders", icon: Package },
    { label: "Messages", href: "/vendor/messages", icon: MessageSquare },
    { label: "Settings", href: "/vendor/settings", icon: Settings },
  ];

  /* ------------------------ MAIN RENDER ------------------------ */
  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-40">
      <div className="flex justify-between items-center px-5 py-4">
        {/* LEFT SECTION — LOGO & TITLE */}
        <div className="flex items-center gap-3">
          {/* Vendor Logo */}
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt="Vendor Logo"
              width={44}
              height={44}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-11 h-11 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-semibold">
              VS
            </div>
          )}

          {/* Title + Conditional Greeting */}
          <div>
            <h1 className="font-semibold text-gray-800 text-[17px]">
              {getPageTitle()}
            </h1>

            {/* ✅ Show "Welcome back..." ONLY on Dashboard */}
            {pathname === "/vendor/dashboard" && (
              <p className="text-sm text-gray-500">
                Welcome back, {vendor?.business_name || vendor?.name || "Vendor"} 👋
              </p>
            )}
          </div>
        </div>

        {/* CENTER — NAVIGATION (Desktop Only) */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map(({ label, href, icon: Icon }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 transition-all ${
                  isActive
                    ? "text-teal-600 font-semibold"
                    : "text-gray-700 hover:text-teal-600"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* RIGHT — NOTIFICATION BELL */}
        <div className="relative">
          <Bell className="w-6 h-6 text-gray-700" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full">
            0
          </span>
        </div>
      </div>
    </header>
  );
}
