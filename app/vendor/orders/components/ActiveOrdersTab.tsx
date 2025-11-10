"use client";

import { useEffect, useState } from "react";
import {
  MapPin,
  Clock,
  XCircle,
  RotateCcw,
  CheckCircle2,
  Phone,
  PackageCheck,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* 🌟 Active Orders Tab — Persistent Cache + Silent Refresh + Smooth UX       */
/* -------------------------------------------------------------------------- */
export default function ActiveOrdersTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const api = process.env.NEXT_PUBLIC_API_URL;

  const CACHE_KEY = "vendor_active_orders";
  const CACHE_TIME_KEY = `${CACHE_KEY}_time`;
  const CACHE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

  /* -------------------------------------------------------------------------- */
  /* ⚡ Load Cached Orders Instantly + Background Refresh                       */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    const now = Date.now();
    const cached = localStorage.getItem(CACHE_KEY);
    const cachedTime = localStorage.getItem(CACHE_TIME_KEY);

    // ✅ Load cached orders instantly
    if (cached && cachedTime && now - parseInt(cachedTime) < CACHE_EXPIRY_MS) {
      try {
        setOrders(JSON.parse(cached));
        setLoading(false);
      } catch {}
    }

    fetchOrders(false); // silent refresh
    const interval = setInterval(() => fetchOrders(false), 45000);
    return () => clearInterval(interval);
  }, []);

  /* -------------------------------------------------------------------------- */
  /* 📡 Fetch Vendor Active Orders                                              */
  /* -------------------------------------------------------------------------- */
  const fetchOrders = async (showLoader = true) => {
    try {
      if (showLoader) setRefreshing(true);
      const token = localStorage.getItem("token");
      if (!token || !api) return;

      const res = await fetch(`${api}/vendor/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const allOrders = data.orders || [];

      const active = allOrders.filter(
        (o: any) =>
          ["pending", "paid", "processing"].includes(o.status?.toLowerCase())
      );

      // ✅ Update state + cache
      setOrders(active);
      localStorage.setItem(CACHE_KEY, JSON.stringify(active));
      localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
    } catch (err) {
      console.error("❌ Failed to fetch vendor orders:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /* 🔘 Handle Vendor Order Actions (Optimistic Updates + Cache Sync)          */
  /* -------------------------------------------------------------------------- */
  const handleAction = async (
    id: number,
    action: "approve" | "complete" | "cancel" | "refund"
  ) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return alert("Login required.");

      // ✅ Optimistic UI update first
      setOrders((prev) =>
        prev
          .map((o) =>
            o.id === id
              ? {
                  ...o,
                  status:
                    action === "approve"
                      ? "processing"
                      : action === "complete"
                      ? "completed"
                      : action === "refund"
                      ? "refunded"
                      : action === "cancel"
                      ? "cancelled"
                      : o.status,
                }
              : o
          )
          .filter(
            (o) =>
              !["complete", "refund", "cancel"].includes(action) ||
              o.id !== id
          )
      );

      // ✅ Save new state to cache immediately
      setTimeout(
        () =>
          localStorage.setItem(CACHE_KEY, JSON.stringify(orders.filter((o) => o.id !== id))),
        300
      );

      // ✅ Send API request in background
      const res = await fetch(`${api}/vendor/orders/${id}/${action}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) return alert(data.message || "Action failed");
      alert(data.message || "Action successful");
    } catch (err) {
      console.error("❌ Failed to update order:", err);
      alert("Something went wrong.");
    }
  };

  /* -------------------------------------------------------------------------- */
  /* ✨ Shimmer Loader                                                          */
  /* -------------------------------------------------------------------------- */
  const OrdersShimmer = () => (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
        >
          <div className="w-24 h-24 bg-gray-200" />
          <div className="flex-1 p-3 space-y-3">
            <div className="h-3 w-1/2 bg-gray-200 rounded" />
            <div className="h-2 w-2/3 bg-gray-100 rounded" />
            <div className="h-2 w-1/3 bg-gray-100 rounded" />
            <div className="grid grid-cols-3 gap-2 pt-3">
              <div className="h-6 bg-gray-200 rounded" />
              <div className="h-6 bg-gray-200 rounded" />
              <div className="h-6 bg-gray-200 rounded" />
            </div>
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

  if (orders.length === 0)
    return (
      <div className="text-center text-gray-500 py-20 animate-fadeIn">
        No active orders right now.
      </div>
    );

  /* -------------------------------------------------------------------------- */
  /* 💫 Active Orders UI                                                       */
  /* -------------------------------------------------------------------------- */
  return (
    <div className="space-y-3 mb-20 animate-fadeIn">
      {refreshing && (
        <div className="text-xs text-center text-gray-400 animate-pulse pb-1">
          Refreshing orders...
        </div>
      )}

      {orders.map((order) => {
        const product = order.product || {};
        const buyer = order.buyer || {};
        const image =
          typeof product.images?.[0] === "string"
            ? product.images[0]
            : product.images?.[0]?.image;

        const displayStatus =
          order.status === "processing"
            ? "In Progress"
            : order.status.charAt(0).toUpperCase() + order.status.slice(1);

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
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900 text-[15px] line-clamp-1">
                    {product.name || "Product"} ({order.quantity}x)
                  </h3>
                  <p className="text-xs text-gray-500">
                    {buyer.name || "Unknown"}
                  </p>
                  {buyer.phone && (
                    <a
                      href={`tel:${buyer.phone}`}
                      className="text-xs text-teal-700 flex items-center gap-1 mt-1 font-medium hover:text-teal-800 transition"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {buyer.phone}
                    </a>
                  )}
                </div>

                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${
                    order.status === "processing"
                      ? "bg-blue-100 text-blue-700"
                      : ["pending", "paid"].includes(order.status)
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {displayStatus}
                </span>
              </div>

              {/* Details */}
              <div className="flex justify-between items-center text-xs text-gray-600 mt-2">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(order.created_at).toLocaleDateString()}
                </div>
                <div className="font-semibold text-teal-700">
                  TZS {order.total?.toLocaleString()}
                </div>
              </div>

              <div className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-teal-600" />
                {buyer.address || "No address provided"}
              </div>

              {/* ☎️ Call Buyer */}
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

              {/* 🔘 Action Buttons */}
              <div className="mt-3 grid grid-cols-3 gap-2">
                {["pending", "paid"].includes(order.status) ? (
                  <>
                    <button
                      onClick={() => handleAction(order.id, "approve")}
                      className="flex items-center justify-center gap-1 bg-green-600 text-white text-xs py-2 rounded-lg font-semibold hover:bg-green-700 transition"
                    >
                      <PackageCheck className="w-4 h-4" /> Accept
                    </button>
                    <button
                      onClick={() => handleAction(order.id, "cancel")}
                      className="flex items-center justify-center gap-1 bg-gray-100 border border-gray-300 text-xs py-2 rounded-lg font-medium text-gray-800 hover:bg-gray-200 transition"
                    >
                      <XCircle className="w-4 h-4 text-gray-600" /> Cancel
                    </button>
                    <button
                      onClick={() => handleAction(order.id, "refund")}
                      className="flex items-center justify-center gap-1 bg-yellow-50 border border-yellow-300 text-xs py-2 rounded-lg font-medium text-yellow-700 hover:bg-yellow-100 transition"
                    >
                      <RotateCcw className="w-4 h-4" /> Refund
                    </button>
                  </>
                ) : order.status === "processing" ? (
                  <>
                    <button
                      onClick={() => handleAction(order.id, "complete")}
                      className="flex items-center justify-center gap-1 bg-black text-white text-xs py-2 rounded-lg font-semibold hover:bg-gray-900 transition"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Complete
                    </button>
                    <button
                      onClick={() => handleAction(order.id, "cancel")}
                      className="flex items-center justify-center gap-1 bg-gray-100 border border-gray-300 text-xs py-2 rounded-lg font-medium text-gray-800 hover:bg-gray-200 transition"
                    >
                      <XCircle className="w-4 h-4 text-gray-600" /> Cancel
                    </button>
                    <button
                      onClick={() => handleAction(order.id, "refund")}
                      className="flex items-center justify-center gap-1 bg-yellow-50 border border-yellow-300 text-xs py-2 rounded-lg font-medium text-yellow-700 hover:bg-yellow-100 transition"
                    >
                      <RotateCcw className="w-4 h-4" /> Refund
                    </button>
                  </>
                ) : null}
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
