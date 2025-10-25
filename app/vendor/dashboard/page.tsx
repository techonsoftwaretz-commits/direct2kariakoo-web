"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import Link from "next/link";
import VendorHeader from "./components/VendorHeader";
import WelcomeHeader from "./components/WelcomeHeader";
import StatsRow from "./components/StatsRow";
import SalesCard from "./components/SalesCard";
import MyProductsCard from "./components/MyProductsCard";
import VendorBottomNav from "../VendorBottomNav";
import { api } from "@/lib/api";

export default function VendorDashboard() {
  const [vendor, setVendor] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const CACHE_KEY_VENDOR = "d2k_vendor_data";
  const CACHE_KEY_PRODUCTS = "d2k_vendor_products";
  const CACHE_EXPIRY_MS = 12 * 60 * 60 * 1000;

  useEffect(() => {
    const now = Date.now();
    const cachedVendor = localStorage.getItem(CACHE_KEY_VENDOR);
    const cachedProducts = localStorage.getItem(CACHE_KEY_PRODUCTS);
    const cachedTime = localStorage.getItem(`${CACHE_KEY_VENDOR}_time`);

    if (cachedVendor && cachedProducts && cachedTime && now - parseInt(cachedTime) < CACHE_EXPIRY_MS) {
      setVendor(JSON.parse(cachedVendor));
      setProducts(JSON.parse(cachedProducts));
      setLoading(false);
    }

    const fetchDashboardData = async () => {
      try {
        setError(null);
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

        localStorage.setItem(CACHE_KEY_VENDOR, JSON.stringify(vendorData));
        localStorage.setItem(CACHE_KEY_PRODUCTS, JSON.stringify(productList));
        localStorage.setItem(`${CACHE_KEY_VENDOR}_time`, now.toString());
      } catch (err: any) {
        console.error("❌ Error fetching dashboard data:", err);
        if (err.response?.status === 401) {
          setError("Session expired. Please log in again.");
          localStorage.clear();
          window.location.href = "/frontend/auth/login";
        } else if (err.response?.status === 404) {
          setError("Data not found. Check your API routes.");
        } else {
          setError("An unexpected error occurred. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      <VendorHeader vendor={vendor} />

      <div className="px-3 sm:px-4 md:px-5 pt-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3 mb-4 text-center">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-10 text-gray-500 animate-pulse">
            Loading your dashboard...
          </div>
        ) : (
          <>
            <WelcomeHeader vendor={vendor} />
            <StatsRow products={products} />
            <SalesCard />
            <MyProductsCard products={products} loading={loading} />
          </>
        )}
      </div>

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
