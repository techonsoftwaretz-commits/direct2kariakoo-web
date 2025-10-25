"use client";

import Image from "next/image";
import Link from "next/link";
import { RefreshCw, ShoppingCart, Star } from "lucide-react";
import { useState } from "react";

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
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    await onRefresh();
    setTimeout(() => setRefreshing(false), 600);
  };

  // ✅ Normalize image URL (Laravel-friendly)
  const getImageUrl = (img?: string): string => {
    if (!img) return "/placeholder.png";
    const base = (process.env.NEXT_PUBLIC_STORAGE_URL || "").replace(/\/$/, "");

    if (img.startsWith("http")) return img;
    if (/^(products|vendor_avatars)\//.test(img)) return `${base}/storage/${img}`;
    if (img.startsWith("/storage") || img.startsWith("storage"))
      return `${base}/${img.replace(/^\/?/, "")}`;
    return `${base}/storage/${img}`;
  };

  // ==================== LOADING STATES ====================
  if (loading) {
    return (
      <div className="flex justify-center py-12 text-gray-500">
        Loading products...
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="flex justify-center py-12 text-gray-400">
        No products found.
      </div>
    );
  }

  // ==================== MAIN ====================
  return (
    <div className="bg-[#F9FAFB] py-5">
      {/* HEADER */}
      <div className="flex justify-between items-center px-5 mb-5">
        <h2 className="text-[18px] font-extrabold text-[#272B37] underline">
          My Products
        </h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-[#E7ECF0] rounded-full text-[#3E4862] font-semibold text-[13px] hover:bg-[#d9e1e7] transition"
        >
          <RefreshCw
            className={`w-4 h-4 ${
              refreshing ? "animate-spin text-teal-600" : ""
            }`}
          />
          Refresh
        </button>
      </div>

      {/* PRODUCTS GRID */}
      <div
        className="
          grid
          grid-cols-2
          sm:grid-cols-3
          md:grid-cols-4
          lg:grid-cols-6
          xl:grid-cols-7
          2xl:grid-cols-8
          gap-4
          px-5
        "
      >
        {products.map((product) => {
          const rawImg =
            product?.images?.[0]?.image ||
            product?.product_images?.[0]?.image ||
            product?.image ||
            null;

          const image = getImageUrl(rawImg);
          const attrValues =
            product?.attribute_values
              ?.map((a: any) => a?.value)
              ?.filter((v: any) => v) || [];
          const subcategory = product?.subcategory?.name || "";
          const newPrice = Number(product?.new_price || 0);
          const oldPrice = Number(product?.old_price || 0);
          const discount =
            oldPrice > newPrice
              ? Math.round(((oldPrice - newPrice) / oldPrice) * 100)
              : 0;
          const rating = parseFloat(product?.average_rating || 0).toFixed(1);
          const reviewCount = product?.review_count || 0;
          const soldRecently = product?.sold_recently || 0;

          return (
            <Link
              key={product.id}
              href={`/vendor/products?id=${product.id}`} // ✅ fixed dynamic path
              className="bg-white rounded-[8px] border border-[#E3E7ED] shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200"
            >
              {/* BADGE */}
              <div className="flex justify-between items-center px-3 pt-3">
                <div className="bg-gray-100 text-gray-800 text-[10px] font-semibold px-3 py-1 rounded-full">
                  Best Seller
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 text-blue-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 0l2.39 7.36h7.75L13.45 11.9l2.39 7.36L10 14.72l-5.84 4.54L6.55 11.9 0 7.36h7.75L10 0z" />
                </svg>
              </div>

              {/* IMAGE */}
              <div className="relative w-full h-[140px] mt-2 bg-gray-100 rounded-t-[5px] overflow-hidden">
                <Image
                  src={image}
                  alt={product.name || "Product"}
                  fill
                  unoptimized
                  loader={({ src }) => src}
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/placeholder.png";
                  }}
                />
              </div>

              {/* CONTENT */}
              <div className="p-3">
                {/* ATTRIBUTES */}
                {attrValues.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {attrValues.slice(0, 2).map((v: string, i: number) => (
                      <span
                        key={i}
                        className="bg-[#F6F8FA] text-[#54576D] text-[10.7px] px-2 py-1 rounded-md font-medium"
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                )}

                {/* NAME */}
                <h3 className="text-[#232742] text-[13.5px] font-medium line-clamp-2 mb-1">
                  {product.name}
                </h3>

                {/* SUBCATEGORY */}
                {subcategory && (
                  <p className="text-[#949AA8] text-[13px] font-bold mb-1">
                    {subcategory}
                  </p>
                )}

                {/* RATING */}
                <div className="flex items-center mb-2">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const filled = i < Math.floor(Number(rating));
                    const half =
                      i < Number(rating) && Number(rating) - i >= 0.5;
                    return (
                      <Star
                        key={i}
                        size={14}
                        className={`${
                          filled
                            ? "text-yellow-400 fill-yellow-400"
                            : half
                            ? "text-yellow-400 fill-yellow-400 opacity-70"
                            : "text-yellow-200"
                        }`}
                      />
                    );
                  })}
                  <span className="ml-1 text-[12px] font-bold text-[#232742]">
                    {rating}
                  </span>
                  <span className="ml-1 text-[11.5px] text-gray-500">
                    ({reviewCount})
                  </span>
                </div>

                {/* PRICES */}
                <div className="mb-1">
                  <div className="flex items-end">
                    <span className="text-[#232742] font-bold text-[13.5px] mr-1">
                      TZS
                    </span>
                    <span className="font-bold text-[16.7px] text-black">
                      {newPrice.toLocaleString()}
                    </span>
                  </div>

                  {(oldPrice > 0 || discount > 0) && (
                    <div className="flex items-center mt-1">
                      {oldPrice > 0 && (
                        <span className="text-[13px] text-gray-400 line-through mr-2">
                          {oldPrice.toLocaleString()}
                        </span>
                      )}
                      {discount > 0 && (
                        <span className="bg-[#E5F8F2] text-teal-600 text-[11.5px] font-bold px-2 py-[2px] rounded-full">
                          -{discount}%
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* SOLD RECENTLY */}
                {soldRecently > 0 && (
                  <div className="flex items-center text-[#6C8DBD] text-[11.5px] font-medium mt-1">
                    <ShoppingCart className="w-3.5 h-3.5 mr-1" />
                    {soldRecently}+ sold recently
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
