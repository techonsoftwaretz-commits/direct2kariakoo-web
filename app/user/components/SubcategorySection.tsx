"use client";

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Subcategory {
  id: number;
  name: string;
  icon_image_url?: string | null;
}

interface Props {
  categoryId: number;
  onSelectSubcategory: (id: number) => void;
}

/* ------------------------------- 🧠 Cache Setup ------------------------------ */
const CACHE_EXPIRY_MS = 12 * 60 * 60 * 1000; // 12h
const memoryCache = new Map<number, { data: Subcategory[]; time: number }>();

export default function SubcategorySection({
  categoryId,
  onSelectSubcategory,
}: Props) {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  /* -------------------------- 🧠 Load Cached Data First -------------------------- */
  useEffect(() => {
    if (!categoryId) return;
    const cacheKey = `subcategory_cache_${categoryId}`;
    const now = Date.now();

    // 🪄 Check memory cache first
    if (memoryCache.has(categoryId)) {
      const { data, time } = memoryCache.get(categoryId)!;
      if (now - time < CACHE_EXPIRY_MS) {
        setSubcategories(data);
        setLoading(false);
        if (data.length > 0) {
          setSelectedId(data[0].id);
          onSelectSubcategory(data[0].id);
        }
        return;
      }
    }

    // 🪄 Check localStorage cache second
    const localCache = localStorage.getItem(cacheKey);
    if (localCache) {
      try {
        const parsed = JSON.parse(localCache);
        if (now - parsed.time < CACHE_EXPIRY_MS && Array.isArray(parsed.data)) {
          setSubcategories(parsed.data);
          setLoading(false);
          memoryCache.set(categoryId, parsed);
          if (parsed.data.length > 0) {
            setSelectedId(parsed.data[0].id);
            onSelectSubcategory(parsed.data[0].id);
          }
          return;
        }
      } catch {}
    }

    // 🕐 Otherwise, fetch fresh
    setLoading(true);
    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/categories/${categoryId}/subcategories`)
      .then((res) => {
        const subs = Array.isArray(res.data) ? res.data : [];
        const cacheData = { data: subs, time: now };
        memoryCache.set(categoryId, cacheData);
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        setSubcategories(subs);
        if (subs.length > 0) {
          setSelectedId(subs[0].id);
          onSelectSubcategory(subs[0].id);
        }
      })
      .catch((err) => console.error("❌ Error loading subcategories:", err))
      .finally(() => setLoading(false));
  }, [categoryId]);

  /* -------------------------- 🧭 Scroll Handlers ---------------------------- */
  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
    const progress = (el.scrollLeft / (el.scrollWidth - el.clientWidth)) * 100;
    setScrollProgress(progress);
  };

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -400 : 400, behavior: "smooth" });
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, []);

  /* -------------------------- 💠 Loading States ---------------------------- */
  if (loading)
    return (
      <div className="flex gap-4 overflow-hidden px-6 py-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 animate-pulse">
            <div className="w-[80px] h-[80px] rounded-full bg-gray-200" />
            <div className="h-3 w-16 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );

  if (subcategories.length === 0)
    return (
      <div className="flex justify-center py-6 text-gray-400 text-sm">
        No subcategories found.
      </div>
    );

  /* ------------------------------ 🧩 Render -------------------------------- */
  return (
    <div className="relative bg-white pt-6 pb-10 px-4">
      {/* ◀ Left Arrow */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white border border-gray-200 rounded-full shadow-md w-8 h-8 flex items-center justify-center hover:bg-gray-100"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
      )}

      {/* 🔹 Scroll Container */}
      <div
        ref={scrollRef}
        className="flex gap-8 overflow-x-auto scroll-smooth scrollbar-hide px-4 items-center"
        style={{ scrollPadding: "0 1rem" }}
      >
        {subcategories.map((sub) => {
          const isActive = selectedId === sub.id;
          return (
            <button
              key={sub.id}
              onClick={() => {
                setSelectedId(sub.id);
                onSelectSubcategory(sub.id);
              }}
              className={`flex flex-col items-center flex-shrink-0 w-[90px] sm:w-[100px] focus:outline-none transition-transform duration-200 ${
                isActive ? "scale-[1.05]" : "hover:scale-[1.03]"
              }`}
            >
              {/* 🖼️ Circular Icon */}
              <div
                className={`w-[80px] h-[80px] rounded-full border flex items-center justify-center overflow-hidden shadow-sm transition-all bg-white ${
                  isActive
                    ? "border-[#008080] ring-2 ring-[#B2DFDB]"
                    : "border-gray-200 hover:border-[#008080]"
                }`}
              >
                {sub.icon_image_url ? (
                  <Image
                    src={sub.icon_image_url}
                    alt={sub.name}
                    width={80}
                    height={80}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span className="text-2xl">🛍️</span>
                )}
              </div>

              {/* 🏷 Label */}
              <span
                className={`mt-3 text-[13px] font-semibold text-center leading-tight ${
                  isActive ? "text-[#008080]" : "text-gray-800"
                }`}
              >
                {sub.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* ▶ Right Arrow */}
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white border border-gray-200 rounded-full shadow-md w-8 h-8 flex items-center justify-center hover:bg-gray-100"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      )}

      {/* 🔘 Scroll Bar Indicator */}
      <div className="absolute bottom-3 left-4 right-4 h-[3px] bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#008080] transition-all duration-200"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>
    </div>
  );
}
