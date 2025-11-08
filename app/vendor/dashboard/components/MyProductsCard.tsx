"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { RefreshCw, ShoppingCart, Star, Heart } from "lucide-react";
import { useEffect, useState } from "react";

interface MyProductsCardProps {
  products: any[];
  loading: boolean;
  onRefresh?: () => void;
}

export default function MyProductsCard({
  products,
  loading,
  onRefresh,
}: MyProductsCardProps) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [cachedProducts, setCachedProducts] = useState<any[]>([]);
  const [likedProducts, setLikedProducts] = useState<number[]>([]);

  const CACHE_KEY_PRODUCTS = "d2k_vendor_products";
  const CACHE_EXPIRY_MS = 12 * 60 * 60 * 1000; // 12h cache

  /* -------------------------------------------------------------------------- */
  /* 🧠 Load Cached Products                                                    */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    try {
      const now = Date.now();
      const cached = localStorage.getItem(CACHE_KEY_PRODUCTS);
      const cachedTime = localStorage.getItem(`${CACHE_KEY_PRODUCTS}_time`);

      if (cached && cachedTime && now - parseInt(cachedTime) < CACHE_EXPIRY_MS) {
        setCachedProducts(JSON.parse(cached));
      } else {
        localStorage.removeItem(CACHE_KEY_PRODUCTS);
        localStorage.removeItem(`${CACHE_KEY_PRODUCTS}_time`);
      }
    } catch (err) {
      console.warn("Cache read failed:", err);
    }
  }, []);

  /* -------------------------------------------------------------------------- */
  /* 🔁 Handle Refresh Button                                                   */
  /* -------------------------------------------------------------------------- */
  const handleRefresh = async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    await onRefresh();
    setTimeout(() => setRefreshing(false), 800);
  };

  /* -------------------------------------------------------------------------- */
  /* 🖼️ Normalize Image URL                                                   */
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
  /* ✨ Shimmer Loader                                                          */
  /* -------------------------------------------------------------------------- */
  const ShimmerGrid = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-2 px-[4px] py-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm animate-pulse"
        >
          <div className="w-full h-[150px] bg-gray-200 rounded-md mb-3" />
          <div className="w-3/4 h-4 bg-gray-200 rounded mb-2" />
          <div className="w-1/2 h-3 bg-gray-100 rounded mb-3" />
          <div className="w-2/3 h-2 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );

  /* -------------------------------------------------------------------------- */
  /* 🚫 Empty State                                                             */
  /* -------------------------------------------------------------------------- */
  if (!loading && (!products || products.length === 0)) {
    return (
      <div className="flex justify-center py-12 text-gray-400">
        No products found.
      </div>
    );
  }

  /* -------------------------------------------------------------------------- */
  /* 🧩 Render Product Grid                                                     */
  /* -------------------------------------------------------------------------- */
  const data = products && products.length > 0 ? products : cachedProducts;

  return (
    <div className="bg-[#F9FAFB] py-5 animate-fadeIn">
      {/* HEADER */}
      <div className="flex justify-between items-center px-3 mb-5">
        <h2 className="text-[18px] font-extrabold text-[#272B37]">
          My Products
        </h2>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-gray-700 font-semibold text-[13px] hover:bg-gray-200 transition"
        >
          <RefreshCw
            className={`w-4 h-4 ${
              refreshing ? "animate-spin text-teal-600" : ""
            }`}
          />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* GRID */}
      {loading ? (
        <ShimmerGrid />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-2 px-[4px]">
          {data.map((product) => {
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
            const liked = likedProducts.includes(product.id);

            return (
              <div
                key={product.id}
                onClick={() => router.push(`/vendor/products?id=${product.id}`)}
                className="relative bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden flex flex-col"
              >
                {/* 🔹 Best Seller Tag */}
                <div className="absolute top-2 left-2 bg-gray-800 text-white text-xs font-semibold px-2 py-0.5 rounded-md z-10 shadow-sm">
                  Best Seller
                </div>

                {/* ❤️ Wishlist */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLikedProducts((prev) =>
                      liked
                        ? prev.filter((id) => id !== product.id)
                        : [...prev, product.id]
                    );
                  }}
                  className="absolute top-2 right-2 bg-white rounded-full shadow-md p-1.5 z-10 hover:scale-105 transition"
                >
                  <Heart
                    size={16}
                    className={
                      liked ? "text-red-500 fill-red-500" : "text-gray-400"
                    }
                  />
                </button>

                {/* 🖼️ Product Image */}
                <div className="relative w-full h-40 bg-gray-50">
                  <Image
                    src={image}
                    alt={product.name || "Product"}
                    fill
                    unoptimized
                    loader={({ src }) => src}
                    className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                    sizes="200px"
                  />
                </div>

                {/* CONTENT */}
                <div className="px-3 py-2 flex flex-col flex-grow">
                  {/* Product Name */}
                  <h3 className="font-medium text-sm text-gray-800 line-clamp-2 leading-snug min-h-[36px]">
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
                    {reviewCount > 0 && (
                      <span className="text-xs text-gray-500 ml-1">
                        ({reviewCount.toLocaleString()})
                      </span>
                    )}
                  </div>

                  {/* 💰 Prices */}
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="font-semibold text-[15px] text-gray-900">
                      TZS {newPrice.toLocaleString("en-TZ")}
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

                  {/* 🔹 Stats Row */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-[10px] text-gray-500 flex items-center gap-1">
                      <ShoppingCart size={12} className="text-gray-400" />
                      <span>{product?.sold_recently || 0}+ sold</span>
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
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 🎬 Fade Animation (once globally)                                          */
/* -------------------------------------------------------------------------- */
if (typeof window !== "undefined" && !document.getElementById("fadein-style")) {
  const style = document.createElement("style");
  style.id = "fadein-style";
  style.innerHTML = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fadeIn { animation: fadeIn 0.25s ease-in-out; }
  `;
  document.head.appendChild(style);
}
