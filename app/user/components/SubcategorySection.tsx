"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";

interface Subcategory {
  id: number;
  name: string;
  icon_image_url?: string | null;
}

interface Props {
  categoryId: number;
  onSelectSubcategory: (id: number) => void;
}

const SubcategorySection: React.FC<Props> = ({
  categoryId,
  onSelectSubcategory,
}) => {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Fetch subcategories
  useEffect(() => {
    if (!categoryId) return;
    setLoading(true);

    axios
      .get(
        `${process.env.NEXT_PUBLIC_API_URL}/categories/${categoryId}/subcategories`
      )
      .then((res) => {
        const subs = Array.isArray(res.data) ? res.data : [];
        setSubcategories(subs);
        if (subs.length > 0) {
          setSelectedId(subs[0].id);
          onSelectSubcategory(subs[0].id); // 🔹 Load first subcategory by default
        } else {
          setSelectedId(null);
          onSelectSubcategory(0);
        }
      })
      .catch((err) => console.error("❌ Error loading subcategories:", err))
      .finally(() => setLoading(false));
  }, [categoryId]);

  if (loading)
    return (
      <div className="flex justify-center py-4">
        <p className="text-gray-500 text-sm">Loading subcategories...</p>
      </div>
    );

  if (subcategories.length === 0)
    return (
      <div className="flex justify-center py-4">
        <p className="text-gray-400 text-sm">No subcategories found.</p>
      </div>
    );

  return (
    <div className="flex gap-3 overflow-x-auto px-4 py-2 scrollbar-hide">
      {subcategories.map((sub) => (
        <button
          key={sub.id}
          onClick={() => {
            setSelectedId(sub.id);
            onSelectSubcategory(sub.id); // ✅ Just update parent state — no navigation
          }}
          className={`flex items-center gap-2 border rounded-full px-4 py-2 flex-shrink-0 transition-all ${
            selectedId === sub.id
              ? "bg-teal-600 text-white border-teal-600 shadow-md"
              : "bg-white text-gray-700 border-gray-200 hover:border-teal-400"
          }`}
        >
          {sub.icon_image_url ? (
            <Image
              src={sub.icon_image_url}
              alt={sub.name}
              width={24}
              height={24}
              className="rounded-full object-cover"
            />
          ) : (
            <span className="text-lg">🛍️</span>
          )}
          <span className="text-sm font-medium whitespace-nowrap">
            {sub.name}
          </span>
        </button>
      ))}
    </div>
  );
};

export default SubcategorySection;
