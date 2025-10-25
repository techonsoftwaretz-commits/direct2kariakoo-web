"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { api } from "@/lib/api";

export default function ProductTitleSection({ product }: { product: any }) {
  const category = product.category?.name || "";
  const subcategory = product.subcategory?.name || "";

  const [ratingData, setRatingData] = useState<{
    averageRating: number;
    totalReviews: number;
  }>({
    averageRating: product.average_rating || 0,
    totalReviews: product.review_count || 0,
  });

  // ✅ Fetch live ratings for this product
  useEffect(() => {
    async function fetchRatings() {
      try {
        const res = await api.get(`/products/${product.id}`);
        const prod = res.data?.product || res.data;
        const reviews = prod?.reviews || [];

        if (!reviews.length) {
          setRatingData({ averageRating: 0, totalReviews: 0 });
          return;
        }

        const totalReviews = reviews.length;
        const averageRating =
          reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) /
          totalReviews;

        setRatingData({ averageRating, totalReviews });
      } catch (err) {
        console.error("❌ Failed to fetch product ratings:", err);
      }
    }

    if (product?.id) fetchRatings();
  }, [product?.id]);

  const { averageRating, totalReviews } = ratingData;

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-100">
      {/* ✅ Category tags */}
      <div className="flex gap-2 mb-3">
        {category && (
          <span className="bg-blue-50 text-gray-700 text-sm px-3 py-1 rounded-full font-semibold">
            {category}
          </span>
        )}
        {subcategory && (
          <span className="bg-teal-50 text-gray-700 text-sm px-3 py-1 rounded-full font-semibold">
            {subcategory}
          </span>
        )}
      </div>

      {/* ✅ Product Title */}
      <h1 className="text-xl font-bold text-[#1A1D29] leading-snug">
        {product.name}
      </h1>

      {/* ✅ Real average rating */}
      <div className="flex items-center mt-2">
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i < Math.floor(averageRating);
          const half = i < averageRating && averageRating - i >= 0.5;
          return (
            <Star
              key={i}
              size={16}
              className={
                filled || half
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-gray-300"
              }
            />
          );
        })}

        <span className="ml-2 text-sm font-semibold text-gray-600">
          {averageRating.toFixed(1)} ({totalReviews})
        </span>
      </div>
    </div>
  );
}
