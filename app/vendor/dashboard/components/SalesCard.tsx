"use client";

import { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";

/* -------------------------------------------------------------------------- */
/* 🌟 SalesCard — Persistent Cache + Background Refresh + Shimmer Once        */
/* -------------------------------------------------------------------------- */
export default function SalesCard() {
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const CACHE_KEY = "vendor_plan_cache";
  const CACHE_TIME_KEY = "vendor_plan_cache_time";
  const CACHE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

  /* -------------------------------------------------------------------------- */
  /* ⚡ Load Cached Plan Instantly + Silent Background Refresh                  */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    const now = Date.now();
    const cached = localStorage.getItem(CACHE_KEY);
    const cachedTime = localStorage.getItem(CACHE_TIME_KEY);

    // ✅ Use cache instantly
    if (cached && cachedTime && now - parseInt(cachedTime) < CACHE_EXPIRY_MS) {
      try {
        setPlan(JSON.parse(cached));
        setLoading(false);
      } catch {}
    }

    // ✅ Always refresh silently
    fetchPlan(false);

    // ✅ Auto-refresh every 10 min silently
    const interval = setInterval(() => fetchPlan(false), 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  /* -------------------------------------------------------------------------- */
  /* 📡 Fetch Vendor Plan (API or Simulation)                                   */
  /* -------------------------------------------------------------------------- */
  const fetchPlan = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      // 🔹 Replace with your real endpoint when ready
      // const res = await api.get("/vendor/plan");
      // const data = res.data?.plan || res.data || null;

      // 🔹 Simulated example (offline mode)
      const data = {
        name: "Pro Plan",
        uploadLimit: 500,
        expiry: "2025-09-30",
      };

      if (data) {
        setPlan(data);
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
      }
    } catch (err) {
      console.error("❌ Failed to fetch plan:", err);
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /* ✨ Shimmer Loader                                                          */
  /* -------------------------------------------------------------------------- */
  const ShimmerCard = () => (
    <div className="bg-white rounded-xl p-5 shadow-sm mb-4 animate-pulse border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-yellow-50 rounded-full" />
          <div className="h-4 w-32 bg-gray-200 rounded" />
        </div>
        <div className="h-4 w-16 bg-gray-200 rounded" />
      </div>
      <div className="space-y-2 mt-3">
        <div className="h-3 w-56 bg-gray-100 rounded" />
        <div className="h-3 w-44 bg-gray-100 rounded" />
      </div>
      <div className="h-9 w-full bg-yellow-50 rounded-lg mt-4" />
    </div>
  );

  /* -------------------------------------------------------------------------- */
  /* 🧱 Render                                                                 */
  /* -------------------------------------------------------------------------- */
  if (loading && !plan) return <ShimmerCard />;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm mb-4 border border-gray-100 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-full bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-100">
            <Zap className="text-yellow-500 w-5 h-5" />
          </div>
          <h2 className="font-semibold text-gray-800 text-lg">
            Current Package
          </h2>
        </div>
        <span className="text-teal-700 font-semibold text-lg">
          {plan?.name || "—"}
        </span>
      </div>

      {/* Details */}
      <div className="space-y-1.5 text-sm">
        <p className="text-gray-700">
          <span className="font-medium text-gray-900">Upload Limit:</span>{" "}
          {plan?.uploadLimit?.toLocaleString() || 0} times
        </p>
        <p className="text-gray-500">
          <span className="font-medium text-gray-900">Expires:</span>{" "}
          {plan?.expiry || "—"}
        </p>
      </div>

      {/* Upgrade Button */}
      <Link
        href="/vendor/settings/subscription"
        className="block w-full text-center bg-gradient-to-r from-yellow-400 to-yellow-300 text-gray-900 font-medium rounded-lg py-2.5 mt-5 hover:from-yellow-300 hover:to-yellow-200 transition-all duration-200 shadow-sm hover:shadow-md"
      >
        Upgrade Package
      </Link>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 🎬 Fade Animation (Global once)                                            */
/* -------------------------------------------------------------------------- */
if (typeof window !== "undefined" && !document.getElementById("fadein-style")) {
  const style = document.createElement("style");
  style.id = "fadein-style";
  style.innerHTML = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fadeIn { animation: fadeIn .3s ease-in-out; }
  `;
  document.head.appendChild(style);
}
