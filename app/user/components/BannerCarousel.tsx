"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
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
  const containerRef = useRef<HTMLDivElement>(null);

  /* ✅ Fetch banners from Laravel API */
  useEffect(() => {
    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/banners`)
      .then((res) => {
        if (Array.isArray(res.data)) setBanners(res.data);
        else console.error("Unexpected banner response:", res.data);
      })
      .catch((err) => console.error("❌ Failed to load banners:", err));
  }, []);

  /* ✅ Detect mobile view */
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* ✅ Auto-slide every 4 seconds */
  useEffect(() => {
    if (!banners.length) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
      scrollToSlide(current + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, [banners, current]);

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
  /* 💻 DESKTOP: Full-width fade slider                                         */
  /* 📱 MOBILE: Noon-style swipeable, center large, sides small                 */
  /* -------------------------------------------------------------------------- */

  if (!isMobile) {
    return (
      <div className="relative w-full max-w-[1400px] mx-auto overflow-hidden rounded-xl shadow-md select-none">
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

        {/* Dots Indicator */}
        <div className="absolute bottom-3 left-0 right-0 z-30 flex justify-center gap-2 bg-white/30 backdrop-blur-sm py-1">
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

  /* ---------------------------- 📱 MOBILE VERSION ---------------------------- */
  return (
    <div className="w-full bg-white py-3 select-none">
      <div
        ref={containerRef}
        className="flex gap-4 overflow-x-auto px-4 scrollbar-hide snap-x snap-mandatory scroll-smooth"
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
                width: "80%",
                minWidth: "80%",
                transformOrigin: "center",
              }}
            >
              <a href={banner.link || "#"} target="_blank" rel="noopener noreferrer">
                <div className="relative w-full h-[170px] rounded-2xl overflow-hidden shadow-lg">
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

      {/* Scroll dots */}
      <div className="flex justify-center mt-3 gap-2">
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
