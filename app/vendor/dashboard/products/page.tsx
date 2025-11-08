"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { RefreshCw, ShoppingCart, Star, Heart } from "lucide-react";
import { api } from "@/lib/api";
import VendorHeader from "../components/VendorHeader";

export default function VendorMyProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [likedIds, setLikedIds] = useState<number[]>([]);

  const CACHE_KEY_PRODUCTS = "d2k_vendor_products";
  const CACHE_KEY_VENDOR = "d2k_vendor_data";
  const CACHE_EXPIRY_MS = 12 * 60 * 60 * 1000; // 12 hours

  /* -------------------------------------------------------------------------- */
  /* 🧠 Load Cached Data + Fetch Fresh Data                                     */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    const now = Date.now();
    const cachedProducts = localStorage.getItem(CACHE_KEY_PRODUCTS);
    const cachedVendor = localStorage.getItem(CACHE_KEY_VENDOR);
    const cachedTime = localStorage.getItem(`${CACHE_KEY_PRODUCTS}_time`);

    if (cachedProducts && cachedTime && now - parseInt(cachedTime) < CACHE_EXPIRY_MS) {
      setProducts(JSON.parse(cachedProducts));
      setLoading(false);
    }

    if (cachedVendor) setVendor(JSON.parse(cachedVendor));

    fetchProducts(); // Always fetch fresh data
  }, []);

  /* -------------------------------------------------------------------------- */
  /* 🔄 Fetch Products + Cache                                                  */
  /* -------------------------------------------------------------------------- */
  async function fetchProducts() {
    try {
      const res = await api.get("/products");
      const data = res.data.products || res.data || [];
      setProducts(data);
      localStorage.setItem(CACHE_KEY_PRODUCTS, JSON.stringify(data));
      localStorage.setItem(`${CACHE_KEY_PRODUCTS}_time`, Date.now().toString());
    } catch (err: any) {
      console.error("❌ Failed to load products:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  }

  /* -------------------------------------------------------------------------- */
  /* 🔁 Manual Refresh                                                          */
  /* -------------------------------------------------------------------------- */
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setTimeout(() => setRefreshing(false), 800);
  };

  /* -------------------------------------------------------------------------- */
  /* 🖼️ Image URL Normalizer                                                   */
  /* -------------------------------------------------------------------------- */
  const getImageUrl = (img?: string): string => {
    if (!img) return "/placeholder.png";
    const base = (process.env.NEXT_PUBLIC_STORAGE_URL || "").replace(/\/$/, "");
    if (img.startsWith("http")) return img;
    if (/^(products|vendor_avatars)\//.test(img)) return `${base}/storage/${img}`;
    if (img.startsWith("/storage") || img.startsWith("storage"))
      return `${base}/${img.replace(/^\/?/, "")}`;
    return `${base}/storage/${img}`;
  };

  /* -------------------------------------------------------------------------- */
  /* 💠 Shimmer Loader                                                         */
  /* -------------------------------------------------------------------------- */
  const ShimmerGrid = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 px-3 py-5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 animate-pulse">
          <div className="w-full h-[160px] bg-gray-200 rounded-md mb-3" />
          <div className="w-3/4 h-4 bg-gray-200 rounded mb-2" />
          <div className="w-1/2 h-3 bg-gray-100 rounded mb-2" />
          <div className="w-full h-3 bg-gray-200 rounded mb-1" />
          <div className="w-2/3 h-3 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );

  /* -------------------------------------------------------------------------- */
  /* ❤️ Toggle Wishlist                                                        */
  /* -------------------------------------------------------------------------- */
  const toggleLike = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setLikedIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  /* -------------------------------------------------------------------------- */
  /* 🧱 Render                                                                 */
  /* -------------------------------------------------------------------------- */
  return (
    <main className="min-h-screen bg-[#F9FAFB] pb-24 font-poppins">
      <VendorHeader vendor={vendor} />

      {/* 🔝 Top Bar */}
      <div className="flex justify-between items-center px-3 sm:px-5 py-4 bg-white shadow-sm sticky top-0 z-30 border-b">
        <h1 className="text-lg font-semibold text-gray-800">All My Products</h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-gray-700 font-semibold text-[13px] hover:bg-gray-200 transition"
        >
          <RefreshCw
            className={`w-4 h-4 ${refreshing ? "animate-spin text-teal-600" : ""}`}
          />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* 🌀 Loading */}
      {loading && <ShimmerGrid />}

      {/* 🚫 Empty State */}
      {!loading && products.length === 0 && (
        <div className="text-center text-gray-500 py-20">
          <Image
            src="/placeholder.png"
            alt="No products"
            width={120}
            height={120}
            className="mx-auto mb-4 opacity-60"
          />
          <p>No products found. Start by adding one!</p>
        </div>
      )}

      {/* ✅ Products Grid */}
      {!loading && products.length > 0 && (
        <div className="bg-[#F9FAFB] py-5">
          <div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 px-3 sm:px-5 overflow-y-auto"
            style={{ maxHeight: "calc(100vh - 150px)" }}
          >
            {products.map((product) => {
              const rawImg =
                product?.images?.[0]?.image ||
                product?.product_images?.[0]?.image ||
                product?.image ||
                null;
              const image = getImageUrl(rawImg);
              const newPrice = Number(product?.new_price || 0);
              const oldPrice = Number(product?.old_price || 0);
              const discount =
                oldPrice > newPrice
                  ? Math.round(((oldPrice - newPrice) / oldPrice) * 100)
                  : 0;
              const rating = parseFloat(product?.average_rating || 0).toFixed(1);
              const reviewCount = product?.review_count || 0;
              const liked = likedIds.includes(product.id);

              return (
                <div
                  key={product.id}
                  onClick={() => router.push(`/vendor/products?id=${product.id}`)}
                  className="relative bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden flex flex-col group active:scale-[0.98]"
                >
                  {/* 🔹 Label */}
                  <div className="absolute top-2 left-2 bg-gray-800 text-white text-[11px] font-semibold px-2 py-0.5 rounded-md z-10">
                    Best Seller
                  </div>

                  {/* ❤️ Wishlist */}
                  <button
                    onClick={(e) => toggleLike(product.id, e)}
                    className="absolute top-2 right-2 bg-white rounded-full shadow p-1 z-10 hover:scale-105 transition"
                  >
                    <Heart
                      size={16}
                      className={liked ? "text-red-500 fill-red-500" : "text-gray-400"}
                    />
                  </button>

                  {/* 🖼️ Image */}
                  <div className="relative w-full h-40 bg-gray-100">
                    <Image
                      src={image}
                      alt={product.name}
                      fill
                      className="object-contain p-4 group-hover:scale-105 transition-transform"
                    />
                  </div>

                  {/* 📋 Details */}
                  <div className="px-3 py-2 flex flex-col flex-grow">
                    <h3 className="font-medium text-sm text-gray-800 line-clamp-2 leading-snug min-h-[38px]">
                      {product.name}
                    </h3>

                    {/* ⭐ Rating */}
                    <div className="flex items-center gap-1 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={13}
                          className={
                            i < Math.floor(Number(rating))
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-300"
                          }
                        />
                      ))}
                      <span className="text-xs text-gray-500 ml-1">
                        ({reviewCount})
                      </span>
                    </div>

                    {/* 💰 Price */}
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="font-semibold text-[15px] text-gray-900">
                        TZS {newPrice.toLocaleString()}
                      </span>
                      {oldPrice > 0 && (
                        <span className="line-through text-xs text-gray-400">
                          TZS {oldPrice.toLocaleString()}
                        </span>
                      )}
                      {discount > 0 && (
                        <span className="text-green-600 text-xs font-medium">
                          {discount}% OFF
                        </span>
                      )}
                    </div>

                    {/* 🚚 Info Row */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-[10px] text-gray-500 flex items-center gap-1">
                        <ShoppingCart size={12} />
                        <span>In stock</span>
                      </div>
                      <span className="text-[10px] font-semibold text-yellow-500 uppercase">
                        express
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}
