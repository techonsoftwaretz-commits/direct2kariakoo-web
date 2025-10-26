"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import axios from "axios";

interface Banner {
  id: number;
  image: string;
  alt?: string;
  link?: string;
}

export default function BannerCarousel() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // ✅ Fetch banners
  useEffect(() => {
    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/banners`)
      .then((res) => {
        if (Array.isArray(res.data)) setBanners(res.data);
      })
      .catch((err) => console.error("❌ Failed to load banners:", err));
  }, []);

  // ✅ Detect mobile
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ✅ Auto-slide
  useEffect(() => {
    if (isPaused || banners.length === 0) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(interval);
  }, [isPaused, banners]);

  if (banners.length === 0) return null;

  /* -------------------------------------------------------------------------- */
  /* 💻 + 📱 SAME CLEAN CAROUSEL (no scrollbars, no swipe)                      */
  /* -------------------------------------------------------------------------- */
  return (
    <div
      className={`relative w-full ${
        isMobile ? "h-[160px]" : "h-[280px]"
      } max-w-[1400px] mx-auto overflow-hidden select-none rounded-xl`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* ✅ Banners */}
      {banners.map((banner, index) => (
        <div
          key={banner.id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            index === current ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
          <a href={banner.link || "#"} target="_blank" rel="noopener noreferrer">
            <Image
              src={
                banner.image.startsWith("http")
                  ? banner.image
                  : `${process.env.NEXT_PUBLIC_STORAGE_URL}/${banner.image}`
              }
              alt={banner.alt || "Banner"}
              fill
              className="object-cover"
              priority={index === 0}
            />
          </a>
        </div>
      ))}

      {/* ✅ Arrows (desktop only) */}
      {!isMobile && (
        <>
          <button
            onClick={() =>
              setCurrent((prev) => (prev === 0 ? banners.length - 1 : prev - 1))
            }
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 
            bg-white/90 hover:bg-white text-gray-800 rounded-full w-10 h-10 flex items-center justify-center shadow-md transition-all active:scale-90"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() =>
              setCurrent((prev) =>
                prev === banners.length - 1 ? 0 : prev + 1
              )
            }
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 
            bg-white/90 hover:bg-white text-gray-800 rounded-full w-10 h-10 flex items-center justify-center shadow-md transition-all active:scale-90"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* ✅ Dots */}
      <div className="absolute bottom-3 left-0 right-0 z-30 flex justify-center gap-2">
        {banners.map((_, i) => (
          <div
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-[3px] rounded-full cursor-pointer transition-all duration-300 ${
              i === current ? "bg-yellow-400 w-6" : "bg-gray-300 w-4 hover:bg-gray-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
