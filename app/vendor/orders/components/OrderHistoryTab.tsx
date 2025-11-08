"use client";

import { useEffect, useState } from "react";
import { Calendar, Phone, BarChart3 } from "lucide-react";

/* -------------------------------------------------------------------------- */
/* 🌟 Vendor Order History — Cached + Shimmer + Smooth UX                     */
/* -------------------------------------------------------------------------- */
export default function OrderHistoryTab() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalSales, setTotalSales] = useState(0);
  const api = process.env.NEXT_PUBLIC_API_URL;

  const CACHE_KEY = "vendor_order_history";
  const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 min

  /* -------------------------------------------------------------------------- */
  /* 🧠 Load Cached History + Fetch                                             */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    const now = Date.now();
    const cached = localStorage.getItem(CACHE_KEY);
    const cachedTime = localStorage.getItem(`${CACHE_KEY}_time`);
    if (cached && cachedTime && now - parseInt(cachedTime) < CACHE_EXPIRY_MS) {
      const parsed = JSON.parse(cached);
      setHistory(parsed.history);
      setTotalSales(parsed.totalSales);
      setLoading(false);
    }

    fetchHistory(false);
    const interval = setInterval(() => fetchHistory(false), 60000);
    return () => clearInterval(interval);
  }, []);

  /* -------------------------------------------------------------------------- */
  /* 📦 Fetch Vendor Order History                                              */
  /* -------------------------------------------------------------------------- */
  const fetchHistory = async (showLoader = true) => {
    try {
      if (showLoader) setRefreshing(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${api}/vendor/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const allOrders = data.orders || [];

      const completed = allOrders.filter((o: any) => o.status === "completed");
      setHistory(completed);

      const total = completed.reduce(
        (sum: number, o: any) => sum + (Number(o.total) || 0),
        0
      );
      setTotalSales(total);

      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ history: completed, totalSales: total })
      );
      localStorage.setItem(`${CACHE_KEY}_time`, Date.now().toString());
    } catch (err) {
      console.error("❌ Failed to fetch vendor order history:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /* 💰 Format Money Helper                                                    */
  /* -------------------------------------------------------------------------- */
  const formatMoney = (value: number): string =>
    value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  /* -------------------------------------------------------------------------- */
  /* ✨ Shimmer Loader                                                          */
  /* -------------------------------------------------------------------------- */
  const OrdersShimmer = () => (
    <div className="space-y-4 animate-pulse">
      <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 h-14" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="flex bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
        >
          <div className="w-24 h-24 bg-gray-200" />
          <div className="flex-1 p-3 space-y-3">
            <div className="h-3 w-2/3 bg-gray-200 rounded" />
            <div className="h-2 w-1/3 bg-gray-100 rounded" />
            <div className="h-2 w-1/2 bg-gray-100 rounded" />
          </div>
        </div>
      ))}
    </div>
  );

  /* -------------------------------------------------------------------------- */
  /* 🌀 Loading + Empty States                                                  */
  /* -------------------------------------------------------------------------- */
  if (loading)
    return (
      <div className="px-4 py-6 text-gray-500">
        <OrdersShimmer />
      </div>
    );

  if (history.length === 0)
    return (
      <div className="text-center text-gray-500 py-20 animate-fadeIn">
        No completed orders yet.
      </div>
    );

  /* -------------------------------------------------------------------------- */
  /* 💫 Main Render                                                            */
  /* -------------------------------------------------------------------------- */
  return (
    <div className="space-y-4 mb-20 animate-fadeIn">
      {refreshing && (
        <div className="text-xs text-center text-gray-400 animate-pulse pb-1">
          Updating order history...
        </div>
      )}

      {/* 💰 Total Sales Summary */}
      <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 text-teal-700 font-semibold">
          <BarChart3 className="w-5 h-5" />
          <span>Total Sales</span>
        </div>
        <div className="text-lg font-bold text-teal-800">
          TZS {formatMoney(totalSales)}
        </div>
      </div>

      {/* 🧾 Orders List */}
      {history.map((order) => {
        const product = order.product || {};
        const buyer = order.buyer || {};
        const image =
          typeof product.images?.[0] === "string"
            ? product.images[0]
            : product.images?.[0]?.image;

        return (
          <div
            key={order.id}
            className="flex bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all duration-200"
          >
            {/* 🖼️ Product Image */}
            <div className="w-24 h-24 bg-gray-50 flex-shrink-0">
              {image ? (
                <img
                  src={
                    image.startsWith("http")
                      ? image
                      : `${process.env.NEXT_PUBLIC_STORAGE_URL}/${image}`
                  }
                  alt={product.name || "Product"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                  No Image
                </div>
              )}
            </div>

            {/* 📦 Order Info */}
            <div className="flex-1 p-3 flex flex-col justify-between">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900 text-[15px] line-clamp-1">
                    {product.name || "Unnamed Product"} ({order.quantity}x)
                  </h3>
                  <p className="text-sm text-gray-500">
                    {buyer.name || "Unknown Buyer"}
                  </p>

                  {buyer.phone && (
                    <a
                      href={`tel:${buyer.phone}`}
                      className="flex items-center gap-1 text-sm text-teal-700 font-medium mt-1 hover:text-teal-800 transition"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {buyer.phone}
                    </a>
                  )}
                </div>

                <span className="text-xs font-semibold px-2 py-1 bg-green-100 text-green-700 rounded-full capitalize">
                  {order.status}
                </span>
              </div>

              {/* 🕓 Date + Total */}
              <div className="flex justify-between items-center mt-2">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(order.created_at).toLocaleDateString()}
                </div>

                <div className="text-sm font-bold text-teal-700">
                  TZS {formatMoney(Number(order.total))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
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
