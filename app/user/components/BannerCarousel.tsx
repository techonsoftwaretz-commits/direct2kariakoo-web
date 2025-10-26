"use client";

import { useState, useEffect, useRef } from "react";
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
  const [isMobile, setIsMobile] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  /* ✅ Fetch from Laravel API */
  useEffect(() => {
    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/banners`)
      .then((res) => {
        if (Array.isArray(res.data)) setBanners(res.data);
        else console.error("Unexpected banner response:", res.data);
      })
      .catch((err) => console.error("❌ Failed to load banners:", err));
  }, []);

  /* ✅ Detect mobile screen */
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* ✅ Auto slide */
  useEffect(() => {
    if (isPaused || banners.length === 0) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
      if (isMobile) scrollToSlide(current + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, [isPaused, banners, current, isMobile]);

  const scrollToSlide = (index: number) => {
    const el = containerRef.current;
    if (!el) return;
    const children = el.children;
    if (children[index]) {
      (children[index] as HTMLElement).scrollIntoView({
        behavior: "smooth",
        inline: "center",
      });
    }
  };

  if (banners.length === 0) return null;

  /* -------------------------------------------------------------------------- */
  /* 💻 DESKTOP: Full-width banner carousel with fade & buttons                 */
  /* -------------------------------------------------------------------------- */
  if (!isMobile) {
    return (
      <div
        className="relative w-full max-w-[1400px] mx-auto overflow-hidden select-none rounded-xl"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* ✅ Banner images */}
        <div className="relative h-[180px] sm:h-[230px] md:h-[280px] lg:h-[320px]">
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
        </div>

        {/* ✅ Navigation buttons */}
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
            setCurrent((prev) => (prev === banners.length - 1 ? 0 : prev + 1))
          }
          className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 
          bg-white/90 hover:bg-white text-gray-800 rounded-full w-10 h-10 flex items-center justify-center shadow-md transition-all active:scale-90"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

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

  /* -------------------------------------------------------------------------- */
  /* 📱 MOBILE: Swipeable noon-style with small spacing                         */
  /* -------------------------------------------------------------------------- */
  return (
    <div className="w-full select-none">
      <div
        ref={containerRef}
        className="flex gap-2 overflow-x-auto px-2 scrollbar-hide snap-x snap-mandatory scroll-smooth"
      >
        {banners.map((banner, index) => {
          const isActive = index === current;
          return (
            <div
              key={banner.id}
              onClick={() => setCurrent(index)}
              className={`flex-shrink-0 snap-center transition-all duration-500 ease-in-out ${
                isActive ? "scale-100 opacity-100" : "scale-90 opacity-70"
              }`}
              style={{
                width: "90%",
                minWidth: "90%",
                transformOrigin: "center",
              }}
            >
              <a href={banner.link || "#"} target="_blank" rel="noopener noreferrer">
                <div className="relative w-full h-[160px] rounded-xl overflow-hidden shadow-md">
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
                </div>
              </a>
            </div>
          );
        })}
      </div>

      {/* ✅ Small dots */}
      <div className="flex justify-center mt-2 gap-2">
        {banners.map((_, i) => (
          <div
            key={i}
            className={`h-[3px] rounded-full transition-all ${
              i === current ? "bg-yellow-400 w-5" : "bg-gray-300 w-3"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
