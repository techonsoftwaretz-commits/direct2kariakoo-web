"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";
import SubcategorySection from "@/app/user/components/SubcategorySection";
import ProductCard from "@/app/user/components/ProductCard";
import Header from "../components/Header";
import BannerCarousel from "@/app/user/components/BannerCarousel"; // ✅ Added

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

  // 🧠 Fetch categories
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

  // 🧠 Restore selected category from localStorage
  useEffect(() => {
    const storedCat = localStorage.getItem("selectedCategory");
    if (storedCat) {
      const cat = JSON.parse(storedCat);
      setSelectedCategory(cat);
      localStorage.removeItem("selectedCategory");
    }
  }, []);

  // 🧠 Fetch products by subcategory
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

  // 🧠 Loading/Error Handling
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

  return (
    <main className="bg-gray-50 min-h-screen pb-20">
      {/* ✅ Top Header */}
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

      {/* ✅ Replaced Banner Section with Carousel */}
      <div className="mt-2 sm:mt-4">
        <BannerCarousel />
      </div>

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
    </main>
  );
}
