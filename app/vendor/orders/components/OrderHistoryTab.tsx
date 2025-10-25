"use client";

import { useEffect, useState } from "react";
import { Calendar, Phone } from "lucide-react";

export default function OrderHistoryTab() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const api = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch(`${api}/vendor/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const allOrders = data.orders || [];

        const completed = allOrders.filter(
          (o: any) => o.status === "completed"
        );
        setHistory(completed);
      } catch (err) {
        console.error("❌ Failed to fetch vendor order history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading)
    return (
      <div className="text-center text-gray-500 py-20">
        Loading order history...
      </div>
    );

  if (history.length === 0)
    return (
      <div className="text-center text-gray-500 py-20">
        No completed orders yet.
      </div>
    );

  return (
    <div className="space-y-4 mb-20">
      {history.map((order) => {
        const product = order.product || {};
        const buyer = order.buyer || {};
        const image =
          typeof product.images?.[0] === "string"
            ? product.images[0]
            : product.images?.[0]?.image;

        return (
          <div
            key={order.id}
            className="flex bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all duration-200"
          >
            {/* 🖼️ Product Image */}
            <div className="w-24 h-24 bg-gray-50 flex-shrink-0">
              {image ? (
                <img
                  src={
                    image.startsWith("http")
                      ? image
                      : `${process.env.NEXT_PUBLIC_STORAGE_URL}/${image}`
                  }
                  alt={product.name || "Product"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                  No Image
                </div>
              )}
            </div>

            {/* 📦 Order Info */}
            <div className="flex-1 p-3 flex flex-col justify-between">
              {/* Header Row */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900 text-[15px] line-clamp-1">
                    {product.name || "Unnamed Product"} ({order.quantity}x)
                  </h3>
                  <p className="text-sm text-gray-500">
                    {buyer.name || "Unknown Buyer"}
                  </p>

                  {buyer.phone && (
                    <a
                      href={`tel:${buyer.phone}`}
                      className="flex items-center gap-1 text-sm text-teal-700 font-medium mt-1 hover:text-teal-800 transition"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {buyer.phone}
                    </a>
                  )}
                </div>

                {/* 🟢 Status Badge */}
                <span className="text-xs font-semibold px-2 py-1 bg-green-100 text-green-700 rounded-full capitalize">
                  {order.status}
                </span>
              </div>

              {/* 🕓 Date + Total */}
              <div className="flex justify-between items-center mt-2">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(order.created_at).toLocaleDateString()}
                </div>

                <div className="text-sm font-semibold text-teal-700">
                  TZS {order.total?.toLocaleString()}
                </div>
              </div>

              {/* ☎️ Call Buyer Button */}
              {buyer.phone && (
                <div className="mt-3">
                  <a
                    href={`tel:${buyer.phone}`}
                    className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold py-2 rounded-lg transition w-full"
                  >
                    <Phone className="w-4 h-4" />
                    Call Buyer
                  </a>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
