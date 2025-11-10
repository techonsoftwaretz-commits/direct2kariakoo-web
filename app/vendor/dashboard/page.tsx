"use client";

import { useEffect, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import Link from "next/link";
import VendorHeader from "./components/VendorHeader";
import WelcomeHeader from "./components/WelcomeHeader";
import StatsRow from "./components/StatsRow";
import SalesCard from "./components/SalesCard";
import MyProductsCard from "./components/MyProductsCard";
import VendorBottomNav from "../VendorBottomNav";
import { api } from "@/lib/api";

/* -------------------------------------------------------------------------- */
/* 🌟 Vendor Dashboard (Persistent Cached Version)                            */
/* -------------------------------------------------------------------------- */
export default function VendorDashboard() {
  const [vendor, setVendor] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const CACHE_KEY_VENDOR = "d2k_vendor_data";
  const CACHE_KEY_PRODUCTS = "d2k_vendor_products";
  const CACHE_TIME_KEY = "d2k_vendor_cache_time";
  const CACHE_EXPIRY_MS = 12 * 60 * 60 * 1000; // 12h cache

  /* -------------------------------------------------------------------------- */
  /* 🧠 Load Cached Data First                                                  */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    const now = Date.now();
    const cachedVendor = localStorage.getItem(CACHE_KEY_VENDOR);
    const cachedProducts = localStorage.getItem(CACHE_KEY_PRODUCTS);
    const cachedTime = localStorage.getItem(CACHE_TIME_KEY);

    // ✅ Step 1: Use Cache Instantly if Exists and Valid
    if (
      cachedVendor &&
      cachedProducts &&
      cachedTime &&
      now - parseInt(cachedTime) < CACHE_EXPIRY_MS
    ) {
      const vendorData = JSON.parse(cachedVendor);
      const productList = JSON.parse(cachedProducts);
      setVendor(vendorData);
      setProducts(productList);
      setFilteredProducts(productList);
      setLoading(false); // skip shimmer
    } else {
      setLoading(true); // only shimmer when no cache
    }

    // ✅ Step 2: Background Refresh (non-blocking)
    const fetchDashboardData = async () => {
      try {
        const [meRes, dashboardRes, productsRes] = await Promise.all([
          api.get("/me"),
          api.get("/vendor/dashboard"),
          api.get("/products"),
        ]);

        const vendorData =
          dashboardRes.data?.vendor ||
          meRes.data?.vendor ||
          meRes.data?.user?.vendor ||
          {};

        const productList = productsRes.data?.products || [];

        setVendor(vendorData);
        setProducts(productList);
        setFilteredProducts(productList);

        localStorage.setItem(CACHE_KEY_VENDOR, JSON.stringify(vendorData));
        localStorage.setItem(CACHE_KEY_PRODUCTS, JSON.stringify(productList));
        localStorage.setItem(CACHE_TIME_KEY, now.toString());
      } catch (err: any) {
        console.error("❌ Error fetching dashboard data:", err);
        if (err.response?.status === 401) {
          setError("Session expired. Please log in again.");
          localStorage.clear();
          window.location.href = "/frontend/auth/login";
        } else {
          setError("Failed to refresh dashboard data.");
        }
      } finally {
        setLoading(false);
      }
    };

    // Refresh data silently every 10 minutes
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  /* -------------------------------------------------------------------------- */
  /* 🔍 Search (debounced)                                                     */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts(products);
      return;
    }

    const delay = setTimeout(() => {
      setIsSearching(true);
      const q = searchQuery.toLowerCase();

      const results = products.filter((p) => {
        const name = p?.name?.toLowerCase() || "";
        const sub = p?.subcategory?.name?.toLowerCase() || "";
        const attr =
          p?.attribute_values
            ?.map((a: any) => a?.value?.toLowerCase())
            ?.join(" ") || "";
        return name.includes(q) || sub.includes(q) || attr.includes(q);
      });

      setFilteredProducts(results);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(delay);
  }, [searchQuery, products]);

  /* -------------------------------------------------------------------------- */
  /* ✨ Shimmer (only first load if no cache)                                   */
  /* -------------------------------------------------------------------------- */
  const DashboardShimmer = () => (
    <div className="animate-pulse space-y-6">
      <div className="h-8 bg-gray-200 rounded-md w-1/3 mx-auto"></div>
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-20 bg-white border border-gray-100 shadow-sm rounded-lg"
          ></div>
        ))}
      </div>
      <div className="h-40 bg-white border border-gray-100 rounded-lg"></div>
      <div className="h-8 bg-gray-200 rounded-md w-1/2 mx-auto"></div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-40 bg-white rounded-md shadow-sm"></div>
        ))}
      </div>
    </div>
  );

  /* -------------------------------------------------------------------------- */
  /* 🧩 UI Section                                                              */
  /* -------------------------------------------------------------------------- */
  return (
    <div className="pb-24 bg-gray-50 min-h-screen font-poppins">
      <VendorHeader vendor={vendor} />

      <div className="px-3 sm:px-4 md:px-5 pt-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3 mb-4 text-center">
            {error}
          </div>
        )}

        {loading && !vendor ? (
          <DashboardShimmer />
        ) : (
          <>
            <WelcomeHeader vendor={vendor} />
            <StatsRow products={products} />
            <SalesCard />

            {/* SEARCH BAR */}
            <div className="relative max-w-2xl mx-auto mb-6 mt-3">
              <div className="flex items-center bg-white border border-gray-200 shadow-sm rounded-full px-4 py-2 transition focus-within:ring-2 focus-within:ring-teal-500">
                <Search className="w-5 h-5 text-gray-400 mr-2" />
                <input
                  type="text"
                  placeholder="Search products by name, category, or attributes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 outline-none text-gray-800 placeholder-gray-400 bg-transparent"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-gray-400 hover:text-gray-600 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {isSearching && (
                <div className="absolute right-5 top-2.5 text-xs text-gray-400 animate-pulse">
                  Searching...
                </div>
              )}
            </div>

            {/* PRODUCTS */}
            <MyProductsCard products={filteredProducts} loading={loading} />
          </>
        )}
      </div>

      {/* ➕ ADD PRODUCT BUTTON */}
      <Link
        href="/vendor/products/add"
        className="fixed bottom-20 right-5 md:bottom-6 md:right-8 bg-teal-600 hover:bg-teal-700 text-white px-4 py-3 rounded-full shadow-lg flex items-center gap-2 transition"
      >
        <Plus className="w-5 h-5" />
        <span className="hidden sm:inline font-medium">Add Product</span>
      </Link>

      <VendorBottomNav />
    </div>
  );
}
