"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import { ShoppingCart, CheckCircle2, Star } from "lucide-react";
import Header from "@/app/user/components/Header";

/* -------------------------------------------------------------------------- */
/* 🧩 Interfaces */
/* -------------------------------------------------------------------------- */
interface Product {
  id: number;
  name: string;
  new_price: number;
  old_price?: number;
  images: string[];
  average_rating?: number;
  review_count?: number;
  attribute_values?: { value: string }[];
}

/* -------------------------------------------------------------------------- */
/* 🟢 Inner Component */
/* -------------------------------------------------------------------------- */
function SubcategoryProductsInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const subcategoryId = searchParams.get("id");

  const [products, setProducts] = useState<Product[]>([]);
  const [subcategoryName, setSubcategoryName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* -------------------------------------------------------------------------- */
  /* 🟢 Fetch products for subcategory (with cache) */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    if (!subcategoryId) return;

    const cacheKey = `d2k_products_${subcategoryId}`;

    const loadFromCache = () => {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setProducts(parsed);
            setLoading(false); // show instantly
          }
        }
      } catch (err) {
        console.warn("⚠️ Failed to load cached products:", err);
      }
    };

    const fetchProducts = async () => {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/subcategories/${subcategoryId}/products`
        );

        const data = Array.isArray(res.data.products)
          ? res.data.products
          : [];

        setProducts(data);
        localStorage.setItem(cacheKey, JSON.stringify(data));

        if (res.data.subcategory?.name) {
          setSubcategoryName(res.data.subcategory.name);
        }
      } catch (err) {
        console.error("❌ Failed to load products:", err);
        if (products.length === 0)
          setError("Failed to load products. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    // ✅ Step 1: show cached data instantly
    loadFromCache();

    // ✅ Step 2: fetch fresh data in background
    fetchProducts();
  }, [subcategoryId]);

  /* -------------------------------------------------------------------------- */
  /* 🟡 Loading & Error States */
  /* -------------------------------------------------------------------------- */
  if (loading && products.length === 0)
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        Loading products...
      </div>
    );

  if (error)
    return (
      <div className="text-center py-10 text-red-600 font-medium">{error}</div>
    );

  /* -------------------------------------------------------------------------- */
  /* 🟢 MAIN RENDER */
  /* -------------------------------------------------------------------------- */
  return (
    <>
      {/* ✅ Global Header */}
      <Header
        onCategorySelect={(cat) => {
          if (cat?.id) {
            const current = new URLSearchParams(window.location.search).get("category");
            if (current !== String(cat.id)) {
              router.push(`/user?category=${cat.id}`);
            }
          }
        }}
        onSubcategorySelect={(id) => {
          const current = new URLSearchParams(window.location.search).get("id");
          if (current !== String(id)) {
            router.push(`/user/subcategories?id=${id}`);
          }
        }}
      />

      <div className="bg-gray-50 min-h-screen pt-2">
        {/* 🔹 Page Header */}
        <div className="flex items-center justify-between px-3 md:px-8 py-4">
          <h2 className="text-lg md:text-2xl font-bold text-gray-800 capitalize">
            {subcategoryName || "Products"}
          </h2>
          <button
            onClick={() => router.back()}
            className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-sm rounded-md"
          >
            ← Back
          </button>
        </div>

        {/* 🔹 Products Grid */}
        {products.length === 0 ? (
          <p className="text-gray-500 text-center pb-10">
            No products available in this subcategory.
          </p>
        ) : (
          <div
            className="
              grid 
              grid-cols-2
              sm:grid-cols-3 
              md:grid-cols-4 
              lg:grid-cols-5 
              xl:grid-cols-6 
              2xl:grid-cols-7
              gap-x-3 
              gap-y-6
              px-3 sm:px-6 md:px-8
              animate-fadeIn
            "
          >
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* 🛍️ Product Card Component */
/* -------------------------------------------------------------------------- */
function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const imageUrl =
    product.images?.[0]?.startsWith("http")
      ? product.images[0]
      : `${process.env.NEXT_PUBLIC_STORAGE_URL || ""}/${product.images?.[0] || "placeholder.png"}`;

  const price = product.new_price;
  const oldPrice = product.old_price;
  const discount =
    oldPrice && oldPrice > price
      ? Math.round(((oldPrice - price) / oldPrice) * 100)
      : 0;

  const rating = product.average_rating || 0;
  const reviews = product.review_count || 0;

  /* 🟢 Add to Cart */
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (adding || added) return;

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/user/login");
      return;
    }

    setAdding(true);

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/cart/add`,
        { product_id: product.id, quantity: 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAdded(true);
      window.dispatchEvent(new Event("cart-updated"));
      setTimeout(() => setAdded(false), 1500);
    } catch (err) {
      console.error("❌ Failed to add to cart:", err);
      alert("Failed to add item to cart. Please try again.");
    } finally {
      setAdding(false);
    }
  };

  /* 🧾 Format prices with commas */
  const formatPrice = (value?: number) =>
    value?.toLocaleString("en-TZ", { minimumFractionDigits: 0 }) || "0";

  return (
    <div
      onClick={() => router.push(`/user/products?id=${product.id}`)}
      className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-teal-400 transition-all duration-200 cursor-pointer overflow-hidden flex flex-col"
    >
      {/* 🖼️ Image */}
      <div className="relative w-full h-44 bg-gray-100">
        <Image
          src={imageUrl || "/placeholder.png"}
          alt={product.name || "Product"}
          fill
          sizes="200px"
          className="object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "/placeholder.png";
          }}
        />

        {/* 🔹 Discount */}
        {discount > 0 && (
          <div className="absolute top-2 left-2 bg-teal-600 text-white text-xs font-semibold px-2 py-0.5 rounded">
            -{discount}%
          </div>
        )}

        {/* 🛒 Add to Cart */}
        <button
          onClick={handleAddToCart}
          disabled={adding || added}
          className="absolute bottom-2 right-2 w-9 h-9 bg-white rounded-lg shadow flex items-center justify-center hover:bg-gray-100 transition"
        >
          {adding ? (
            <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
          ) : added ? (
            <CheckCircle2 className="text-green-600" size={20} />
          ) : (
            <ShoppingCart className="text-gray-700" size={20} />
          )}
        </button>
      </div>

      {/* 🧾 Info */}
      <div className="px-3 py-2 flex flex-col flex-grow">
        <h3 className="font-medium text-sm text-gray-800 line-clamp-2">
          {product.name}
        </h3>

        {/* ⭐ Rating */}
        <div className="flex items-center gap-1 mt-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={13}
              className={
                i < Math.floor(rating)
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-gray-300"
              }
            />
          ))}
          {reviews > 0 && (
            <span className="text-xs text-gray-500 ml-1">({reviews})</span>
          )}
        </div>

        {/* 💰 Price */}
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-bold text-[15px] text-gray-900">
            TZS {formatPrice(price)}
          </span>
          {oldPrice && (
            <span className="line-through text-xs text-gray-400">
              TZS {formatPrice(oldPrice)}
            </span>
          )}
        </div>

        {/* 🔹 Attributes */}
        {product.attribute_values && product.attribute_values.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {product.attribute_values.slice(0, 2).map((attr, i) => (
              <span
                key={i}
                className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-600"
              >
                {attr.value}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* ✅ Suspense Wrapper */
/* -------------------------------------------------------------------------- */
export default function SubcategoryProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center p-10 text-gray-500">
          Loading...
        </div>
      }
    >
      <SubcategoryProductsInner />
    </Suspense>
  );
}

/* -------------------------------------------------------------------------- */
/* 🌈 Fade Animation for Smooth Load */
/* -------------------------------------------------------------------------- */
if (typeof window !== "undefined") {
  const style = document.createElement("style");
  style.innerHTML = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fadeIn { animation: fadeIn 0.3s ease-in-out; }
  `;
  document.head.appendChild(style);
}
