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

  // ✅ Fetch banners from Laravel API
  useEffect(() => {
    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/banners`)
      .then((res) => {
        if (Array.isArray(res.data)) setBanners(res.data);
      })
      .catch((err) => console.error("❌ Failed to load banners:", err));
  }, []);

  // ✅ Detect mobile view
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ✅ Auto-slide every 4 seconds
  useEffect(() => {
    if (!banners.length) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(interval);
  }, [banners]);

  // ✅ Handle scroll snapping for mobile swipe
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onScroll = () => {
      const scrollCenter = container.scrollLeft + container.offsetWidth / 2;
      let closest = 0;
      let closestDiff = Infinity;
      banners.forEach((_, i) => {
        const slide = container.children[i] as HTMLElement;
        const diff = Math.abs(slide.offsetLeft + slide.offsetWidth / 2 - scrollCenter);
        if (diff < closestDiff) {
          closestDiff = diff;
          closest = i;
        }
      });
      setCurrent(closest);
    };
    container.addEventListener("scroll", onScroll);
    return () => container.removeEventListener("scroll", onScroll);
  }, [banners]);

  if (!banners.length) return null;

  /* -------------------------------------------------------------------------- */
  /* ✅ DESKTOP: Full-width classic carousel                                    */
  /* ✅ MOBILE: Swipeable cards with center zoom                                */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="w-full mx-auto bg-white select-none">
      {isMobile ? (
        // 📱 MOBILE VERSION
        <div
          ref={containerRef}
          className="flex overflow-x-auto snap-x snap-mandatory gap-3 px-3 py-3 scroll-smooth scrollbar-hide"
        >
          {banners.map((banner, index) => {
            const scale = index === current ? "scale-100" : "scale-90 opacity-70";
            return (
              <div
                key={banner.id}
                className={`flex-shrink-0 snap-center transition-transform duration-500 ${scale}`}
                style={{ width: "85%", minWidth: "85%" }}
              >
                <a href={banner.link || "#"} target="_blank" rel="noopener noreferrer">
                  <div className="relative w-full h-[180px] rounded-2xl overflow-hidden shadow-md">
                    <Image
                      src={banner.image}
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
      ) : (
        // 💻 DESKTOP VERSION
        <div className="relative w-full max-w-[1400px] mx-auto overflow-hidden rounded-xl shadow-md">
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className={`absolute inset-0 transition-opacity duration-700 ${
                index === current ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
            >
              <a href={banner.link || "#"} target="_blank" rel="noopener noreferrer">
                <Image
                  src={banner.image}
                  alt={banner.alt || "Banner"}
                  fill
                  className="object-cover"
                  priority={index === 0}
                />
              </a>
            </div>
          ))}

          {/* Dots Indicator */}
          <div className="absolute bottom-3 left-0 right-0 z-30 flex justify-center gap-2 bg-white/20 backdrop-blur-sm py-1">
            {banners.map((_, i) => (
              <div
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-[3px] rounded-full cursor-pointer transition-all duration-300 ${
                  i === current ? "bg-yellow-400 w-6" : "bg-gray-200 w-4 hover:bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
