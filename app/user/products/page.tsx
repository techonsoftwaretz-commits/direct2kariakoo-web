"use client";

import { Suspense, useEffect } from "react";
import useSWR from "swr";
import axios from "axios";
import ProductDetails from "@/app/user/components/ProductDetails";
import { useSearchParams } from "next/navigation";

/* -------------------------------------------------------------------------- */
/*                        AXIOS FETCHER WITH TIMEOUT                          */
/* -------------------------------------------------------------------------- */
const fetcher = async (url: string) => {
  const source = axios.CancelToken.source();
  const timeout = setTimeout(() => {
    source.cancel("Request timeout");
  }, 6000);

  try {
    const res = await axios.get(url, { cancelToken: source.token });
    clearTimeout(timeout);
    return res.data.product || res.data;
  } catch (err: any) {
    if (axios.isCancel(err)) throw new Error("Request timeout");
    throw new Error("Failed to load product");
  }
};

/* -------------------------------------------------------------------------- */
/*                          PRODUCT DETAILS INNER UI                          */
/* -------------------------------------------------------------------------- */
function ProductDetailsInner() {
  const searchParams = useSearchParams();
  const productId = searchParams.get("id");

  // ✅ Use SWR for caching + retry logic
  const {
    data: product,
    error,
    isLoading,
    mutate,
  } = useSWR(
    productId
      ? `${process.env.NEXT_PUBLIC_API_URL}/products/${productId}`
      : null,
    fetcher,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: true,
      dedupingInterval: 60000, // keep cache for 1 minute
    }
  );

  /* -------------------------------------------------------------------------- */
  /*                   ✅ LocalStorage Instant Load (Fast UI)                   */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    if (!productId) return;

    const cacheKey = `d2k_product_${productId}`;
    // 1️⃣ Try to load cached data first for instant display
    const cached = localStorage.getItem(cacheKey);
    if (cached && !product) {
      try {
        const parsed = JSON.parse(cached);
        mutate(parsed, false); // show cached data instantly (without re-fetch)
      } catch (e) {
        console.warn("⚠️ Failed to parse cached product:", e);
      }
    }

    // 2️⃣ Once SWR gets fresh data, update cache
    if (product) {
      localStorage.setItem(cacheKey, JSON.stringify(product));
    }
  }, [product, productId, mutate]);

  /* ----------------------------- Loading State ----------------------------- */
  if (isLoading && !product)
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        Loading product...
      </div>
    );

  /* ----------------------------- Error Handling ---------------------------- */
  if (error || !product)
    return (
      <div className="flex justify-center items-center h-screen text-red-600">
        {error?.message || "Product not found."}
      </div>
    );

  /* ---------------------------- Render Product ----------------------------- */
  return <ProductDetails product={product} />;
}

/* -------------------------------------------------------------------------- */
/*                           PAGE WRAPPED IN SUSPENSE                         */
/* -------------------------------------------------------------------------- */
export default function ProductDetailsPage() {
  return (
    <Suspense fallback={<div className="text-center p-10">Loading...</div>}>
      <ProductDetailsInner />
    </Suspense>
  );
}
