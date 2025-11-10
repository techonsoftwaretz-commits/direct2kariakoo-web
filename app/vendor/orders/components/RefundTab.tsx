"use client";

import { useEffect, useState } from "react";
import { RotateCcw, Calendar, Phone } from "lucide-react";

/* -------------------------------------------------------------------------- */
/* 🌟 Refund Tab — Persistent Cache + Smooth UX + Background Refresh          */
/* -------------------------------------------------------------------------- */
export default function RefundTab() {
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const api = process.env.NEXT_PUBLIC_API_URL;

  const CACHE_KEY = "vendor_refunds";
  const CACHE_TIME_KEY = `${CACHE_KEY}_time`;
  const CACHE_EXPIRY_MS = 10 * 60 * 1000; // cache expires in 10 mins

  /* -------------------------------------------------------------------------- */
  /* ⚡ Load Cached Data Instantly + Auto Refresh                              */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    const now = Date.now();
    const cached = localStorage.getItem(CACHE_KEY);
    const cachedTime = localStorage.getItem(CACHE_TIME_KEY);

    // ✅ Load cached data instantly if not expired
    if (cached && cachedTime && now - parseInt(cachedTime) < CACHE_EXPIRY_MS) {
      try {
        const parsed = JSON.parse(cached);
        setRefunds(parsed);
        setLoading(false);
      } catch {}
    }

    // ✅ Fetch fresh data silently in background
    fetchRefunds(false);
    const interval = setInterval(() => fetchRefunds(false), 60000);
    return () => clearInterval(interval);
  }, []);

  /* -------------------------------------------------------------------------- */
  /* 📡 Fetch Vendor Refund Orders                                              */
  /* -------------------------------------------------------------------------- */
  const fetchRefunds = async (showLoader = true) => {
    try {
      if (showLoader) setRefreshing(true);
      const token = localStorage.getItem("token");
      if (!token || !api) return;

      const res = await fetch(`${api}/vendor/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const allOrders = data.orders || [];

      const refunded = allOrders.filter(
        (o: any) => o.status?.toLowerCase() === "refunded"
      );

      setRefunds(refunded);

      // ✅ Save to cache
      localStorage.setItem(CACHE_KEY, JSON.stringify(refunded));
      localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
    } catch (err) {
      console.error("❌ Failed to fetch refund orders:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /* ✨ Shimmer Loader                                                          */
  /* -------------------------------------------------------------------------- */
  const RefundShimmer = () => (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
        >
          <div className="w-24 h-24 bg-gray-200" />
          <div className="flex-1 p-3 space-y-3">
            <div className="h-3 w-2/3 bg-gray-200 rounded" />
            <div className="h-2 w-1/3 bg-gray-100 rounded" />
            <div className="h-2 w-1/2 bg-gray-100 rounded" />
            <div className="h-6 w-full bg-gray-200 rounded mt-2" />
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
        <RefundShimmer />
      </div>
    );

  if (refunds.length === 0)
    return (
      <div className="flex flex-col items-center justify-center py-32 text-gray-500 animate-fadeIn">
        <div className="w-24 h-24 bg-yellow-50 rounded-2xl flex items-center justify-center mb-4">
          <RotateCcw className="w-10 h-10 text-yellow-500" />
        </div>
        <h3 className="font-semibold text-lg text-gray-800">No Refunds Yet</h3>
        <p className="text-sm text-gray-500 mt-1 text-center">
          You have not processed or received any refund orders yet.
        </p>
      </div>
    );

  /* -------------------------------------------------------------------------- */
  /* 💫 Main Render                                                            */
  /* -------------------------------------------------------------------------- */
  return (
    <div className="space-y-4 mb-20 animate-fadeIn">
      {refreshing && (
        <div className="text-xs text-center text-gray-400 animate-pulse pb-1">
          Refreshing refund list...
        </div>
      )}

      {refunds.map((order) => {
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

            {/* 📦 Refund Info */}
            <div className="flex-1 p-3 flex flex-col justify-between">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900 text-[15px] line-clamp-1">
                    {product.name || "Product"} ({order.quantity}x)
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

                {/* 🟡 Status Badge */}
                <span className="text-xs font-semibold px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full capitalize">
                  Refunded
                </span>
              </div>

              {/* 🕓 Date + Total */}
              <div className="flex justify-between items-center mt-2">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(order.created_at).toLocaleDateString()}
                </div>

                <div className="text-sm font-semibold text-yellow-700">
                  TZS {order.total?.toLocaleString()}
                </div>
              </div>

              {/* ☎️ Call Buyer Button */}
              {buyer.phone && (
                <div className="mt-3">
                  <a
                    href={`tel:${buyer.phone}`}
                    className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold py-2 rounded-lg transition w-full"
                  >
                    <Phone className="w-4 h-4" />
                    Call Buyer
                  </a>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* ✨ Fade Animation (Global Once)                                             */
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
