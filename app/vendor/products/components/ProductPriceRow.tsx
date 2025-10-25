"use client";

export default function ProductPriceRow({ product }: { product: any }) {
  const newPrice = Number(product.new_price || 0);
  const oldPrice = Number(product.old_price || 0);
  const discount =
    oldPrice > newPrice
      ? Math.round(((oldPrice - newPrice) / oldPrice) * 100)
      : 0;

  const stock = product.stock || product.remaining_stock || 0;

  return (
    <div className="bg-white border border-gray-100 rounded-lg p-4">
      <div className="flex items-end gap-3">
        <span className="text-[17px] font-semibold text-gray-700">TZS</span>
        <span className="text-[23px] font-extrabold text-black leading-none">
          {newPrice.toLocaleString()}
        </span>
        {discount > 0 && (
          <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-md">
            -{discount}%
          </span>
        )}
      </div>

      {oldPrice > 0 && (
        <div className="mt-1 text-gray-400 text-sm line-through">
          {oldPrice.toLocaleString()} TZS
        </div>
      )}

      {stock > 0 ? (
        <p className="mt-2 text-teal-700 font-semibold text-sm">
          Only {stock} left in stock.
        </p>
      ) : (
        <p className="mt-2 text-red-500 font-semibold text-sm">Out of stock</p>
      )}
    </div>
  );
}
