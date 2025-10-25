"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export default function ProductImageSlider({ images = [] }: { images: string[] }) {
  const [selected, setSelected] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Handle no images
  if (!images || images.length === 0) {
    return (
      <div className="w-full h-[320px] bg-gray-100 flex items-center justify-center text-gray-400">
        No Images
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* MAIN IMAGE */}
      <div
        className="relative w-full h-[380px] bg-gray-100 overflow-hidden cursor-pointer"
        onClick={() => setIsPreviewOpen(true)}
      >
        <Image
          src={images[selected]}
          alt={`Product image ${selected + 1}`}
          fill
          unoptimized
          loader={({ src }) => src}
          className="object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "/placeholder.png";
          }}
        />

        {/* INDICATORS */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
            {images.map((_, i) => (
              <div
                key={i}
                className={`h-[6px] rounded-full transition-all duration-300 ${
                  selected === i ? "w-[18px] bg-white" : "w-[6px] bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* THUMBNAILS */}
      {images.length > 1 && (
        <div className="flex gap-3 px-4 py-3 overflow-x-auto scrollbar-hide">
          {images.map((img, i) => (
            <div
              key={i}
              onClick={() => setSelected(i)}
              className={`relative flex-shrink-0 w-[74px] h-[74px] rounded-lg overflow-hidden border transition-all duration-200 cursor-pointer ${
                selected === i ? "border-yellow-400" : "border-transparent"
              }`}
            >
              <Image
                src={img}
                alt={`Thumbnail ${i + 1}`}
                fill
                unoptimized
                loader={({ src }) => src}
                className="object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/placeholder.png";
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* FULLSCREEN PREVIEW MODAL */}
      <AnimatePresence>
        {isPreviewOpen && (
          <motion.div
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="relative w-full h-full flex items-center justify-center">
              {/* CLOSE BUTTON */}
              <button
                className="absolute top-6 right-6 text-white text-3xl font-bold"
                onClick={() => setIsPreviewOpen(false)}
              >
                ✕
              </button>

              {/* FULLSCREEN SLIDER */}
              <div className="w-full max-w-5xl mx-auto relative">
                <div className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-hide">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className="min-w-full flex justify-center items-center snap-center"
                    >
                      <Image
                        src={img}
                        alt={`Preview ${idx + 1}`}
                        width={800}
                        height={800}
                        unoptimized
                        loader={({ src }) => src}
                        className="object-contain max-h-[80vh]"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/placeholder.png";
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* INDICATORS */}
                <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
                  {images.map((_, i) => (
                    <div
                      key={i}
                      className={`h-[7px] rounded-full transition-all duration-300 ${
                        selected === i ? "w-[18px] bg-white" : "w-[7px] bg-white/40"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
