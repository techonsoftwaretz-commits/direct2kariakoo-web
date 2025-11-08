"use client";

import { useEffect, useState } from "react";
import { Package, Star, ShoppingBag, BarChart } from "lucide-react";
import { api } from "@/lib/api";

/* -------------------------------------------------------------------------- */
/* 🌟 StatsRow — Modern Grey Aesthetic | Cached | Shimmer | Subtle Accent      */
/* -------------------------------------------------------------------------- */
interface Stats {
  totalProducts: number;
  averageRating: number;
  totalOrders: number;
  totalSales: number;
}

export default function StatsRow({ products }: { products: any[] }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const CACHE_KEY_STATS = "d2k_vendor_stats";
  const CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30 min

  /* -------------------------------------------------------------------------- */
  /* ⚡ Load Cached Stats + Silent Refresh                                      */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    const now = Date.now();
    const cachedStats = localStorage.getItem(CACHE_KEY_STATS);
    const cachedTime = localStorage.getItem(`${CACHE_KEY_STATS}_time`);

    if (cachedStats && cachedTime && now - parseInt(cachedTime) < CACHE_EXPIRY_MS) {
      setStats(JSON.parse(cachedStats));
      setLoading(false);
    }

    fetchStats();
  }, [products]);

  /* -------------------------------------------------------------------------- */
  /* 📊 Fetch Stats                                                             */
  /* -------------------------------------------------------------------------- */
  const fetchStats = async () => {
    try {
      const [ordersRes, productsRes] = await Promise.all([
        api.get("/vendor/orders"),
        api.get("/products"),
      ]);

      const orders: any[] = ordersRes.data?.orders || [];
      const productList: any[] = productsRes.data?.products || [];

      const completedOrders = orders.filter((o) => o.status === "completed");
      const totalSales = completedOrders.reduce(
        (sum: number, o: any) => sum + (Number(o.total) || 0),
        0
      );

      const ratings: number[] = productList
        .map((p: any) => Number(p.average_rating) || 0)
        .filter((r) => r > 0);

      const averageRating =
        ratings.length > 0
          ? Number(
              (
                ratings.reduce((a: number, b: number) => a + b, 0) /
                ratings.length
              ).toFixed(1)
            )
          : 0;

      const newStats: Stats = {
        totalProducts: productList.length,
        averageRating,
        totalOrders: completedOrders.length,
        totalSales,
      };

      setStats(newStats);
      setLoading(false);

      localStorage.setItem(CACHE_KEY_STATS, JSON.stringify(newStats));
      localStorage.setItem(`${CACHE_KEY_STATS}_time`, Date.now().toString());
    } catch (err) {
      console.error("❌ Failed to load stats:", err);
      setLoading(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /* 💰 Formatters                                                              */
  /* -------------------------------------------------------------------------- */
  const formatNumber = (value: number): string =>
    value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const shimmerItems = Array(4).fill(null);

  /* -------------------------------------------------------------------------- */
  /* ✨ Shimmer Loader                                                          */
  /* -------------------------------------------------------------------------- */
  if (loading)
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 animate-fadeIn">
        {shimmerItems.map((_, i) => (
          <div
            key={i}
            className="bg-gray-50 rounded-2xl border border-gray-100 py-5 flex flex-col items-center justify-center shadow-sm animate-pulse"
          >
            <div className="w-8 h-8 bg-gray-200 rounded-full mb-3" />
            <div className="h-3 w-16 bg-gray-200 rounded mb-1" />
            <div className="h-2 w-20 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    );

  /* -------------------------------------------------------------------------- */
  /* 🧱 Render Stats                                                            */
  /* -------------------------------------------------------------------------- */
  const items = stats
    ? [
        { label: "Products", value: stats.totalProducts, icon: Package },
        { label: "Rating", value: stats.averageRating, icon: Star },
        { label: "Orders", value: stats.totalOrders, icon: ShoppingBag },
        {
          label: "Sales",
          value: `TZS ${formatNumber(stats.totalSales)}`,
          icon: BarChart,
        },
      ]
    : [];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 animate-fadeIn">
      {items.map((s, i) => (
        <div
          key={i}
          className="bg-gray-50 rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-center justify-center group transition-all hover:shadow-md hover:bg-gray-100"
        >
          <div className="p-2.5 rounded-full bg-gray-200 group-hover:bg-gray-300 transition">
            <s.icon className="w-5 h-5 text-gray-700" />
          </div>
          <span className="font-semibold text-gray-900 text-[15px] mt-2">
            {s.value}
          </span>
          <span className="text-xs text-gray-500 tracking-wide mt-0.5">
            {s.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 🎬 Fade Animation (Global once)                                             */
/* -------------------------------------------------------------------------- */
if (typeof window !== "undefined" && !document.getElementById("fadein-style")) {
  const style = document.createElement("style");
  style.id = "fadein-style";
  style.innerHTML = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fadeIn { animation: fadeIn .25s ease-in-out; }
  `;
  document.head.appendChild(style);
}
