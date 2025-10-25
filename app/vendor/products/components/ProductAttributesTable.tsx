"use client";

export default function ProductAttributesTable({
  attributes,
}: {
  attributes: any[];
}) {
  if (!attributes?.length) return null;

  return (
    <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-800">
        Product Details
      </div>
      <div>
        {attributes.map((attr, i) => (
          <div
            key={i}
            className="flex justify-between items-start px-4 py-2 border-b border-gray-100 last:border-none"
          >
            <span className="text-gray-500 text-sm font-medium w-[40%]">
              {attr.attribute?.name || attr.feature || "-"}
            </span>
            <span className="text-gray-900 text-sm font-semibold w-[60%] text-right">
              {attr.value || attr.detail || "-"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
