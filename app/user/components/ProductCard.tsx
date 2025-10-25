"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import axios from "axios";
import { ShoppingCart, CheckCircle2, Star } from "lucide-react";

interface Product {
  id: number;
  name: string;
  image: string;
  price: number;
  oldPrice?: number;
  rating?: number;
  reviews?: number;
  attributes?: string[];
}

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const discount =
    product.oldPrice && product.oldPrice > product.price
      ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
      : 0;

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

  // ✅ Handle Add to Cart + Trigger Header Update
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation(); // avoid navigating to product details
    if (adding || added) return;

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/user/login");
      return;
    }

    setAdding(true);

    try {
      // ✅ Send to backend
      await axios.post(
        `${apiBaseUrl}/cart/add`,
        { product_id: product.id, quantity: 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // ✅ Update UI instantly
      setAdded(true);

      // ✅ Notify Header to refresh cart count
      window.dispatchEvent(new Event("cart-updated"));

      // reset back after 1.5s
      setTimeout(() => setAdded(false), 1500);
    } catch (err) {
      console.error("❌ Failed to add to cart:", err);
      alert("Failed to add item to cart. Please try again.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div
    onClick={() => router.push(`/user/products?id=${product.id}`)}
      className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-teal-400 transition-all duration-200 cursor-pointer overflow-hidden flex flex-col"
    >
      {/* 🖼️ Product Image */}
      <div className="relative w-full h-40 bg-gray-100">
        <Image
          src={product.image || "/placeholder.png"}
          alt={product.name}
          fill
          sizes="200px"
          className="object-cover"
        />

        {/* 🔹 Discount Tag */}
        {discount > 0 && (
          <div className="absolute top-2 left-2 bg-teal-600 text-white text-xs font-semibold px-2 py-0.5 rounded">
            -{discount}%
          </div>
        )}

        {/* 🛒 Add to Cart Button */}
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

      {/* 🧾 Product Info */}
      <div className="px-3 py-2 flex flex-col flex-grow">
        <h3 className="font-medium text-sm text-gray-800 line-clamp-2">{product.name}</h3>

        {/* ⭐ Rating */}
        <div className="flex items-center gap-1 mt-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={13}
              className={
                i < Math.floor(product.rating || 0)
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-gray-300"
              }
            />
          ))}
          {product.reviews && (
            <span className="text-xs text-gray-500 ml-1">({product.reviews})</span>
          )}
        </div>

        {/* 💰 Price */}
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-bold text-[15px] text-gray-900">
          TZS {Number(product.price).toLocaleString("en-TZ")}
          </span>
          {product.oldPrice && (
            <span className="line-through text-xs text-gray-400">
              TZS {product.oldPrice.toLocaleString()}
            </span>
          )}
        </div>

        {/* 🔹 Attributes */}
        {product.attributes && product.attributes.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {product.attributes.slice(0, 2).map((attr, i) => (
              <span
                key={i}
                className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-600"
              >
                {attr}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
