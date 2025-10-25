"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { ArrowLeft, Phone, MapPin } from "lucide-react";

interface Product {
  name: string;
  images?: { image: string }[] | string[];
}

interface Vendor {
  business_name?: string;
  business_address?: string;
  phone?: string;
  logo?: string;
}

interface Order {
  id: number;
  status: string;
  total: number;
  quantity: number;
  created_at: string;
  product?: Product;
  vendor?: Vendor;
}

const CACHE_KEY = "d2k_orders_cache";
const CACHE_TIME = "d2k_orders_cache_time";
const CACHE_EXPIRY = 1000 * 60 * 10; // 10 minutes

export default function OrdersPage() {
  const router = useRouter();
  const api = process.env.NEXT_PUBLIC_API_URL;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(0);

  const tabs = ["Active Orders", "Order History", "Refunds"];

  useEffect(() => {
    let cancelled = false;

    const fetchOrders = async () => {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        const cachedTime = localStorage.getItem(CACHE_TIME);
        const now = Date.now();

        // ✅ Load cached immediately if recent
        if (cached && cachedTime && now - parseInt(cachedTime) < CACHE_EXPIRY) {
          const parsed = JSON.parse(cached);
          if (!cancelled) {
            setOrders(parsed);
            setLoading(false);
          }
        }

        const token = localStorage.getItem("token");
        if (!token) return router.push("/user/login");

        // ✅ Safe timeout (5s)
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        try {
          const res = await axios.get(`${api}/orders`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          });
          clearTimeout(timeout);

          const fetchedOrders = res.data.orders || [];
          if (!cancelled) {
            setOrders(fetchedOrders);
            localStorage.setItem(CACHE_KEY, JSON.stringify(fetchedOrders));
            localStorage.setItem(CACHE_TIME, now.toString());
          }
        } catch (err: any) {
          clearTimeout(timeout);
          // 🧩 Ignore Abort errors quietly
          if (err.name === "CanceledError" || err.code === "ERR_CANCELED") {
            console.warn("⏱️ Order fetch timeout — using cache");
          } else {
            console.error("❌ API Error:", err);
            if (!cancelled) {
              const cached = localStorage.getItem(CACHE_KEY);
              if (cached) {
                setOrders(JSON.parse(cached));
              } else {
                setError("Failed to load your orders.");
              }
            }
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchOrders();

    return () => {
      cancelled = true;
    };
  }, [api, router]);

  // 🔁 Categorize orders
  const activeOrders = orders.filter(
    (o) =>
      o.status === "pending" ||
      o.status === "paid" ||
      o.status === "processing"
  );
  const historyOrders = orders.filter(
    (o) => o.status === "completed" || o.status === "failed"
  );
  const refundOrders = orders.filter((o) => o.status === "refunded");

  const getDisplayStatus = (status: string) => {
    switch (status) {
      case "processing":
        return "In Progress";
      case "pending":
        return "Pending";
      case "paid":
        return "Paid";
      case "completed":
        return "Completed";
      case "failed":
        return "Failed";
      case "refunded":
        return "Refunded";
      default:
        return status;
    }
  };

  const renderOrders = (list: Order[], emptyText: string) =>
    list.length === 0 ? (
      <div className="text-center py-20 text-gray-500 text-sm">{emptyText}</div>
    ) : (
      <div className="space-y-4">
        {list.map((order) => {
          const image =
            typeof order.product?.images?.[0] === "string"
              ? order.product?.images?.[0]
              : order.product?.images?.[0]?.image;

          const vendorData = order.vendor || (order as any).vendor_data;
          const vendorName =
            vendorData?.business_name || vendorData?.name || "Unknown Vendor";
          const vendorLocation =
            vendorData?.business_address || vendorData?.location || "N/A";
          const vendorPhone = vendorData?.phone || "";
          const vendorLogo = vendorData?.logo
            ? vendorData.logo.startsWith("http")
              ? vendorData.logo
              : `${process.env.NEXT_PUBLIC_STORAGE_URL}/${vendorData.logo}`
            : null;

          const displayStatus = getDisplayStatus(order.status);

          const statusColor =
            order.status === "completed"
              ? "bg-green-100 text-green-700"
              : order.status === "paid" || order.status === "processing"
              ? "bg-blue-100 text-blue-700"
              : order.status === "failed"
              ? "bg-red-100 text-red-700"
              : order.status === "refunded"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-gray-100 text-gray-700";

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
                    alt={order.product?.name || "Product"}
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
                  <div className="flex items-center gap-2">
                    {vendorLogo ? (
                      <img
                        src={vendorLogo}
                        alt={vendorName}
                        className="w-7 h-7 rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-bold">
                        {vendorName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <p className="text-sm font-semibold text-gray-800 leading-tight">
                      {vendorName}
                    </p>
                  </div>

                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${statusColor}`}
                  >
                    {displayStatus}
                  </span>
                </div>

                <div className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-teal-600" />
                  {vendorLocation}
                </div>

                <div className="mt-2">
                  <h3 className="font-medium text-gray-900 text-[15px] line-clamp-1">
                    {order.product?.name || "Product"}
                  </h3>
                  <p className="text-sm text-gray-700 mt-1">
                    Qty: {order.quantity} •{" "}
                    <span className="font-semibold text-gray-900">
                      TZS {order.total.toLocaleString()}
                    </span>
                  </p>
                </div>

                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-400">
                    {new Date(order.created_at).toLocaleDateString()}
                  </span>
                  {vendorPhone && (
                    <a
                      href={`tel:${vendorPhone}`}
                      className="flex items-center gap-1 text-sm text-teal-700 font-medium hover:text-teal-800 transition"
                    >
                      <Phone className="w-4 h-4" />
                      {vendorPhone}
                    </a>
                  )}
                </div>

                {vendorPhone && (
                  <div className="mt-3">
                    <a
                      href={`tel:${vendorPhone}`}
                      className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold py-2 rounded-lg transition w-full"
                    >
                      <Phone className="w-4 h-4" />
                      Call Vendor
                    </a>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );

  if (loading)
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-black mb-3"></div>
        <p className="text-gray-500 text-lg">Loading your orders...</p>
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center items-center h-screen text-red-600 font-medium">
        {error}
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="sticky top-0 bg-white shadow-sm border-b border-gray-100 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-700 hover:text-black transition"
          >
            <ArrowLeft size={22} />
            <span className="font-medium hidden sm:inline">Back</span>
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            My Orders
          </h1>
          <div className="w-[30px] sm:w-[60px]" />
        </div>

        <div className="flex mx-4 my-3 bg-white rounded-lg overflow-hidden border border-gray-200">
          {["Active Orders", "Order History", "Refunds"].map((t, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`flex-1 py-2.5 text-sm font-medium transition-all ${
                selected === i
                  ? "bg-black text-white"
                  : "bg-transparent text-gray-700 hover:bg-gray-100"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {selected === 0 &&
          renderOrders(activeOrders, "No active orders found.")}
        {selected === 1 &&
          renderOrders(historyOrders, "No order history yet.")}
        {selected === 2 &&
          renderOrders(refundOrders, "No refund requests yet.")}
      </div>
    </div>
  );
}
