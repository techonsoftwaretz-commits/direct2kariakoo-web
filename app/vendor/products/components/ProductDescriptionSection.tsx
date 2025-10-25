"use client";

import { useState } from "react";

export default function ProductDescriptionSection({
  description,
}: {
  description: string;
}) {
  const [expanded, setExpanded] = useState(false);
  if (!description) return null;

  const isLong = description.length > 400;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm transition hover:shadow-md">
      <h3 className="text-lg font-bold mb-3 text-gray-900">Product Description</h3>

      {/* Description container */}
      <div className="relative">
        <p
          className={`text-gray-700 text-[15px] leading-relaxed whitespace-pre-line transition-all duration-500 ${
            expanded ? "max-h-[1000px]" : "max-h-[180px]"
          } overflow-hidden`}
        >
          {description}
        </p>

        {/* Gradient fade for long text */}
        {isLong && !expanded && (
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white via-white/80 to-transparent" />
        )}
      </div>

      {isLong && (
        <div className="flex justify-center mt-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-teal-700 font-semibold text-sm hover:text-teal-800 transition"
          >
            {expanded ? "Show less" : "Read full description"}
          </button>
        </div>
      )}
    </div>
  );
}
