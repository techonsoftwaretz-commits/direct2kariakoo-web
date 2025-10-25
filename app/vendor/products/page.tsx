"use client"; // must come first

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import VendorHeader from "../dashboard/components/VendorHeader";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ProductImageSlider from "./components/ProductImageSlider";
import ProductTitleSection from "./components/ProductTitleSection";
import ProductPriceRow from "./components/ProductPriceRow";
import ProductDescriptionSection from "./components/ProductDescriptionSection";
import ProductAttributesTable from "./components/ProductAttributesTable";
import ProductRatingSection from "./components/ProductRatingSection";

/* -------------------------------------------------------------------------- */
/* 🧩 Inner Component (wrapped in Suspense below) */
/* -------------------------------------------------------------------------- */
function VendorProductDetailsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get("id");

  const [product, setProduct] = useState<any>(null);
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Cache keys
  const CACHE_KEY_VENDOR = "d2k_vendor_data";
  const CACHE_KEY_PRODUCT = (id: string) => `d2k_product_${id}`;
  const CACHE_EXPIRY_MS = 12 * 60 * 60 * 1000; // 12 hours

  /* --------------------------- LOAD VENDOR --------------------------- */
  useEffect(() => {
    const cachedVendor = localStorage.getItem(CACHE_KEY_VENDOR);
    if (cachedVendor) setVendor(JSON.parse(cachedVendor));
  }, []);

  /* --------------------------- LOAD PRODUCT --------------------------- */
  useEffect(() => {
    if (!productId) {
      setLoading(false);
      return;
    }

    const now = Date.now();
    const cached = localStorage.getItem(CACHE_KEY_PRODUCT(productId));
    const cachedTime = localStorage.getItem(`${CACHE_KEY_PRODUCT(productId)}_time`);

    // ✅ Load cached product instantly if valid
    if (cached && cachedTime && now - parseInt(cachedTime) < CACHE_EXPIRY_MS) {
      setProduct(JSON.parse(cached));
      setLoading(false);
    }

    // ✅ Fetch fresh data in background (no blocking UI)
    fetchProduct();
  }, [productId]);

  /* --------------------------- FETCH PRODUCT --------------------------- */
  async function fetchProduct() {
    if (!productId) return;
    try {
      const res = await api.get(`/products/${productId}`);
      const data = res.data?.product || res.data;

      setProduct(data);
      localStorage.setItem(CACHE_KEY_PRODUCT(productId), JSON.stringify(data));
      localStorage.setItem(`${CACHE_KEY_PRODUCT(productId)}_time`, Date.now().toString());
    } catch (err) {
      console.error("❌ Failed to load product:", err);
    } finally {
      setLoading(false);
    }
  }

  /* --------------------------- IMAGE HANDLER --------------------------- */
  const getImageUrl = (img?: string): string => {
    if (!img) return "/placeholder.png";

    // ✅ If full Laravel URL, use directly
    if (img.startsWith("http")) return img;

    // ✅ Otherwise build from base API
    const base = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "";
    return `${base}/storage/${img.replace(/^\/?storage\//, "")}`;
  };

  /* --------------------------- RENDER LOGIC --------------------------- */
  if (!productId)
    return (
      <div className="flex flex-col items-center justify-center h-screen text-gray-500">
        <p>Invalid product link.</p>
        <button
          onClick={() => router.back()}
          className="mt-3 px-4 py-2 bg-teal-600 text-white rounded-md"
        >
          Go Back
        </button>
      </div>
    );

  const images =
    product?.images?.map((img: any) =>
      getImageUrl(img?.image || img?.image_url || img?.url)
    ) || ["/placeholder.png"];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-poppins relative">
      {/* Header */}
      <VendorHeader vendor={vendor} />

      {/* Back Button */}
      <div className="max-w-5xl mx-auto px-3 sm:px-4 mt-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-700 hover:text-black transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back</span>
        </button>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto pb-[100px] sm:pb-[120px]">
        <div className="max-w-5xl mx-auto bg-white mt-3 rounded-lg overflow-hidden shadow-sm">
          {/* Product Images */}
          <ProductImageSlider images={images} />

          {/* Product Details */}
          <div className="p-4 sm:p-5 space-y-5">
            {product ? (
              <>
                <ProductTitleSection product={product} />
                <ProductPriceRow product={product} />
                {product.description && (
                  <ProductDescriptionSection description={product.description} />
                )}
                {product.attribute_values && (
                  <ProductAttributesTable attributes={product.attribute_values} />
                )}
                <ProductRatingSection productId={product.id} />
              </>
            ) : (
              <div className="text-center text-gray-500 py-10">
                <p>Loading product info...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      {product && (
        <div
          className="
            fixed bottom-0 left-0 right-0 
            bg-white border-t shadow-md 
            p-4 flex justify-center
            z-[999]
            safe-bottom
          "
          style={{
            paddingBottom: "calc(env(safe-area-inset-bottom, 12px) + 8px)",
          }}
        >
          <Link
            href={`/vendor/products/edit?id=${product.id}`}
            className="
              bg-yellow-400 hover:bg-yellow-500 
              text-black font-semibold 
              py-3 px-10 rounded-full 
              shadow-md text-sm sm:text-base 
              transition-all w-full max-w-[400px] text-center
            "
          >
            Edit Product
          </Link>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* ✅ Page Wrapper (Suspense fallback for routing) */
/* -------------------------------------------------------------------------- */
export default function VendorProductDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen text-gray-500">
          Preparing product page...
        </div>
      }
    >
      <VendorProductDetailsInner />
    </Suspense>
  );
}
