"use client";

import { useState, useEffect } from "react";
import ActiveOrdersTab from "./components/ActiveOrdersTab";
import OrderHistoryTab from "./components/OrderHistoryTab";
import RefundTab from "./components/RefundTab";
import VendorHeader from "../dashboard/components/VendorHeader";

/* -------------------------------------------------------------------------- */
/* 🌟 Vendor Orders Page — Optimized + Shimmer + Cache + Smooth Transitions    */
/* -------------------------------------------------------------------------- */
export default function VendorOrdersPage() {
  const tabs = ["Active Orders", "Order History", "Refund"];
  const [selected, setSelected] = useState(0);
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const CACHE_KEY_VENDOR = "vendor_orders_page_vendor";
  const CACHE_KEY_TAB = "vendor_orders_page_tab";
  const CACHE_EXPIRY_MS = 12 * 60 * 60 * 1000; // 12 hours

  /* -------------------------------------------------------------------------- */
  /* 🧠 Load Cached Data                                                        */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    const now = Date.now();
    const cachedVendor = localStorage.getItem(CACHE_KEY_VENDOR);
    const cachedTime = localStorage.getItem(`${CACHE_KEY_VENDOR}_time`);
    const cachedTab = localStorage.getItem(CACHE_KEY_TAB);

    if (cachedVendor && cachedTime && now - parseInt(cachedTime) < CACHE_EXPIRY_MS) {
      setVendor(JSON.parse(cachedVendor));
      if (cachedTab) setSelected(parseInt(cachedTab));
      setLoading(false);
    }

    // Always fetch vendor fresh in background
    fetchVendor();
    const interval = setInterval(fetchVendor, 60000); // refresh every 60s
    return () => clearInterval(interval);
  }, []);

  const fetchVendor = async () => {
    try {
      setRefreshing(true);
      const storedVendor = localStorage.getItem("vendor");
      if (storedVendor) {
        const vendorData = JSON.parse(storedVendor);
        setVendor(vendorData);
        localStorage.setItem(CACHE_KEY_VENDOR, JSON.stringify(vendorData));
        localStorage.setItem(`${CACHE_KEY_VENDOR}_time`, Date.now().toString());
      }
    } catch (err) {
      console.error("❌ Failed to fetch vendor:", err);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /* 💾 Save selected tab in cache                                              */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    localStorage.setItem(CACHE_KEY_TAB, selected.toString());
  }, [selected]);

  /* -------------------------------------------------------------------------- */
  /* ✨ Shimmer Loader                                                          */
  /* -------------------------------------------------------------------------- */
  const OrdersShimmer = () => (
    <div className="px-4 mt-5 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-white border border-gray-100 shadow-sm rounded-xl p-4 mb-4"
        >
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
          <div className="h-3 bg-gray-100 rounded w-2/3 mb-2"></div>
          <div className="h-3 bg-gray-100 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );

  /* -------------------------------------------------------------------------- */
  /* 📦 Tabs Content Array                                                      */
  /* -------------------------------------------------------------------------- */
  const tabComponents = [
    <ActiveOrdersTab key="active" />,
    <OrderHistoryTab key="history" />,
    <RefundTab key="refund" />,
  ];

  /* -------------------------------------------------------------------------- */
  /* 🌀 Page Loading Fallback                                                   */
  /* -------------------------------------------------------------------------- */
  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <VendorHeader vendor={vendor} />
        <header className="bg-white text-center py-4 shadow-sm border-b border-gray-100 mt-2">
          <h1 className="text-lg font-semibold text-gray-800">Orders</h1>
        </header>
        <div className="flex justify-center items-center h-[70vh] text-gray-400">
          <OrdersShimmer />
        </div>
      </div>
    );

  /* -------------------------------------------------------------------------- */
  /* 💫 Main Render                                                            */
  /* -------------------------------------------------------------------------- */
  return (
    <div className="min-h-screen bg-gray-50 pb-24 animate-fadeIn font-poppins">
      {/* Header */}
      <VendorHeader vendor={vendor} />

      {/* Title */}
      <header className="bg-white text-center py-4 shadow-sm border-b border-gray-100 mt-2">
        <h1 className="text-lg font-semibold text-gray-800">Orders</h1>
      </header>

      {/* Refresh Indicator */}
      {refreshing && (
        <div className="flex justify-center py-2 text-xs text-gray-400 animate-pulse">
          Refreshing vendor data...
        </div>
      )}

      {/* Tabs */}
      <div className="flex mx-4 my-3 bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm">
        {tabs.map((t, i) => (
          <button
            key={i}
            onClick={() => setSelected(i)}
            className={`flex-1 py-2.5 text-sm font-medium transition-all duration-200 ${
              selected === i
                ? "bg-black text-white shadow-inner"
                : "bg-transparent text-gray-700 hover:bg-gray-100"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Active Tab Content */}
      <div className="px-4 pb-20 transition-opacity duration-300 ease-in-out">
        {tabComponents[selected]}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* ✨ Fade Animation (Global)                                                  */
/* -------------------------------------------------------------------------- */
if (typeof window !== "undefined") {
  if (!document.getElementById("fadein-style")) {
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
}
