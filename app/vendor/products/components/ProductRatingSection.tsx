"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { api } from "@/lib/api";

export default function ProductRatingSection({ productId }: { productId: number }) {
  const [ratingData, setRatingData] = useState<any>(null);

  useEffect(() => {
    async function fetchRatings() {
      try {
        // ✅ Use existing endpoint from your backend
        const res = await api.get(`/products/${productId}`);
        const product = res.data?.product || res.data;

        // ✅ Extract reviews (if exist)
        const reviews = product?.reviews || [];
        if (!reviews.length) return setRatingData(null);

        // ✅ Compute average + star counts manually
        const totalReviews = reviews.length;
        const averageRating =
          reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) /
          totalReviews;

        const starCounts = [5, 4, 3, 2, 1].map((star) => ({
          star,
          count: reviews.filter((r: any) => r.rating === star).length,
        }));

        setRatingData({
          averageRating,
          totalReviews,
          comments: reviews,
          starCounts,
        });
      } catch (err) {
        console.error("Failed to load ratings", err);
      }
    }

    fetchRatings();
  }, [productId]);

  if (!ratingData)
    return (
      <div className="bg-white p-5 border border-gray-100 rounded-lg text-gray-500 text-sm">
        No reviews yet.
      </div>
    );

  const { averageRating, totalReviews, comments = [], starCounts = [] } =
    ratingData;

  return (
    <div className="bg-white border border-gray-100 rounded-lg p-5">
      <h3 className="font-bold text-lg mb-3 text-gray-900">Product Ratings</h3>

      <div className="flex items-start gap-6 mb-5">
        <div className="text-center">
          <p className="text-4xl font-extrabold text-black">
            {averageRating.toFixed(1)}
          </p>
          <div className="flex justify-center mt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={16}
                className={
                  i < Math.floor(averageRating)
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-200"
                }
              />
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-1">{totalReviews} reviews</p>
        </div>

        <div className="flex-1">
          {starCounts.map((row: any, i: number) => (
            <div key={i} className="flex items-center gap-2 mb-1">
              <span className="text-sm text-gray-600 w-8">{row.star}★</span>
              <div className="flex-1 bg-gray-100 h-2 rounded-full">
                <div
                  className="bg-yellow-400 h-2 rounded-full"
                  style={{
                    width: `${(row.count / totalReviews) * 100 || 0}%`,
                  }}
                />
              </div>
              <span className="text-sm text-gray-500">{row.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-gray-800 mb-2">
          Recent Reviews ({comments.length})
        </h4>
        {comments.length ? (
          comments.slice(0, 3).map((c: any, i: number) => (
            <div key={i} className="border-b border-gray-100 py-2">
              <p className="font-semibold text-sm text-gray-800">
                {c.user?.name || "User"}{" "}
                <span className="text-yellow-500">
                  {"★".repeat(c.rating || 0)}
                </span>
              </p>
              <p className="text-gray-600 text-sm mt-1">{c.comment}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-sm">No reviews yet.</p>
        )}
      </div>
    </div>
  );
}
