"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";
import SubcategorySection from "@/app/user/components/SubcategorySection";
import ProductCard from "@/app/user/components/ProductCard";
import Header from "../components/Header";

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

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<number | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [productLoading, setProductLoading] = useState(false);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(7 * 60 * 60 + 37 * 60 + 26);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(
      () => setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0)),
      1000
    );
    return () => clearInterval(timer);
  }, []);

  const formatTimeParts = (seconds: number) => {
    const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return [h, m, s];
  };

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/categories`);
        const data = Array.isArray(res.data) ? res.data : [];
        setCategories(data);
        if (data.length > 0) setSelectedCategory(data[0]);
      } catch (err) {
        console.error("❌ Error loading categories", err);
        setError("Failed to load categories.");
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Restore selected category from localStorage
  useEffect(() => {
    const storedCat = localStorage.getItem("selectedCategory");
    if (storedCat) {
      const cat = JSON.parse(storedCat);
      setSelectedCategory(cat);
      localStorage.removeItem("selectedCategory");
    }
  }, []);

  // Fetch products by subcategory
  useEffect(() => {
    if (!selectedSubcategory || selectedSubcategory === 0) {
      setProducts([]);
      return;
    }
    setProductLoading(true);
    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/subcategories/${selectedSubcategory}/products`)
      .then((res) => {
        const data = Array.isArray(res.data.products) ? res.data.products : [];
        setProducts(data);
      })
      .catch(() => setProducts([]))
      .finally(() => setProductLoading(false));
  }, [selectedSubcategory]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <p className="text-gray-600">Loading categories...</p>
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <p className="text-red-600">{error}</p>
      </div>
    );

  const [h, m, s] = formatTimeParts(timeLeft);

  return (
    <div className="pb-20 bg-gray-50 min-h-screen">
      {/* ✅ Top Header */}
      <Header
        onCategorySelect={(cat) => {
          if (!cat || selectedCategory?.id === cat.id) return; // prevent same ID re-set
          setSelectedCategory(cat);
        }}
        onSubcategorySelect={(id) => {
          if (!id || selectedSubcategory === id) return; // prevent loop
          setSelectedSubcategory(id);
        }}
      />

      {/* ✅ AliExpress-style compact promo banner */}
      <section className="flex justify-center mt-3">
        <div
          className="
            flex items-center justify-between 
            bg-gradient-to-r from-[#FFE970] to-[#FFD100]
            rounded-2xl shadow-sm border border-yellow-300
            w-[95%] sm:w-[90%] md:w-[85%]
            px-4 sm:px-6 py-3
            transition-all duration-300
          "
        >
          {/* LEFT SIDE: Text + Icons */}
          <div className="flex flex-col justify-center flex-1 text-gray-900">
            <h3 className="text-[13px] sm:text-[16px] font-bold flex items-center gap-1">
              Welcome to{" "}
              <span className="text-[#1E73BE] font-extrabold">
                Direct2Kariakoo
              </span>
            </h3>

            <div className="flex items-center gap-4 mt-1 text-[11px] sm:text-[13px]">
              <div className="flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5 text-gray-800"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m-6 8a9 9 0 100-18 9 9 0 000 18z"
                  />
                </svg>
                <span>Delivery guarantee</span>
              </div>

              <div className="flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5 text-gray-800"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-7 7-7-7"
                  />
                </svg>
                <span>Free returns</span>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Illustration */}
          <div className="flex justify-end flex-shrink-0 ml-3 sm:ml-6">
          <Image
            src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/promo-right.png`}
            alt="Promo Illustration"
            width={110}
            height={80}
            className="object-contain w-[90px] sm:w-[110px]"
          />
          </div>
        </div>
      </section>

      {/* 🔹 Subcategory Section */}
      {selectedCategory && (
        <SubcategorySection
          key={selectedCategory.id}
          categoryId={selectedCategory.id}
          onSelectSubcategory={(id) => setSelectedSubcategory(id)}
        />
      )}

      {/* 🔹 Product Section */}
      {selectedSubcategory && selectedSubcategory !== 0 && (
        <section className="mt-5 px-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-gray-900">
              {products.length > 0 ? "Today's Deals" : "No Products Found"}
            </h2>
          </div>

          {productLoading ? (
            <div className="text-center text-gray-500 py-6">
              Loading products...
            </div>
          ) : products.length === 0 ? (
            <div className="text-center text-gray-400 py-6">
              No products found.
            </div>
          ) : (
            <div
              className="
                grid 
                grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 
                gap-3 sm:gap-4 
                pb-6
              "
            >
              {products.map((p) => (
                <ProductCard
                  key={p.id}
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
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
