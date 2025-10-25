"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  LogOut,
  User,
  Package,
  Bell,
  Settings,
  Star,
  Wallet,
} from "lucide-react";
import VendorHeader from "../dashboard/components/VendorHeader";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function VendorSettingsPage() {
  const [showDialog, setShowDialog] = useState(false);
  const [vendor, setVendor] = useState<any>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  /* ------------------------------ LOAD VENDOR ------------------------------ */
  useEffect(() => {
    const storedVendor = localStorage.getItem("vendor");
    if (storedVendor) {
      try {
        setVendor(JSON.parse(storedVendor));
      } catch {
        localStorage.removeItem("vendor");
      }
    }
  }, []);

  /* ------------------------------- LOGOUT ------------------------------- */
  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await api.post("/logout").catch(() => {}); // graceful logout
    } catch (_) {
      // ignore
    } finally {
      localStorage.removeItem("vendor");
      localStorage.removeItem("token");
      alert("You have been logged out!");
      router.push("/auth/login"); // ✅ Redirect to the login page
    }
  };

  return (
    <main className="min-h-screen bg-[#F1F5F9] pb-24 font-poppins">
      {/* ---------------------------- Header ---------------------------- */}
      <VendorHeader vendor={vendor} />

      <div className="max-w-2xl mx-auto px-5 py-6">
        {/* ==================== ACCOUNT SECTION ==================== */}
        <Section title="Account">
          <Tile icon={User} title="My Profile" href="/vendor/settings/profile" />
          <Tile icon={Package} title="My Products" href="/vendor/dashboard/products" />
          <Tile icon={Star} title="My Subscription" href="/vendor/settings/subscription" />
          <Tile icon={Wallet} title="My Wallet" href="/vendor/settings/wallet" />
        </Section>

        {/* ==================== NOTIFICATIONS & APP ==================== */}
        <Section title="Notifications & App">
          <Tile icon={Bell} title="Push Notifications" href="/vendor/settings/notifications" />
          <Tile
            icon={Settings}
            title="App Preferences"
            onClick={() => alert("Coming soon — App Preferences under development.")}
          />
        </Section>

        {/* ==================== LOGOUT BUTTON ==================== */}
        <button
          onClick={() => setShowDialog(true)}
          className="w-full bg-red-600 text-white font-semibold rounded-xl py-3 mt-6 hover:bg-red-700 transition flex items-center justify-center gap-2 shadow-sm"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>

      {/* ==================== LOGOUT CONFIRMATION DIALOG ==================== */}
      {showDialog && (
        <LogoutDialog
          loading={loggingOut}
          onClose={() => setShowDialog(false)}
          onConfirm={handleLogout}
        />
      )}
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/*                               REUSABLE COMPONENTS                          */
/* -------------------------------------------------------------------------- */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <h3 className="text-xs text-[#0F766E] font-semibold mb-3 tracking-widest uppercase">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Tile({
  icon: Icon,
  title,
  href,
  onClick,
}: {
  icon: any;
  title: string;
  href?: string;
  onClick?: () => void;
}) {
  const content = (
    <div
      onClick={onClick}
      className="flex items-center justify-between bg-white rounded-xl shadow-sm px-4 py-3 hover:bg-gray-50 transition cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <div className="bg-teal-50 p-2.5 rounded-full">
          <Icon className="w-5 h-5 text-teal-700" />
        </div>
        <span className="font-medium text-gray-800 text-[15px]">{title}</span>
      </div>
      <span className="text-gray-400 text-lg font-bold leading-none">›</span>
    </div>
  );

  return href ? (
    <Link href={href} className="block">
      {content}
    </Link>
  ) : (
    content
  );
}

function LogoutDialog({
  onClose,
  onConfirm,
  loading,
}: {
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-lg text-center">
        <h2 className="text-xl font-semibold mb-6 text-gray-900 font-poppins">
          Are you sure?
        </h2>

        <button
          onClick={onConfirm}
          disabled={loading}
          className="w-full bg-yellow-400 text-black font-semibold rounded-lg py-2.5 mb-3 hover:bg-yellow-500 transition disabled:opacity-60"
        >
          {loading ? "Logging out..." : "Logout"}
        </button>

        <button
          onClick={onClose}
          className="w-full border border-gray-300 rounded-lg py-2.5 hover:bg-gray-50 transition font-semibold text-gray-800"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
