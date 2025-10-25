"use client";

import { useState, useEffect } from "react";
import ActiveOrdersTab from "./components/ActiveOrdersTab";
import OrderHistoryTab from "./components/OrderHistoryTab";
import RefundTab from "./components/RefundTab";
import VendorHeader from "../dashboard/components/VendorHeader";

export default function VendorOrdersPage() {
  const tabs = ["Active Orders", "Order History", "Refund"];
  const [selected, setSelected] = useState(0);
  const [vendor, setVendor] = useState<any>(null);

  const tabComponents = [
    <ActiveOrdersTab key="active" />,
    <OrderHistoryTab key="history" />,
    <RefundTab key="refund" />,
  ];

  useEffect(() => {
    const storedVendor = localStorage.getItem("vendor");
    if (storedVendor) setVendor(JSON.parse(storedVendor));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <VendorHeader vendor={vendor} />

      {/* Page Title */}
      <header className="bg-white text-center py-4 shadow-sm border-b border-gray-100 mt-2">
        <h1 className="text-lg font-semibold text-gray-800">Orders</h1>
      </header>

      {/* Tabs */}
      <div className="flex mx-4 my-3 bg-white rounded-lg overflow-hidden border border-gray-200">
        {tabs.map((t, i) => (
          <button
            key={i}
            onClick={() => setSelected(i)}
            className={`flex-1 py-2.5 text-sm font-medium transition-all ${
              selected === i
                ? "bg-black text-white"
                : "bg-transparent text-gray-700 hover:bg-gray-100"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Active Tab Content */}
      <div className="px-4">{tabComponents[selected]}</div>
    </div>
  );
}
