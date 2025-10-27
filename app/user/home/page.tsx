"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import BannerCarousel from "@/app/user/components/BannerCarousel";
import ProductCard from "@/app/user/components/ProductCard";
import SubcategorySection from "@/app/user/components/SubcategorySection";

/* -------------------------------------------------------------------------- */
/* Interfaces                                                                 */
/* -------------------------------------------------------------------------- */
interface Product {
  id: number;
  name: string;
  new_price: number;
  old_price?: number;
  average_rating?: number;
  review_count?: number;
  images: string[];
  attribute_values?: { value: string }[];
}
interface Category {
  id: number;
  name: string;
}
interface Subcategory {
  id: number;
  name: string;
}

/* -------------------------------------------------------------------------- */
/* Cache Constants                                                            */
/* -------------------------------------------------------------------------- */
const CAT_CACHE_KEY = "d2k_home_categories";
const CAT_CACHE_TIME = "d2k_home_cache_time";
const CACHE_TTL = 1000 * 60 * 60 * 12; // 12 hours

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */
export default function HomePage() {
  const router = useRouter();

  // ✅ Initialize instantly with cached data
  const [categories, setCategories] = useState<Category[]>(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem(CAT_CACHE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) return parsed;
        } catch {}
      }
    }
    return [];
  });

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<number | null>(null);
  const [error, setError] = useState("");

  /* -------------------------------------------------------------------------- */
  /* 🔹 Load / Refresh Categories in Background                                 */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    const now = Date.now();
    const cachedTime = localStorage.getItem(CAT_CACHE_TIME);

    // show cached instantly
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0]);
    }

    // skip if still fresh
    if (cachedTime && now - parseInt(cachedTime) < CACHE_TTL) return;

    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/categories`)
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        if (data.length > 0) {
          setCategories(data);
          if (!selectedCategory) setSelectedCategory(data[0]);
          localStorage.setItem(CAT_CACHE_KEY, JSON.stringify(data));
          localStorage.setItem(CAT_CACHE_TIME, now.toString());
        }
      })
      .catch((err) => {
        console.error("⚠️ Category refresh failed", err);
        setError("Failed to refresh categories.");
      });
  }, []);

  /* -------------------------------------------------------------------------- */
  /* 🧱 Layout                                                                  */
  /* -------------------------------------------------------------------------- */
  return (
    <main className="bg-gray-50 min-h-screen pb-20">
      {/* ✅ Header */}
      <Header
        onCategorySelect={(cat) => {
          if (!cat || selectedCategory?.id === cat.id) return;
          setSelectedCategory(cat);
        }}
        onSubcategorySelect={(id) => {
          if (!id || selectedSubcategory === id) return;
          setSelectedSubcategory(id);
        }}
      />

      {/* ✅ Banner */}
      <div className="mt-2 sm:mt-4">
        <BannerCarousel />
      </div>

      {/* ✅ Subcategory Section */}
      {selectedCategory && (
        <SubcategorySection
          key={selectedCategory.id}
          categoryId={selectedCategory.id}
          onSelectSubcategory={(id) => setSelectedSubcategory(id)}
        />
      )}

      {/* ✅ Products by Subcategory */}
      {selectedCategory && (
        <ProductsBySubcategoryRows
          categoryId={selectedCategory.id}
          selectedSubcategory={selectedSubcategory}
        />
      )}
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* 🧩 Products by Subcategory Rows Component                                   */
/* -------------------------------------------------------------------------- */
function ProductsBySubcategoryRows({
  categoryId,
  selectedSubcategory,
}: {
  categoryId: number;
  selectedSubcategory: number | null;
}) {
  const router = useRouter();
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [productsBySub, setProductsBySub] = useState<Record<number, Product[]>>({});

  // 🔹 Load subcategories and products (instant + background)
  useEffect(() => {
    const cachedKey = `d2k_subs_${categoryId}`;
    const cached = localStorage.getItem(cachedKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.subcategories && parsed.productsBySub) {
          setSubcategories(parsed.subcategories);
          setProductsBySub(parsed.productsBySub);
        }
      } catch {}
    }

    const fetchData = async () => {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/categories/${categoryId}/subcategories`
        );
        const subs = Array.isArray(res.data) ? res.data : [];
        setSubcategories(subs);

        const map: Record<number, Product[]> = {};
        await Promise.all(
          subs.map(async (sub) => {
            try {
              const r = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/subcategories/${sub.id}/products`
              );
              const list = Array.isArray(r.data.products) ? r.data.products : [];
              map[sub.id] = list;
            } catch {
              map[sub.id] = [];
            }
          })
        );

        setProductsBySub(map);
        localStorage.setItem(cachedKey, JSON.stringify({ subcategories: subs, productsBySub: map }));
      } catch (err) {
        console.error("⚠️ Subcategory fetch failed", err);
      }
    };

    fetchData();
  }, [categoryId]);

  const orderedSubs = [
    ...subcategories.filter((s) => s.id === selectedSubcategory),
    ...subcategories.filter((s) => s.id !== selectedSubcategory),
  ];

  return (
    <section className="mt-5 px-4 space-y-8">
      {orderedSubs.map((sub) => (
        <div key={sub.id} className="space-y-3">
          {/* Subcategory Header */}
          <div className="flex justify-between items-center">
            <h2 className="text-base font-semibold text-gray-900">{sub.name}</h2>
            <button
              onClick={() => router.push(`/user/subcategories?id=${sub.id}`)}
              className="text-teal-600 text-xs hover:underline"
            >
              See all →
            </button>
          </div>

          {/* Product Row */}
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {(productsBySub[sub.id] || []).length === 0 ? (
              <div className="text-gray-400 text-xs px-4 py-6">No products found</div>
            ) : (
              (productsBySub[sub.id] || []).map((p) => (
                <div key={p.id} className="flex-shrink-0 w-[180px] sm:w-[200px]">
                  <ProductCard
                    product={{
                      id: p.id,
                      name: p.name,
                      image: p.images?.[0] || "/placeholder.png",
                      price: p.new_price,
                      oldPrice: p.old_price,
                      rating: p.average_rating,
                      reviews: p.review_count,
                      attributes: p.attribute_values?.map((a) => a.value),
                    }}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </section>
  );
}
