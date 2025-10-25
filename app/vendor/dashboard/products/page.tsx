"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, RefreshCw, ShoppingCart, Star } from "lucide-react";
import { api } from "@/lib/api";
import VendorHeader from "../components/VendorHeader";

export default function VendorMyProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const CACHE_KEY_PRODUCTS = "d2k_vendor_products";
  const CACHE_KEY_VENDOR = "d2k_vendor_data";
  const CACHE_EXPIRY_MS = 12 * 60 * 60 * 1000;

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

    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      setLoading(true);
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

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setTimeout(() => setRefreshing(false), 800);
  };

  const getImageUrl = (img?: string): string => {
    if (!img) return "/placeholder.png";
    const base = (process.env.NEXT_PUBLIC_STORAGE_URL || "").replace(/\/$/, "");
    if (img.startsWith("http")) return img;
    if (/^(products|vendor_avatars)\//.test(img)) return `${base}/storage/${img}`;
    if (img.startsWith("/storage") || img.startsWith("storage"))
      return `${base}/${img.replace(/^\/?/, "")}`;
    return `${base}/storage/${img}`;
  };

  return (
    <main className="min-h-screen bg-[#F9FAFB] pb-24 font-poppins">
      <VendorHeader vendor={vendor} />

      {/* Top Bar */}
      <div className="flex justify-between items-center px-3 sm:px-4 py-4 bg-white shadow-sm sticky top-0 z-30 border-b">
        <h1 className="text-lg font-semibold text-gray-800">All My Products</h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-[#E7ECF0] rounded-full text-[#3E4862] font-semibold text-[13px] hover:bg-[#d9e1e7] transition"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-teal-600" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {loading && (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-yellow-500" />
        </div>
      )}

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

      {!loading && products.length > 0 && (
        <div className="bg-[#F9FAFB] py-5">
          <div
            className="
              grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6
              gap-3 sm:gap-4 px-2 sm:px-3 md:px-4 overflow-y-auto pb-10
            "
            style={{ maxHeight: "calc(100vh - 150px)" }}
          >
            {products.map((product) => {
              const rawImg =
                product?.images?.[0]?.image ||
                product?.product_images?.[0]?.image ||
                product?.image ||
                null;
              const image = getImageUrl(rawImg);
              const attrValues =
                product?.attribute_values?.map((a: any) => a?.value)?.filter(Boolean) || [];
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
                  href={`/vendor/products?id=${product.id}`}
                  className="bg-white rounded-[8px] border border-[#E3E7ED] shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200 group overflow-hidden"
                >
                  <div className="flex justify-between items-center px-3 pt-3">
                    <div className="bg-gray-100 text-gray-800 text-[10px] font-semibold px-3 py-1 rounded-full">
                      Best Seller
                    </div>
                  </div>

                  <div className="relative w-full h-[150px] mt-2 bg-gray-100 rounded-t-[5px] overflow-hidden">
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

                  <div className="p-3">
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

                    <h3 className="text-[#232742] text-[13.5px] font-medium line-clamp-2 mb-1">
                      {product.name}
                    </h3>

                    {subcategory && (
                      <p className="text-[#949AA8] text-[13px] font-bold mb-1">{subcategory}</p>
                    )}

                    <div className="flex items-center mb-2">
                      {Array.from({ length: 5 }).map((_, i) => {
                        const filled = i < Math.floor(Number(rating));
                        const half = i < Number(rating) && Number(rating) - i >= 0.5;
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
                      <span className="ml-1 text-[12px] font-bold text-[#232742]">{rating}</span>
                      <span className="ml-1 text-[11.5px] text-gray-500">({reviewCount})</span>
                    </div>

                    <div className="mb-1">
                      <div className="flex items-end">
                        <span className="text-[#232742] font-bold text-[13.5px] mr-1">TZS</span>
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
      )}
    </main>
  );
}
