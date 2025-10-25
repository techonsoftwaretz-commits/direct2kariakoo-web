import { Package, Star, ShoppingBag, BarChart } from "lucide-react";

export default function StatsRow({ products }: { products: any[] }) {
  const stats = [
    { label: "Products", value: products?.length || 0, icon: Package },
    { label: "Rating", value: "4.5", icon: Star },
    { label: "Orders", value: "0", icon: ShoppingBag },
    { label: "Sales", value: "0.00", icon: BarChart },
  ];

  return (
    <div className="grid grid-cols-4 bg-white rounded-lg shadow-sm py-3 text-center mb-4">
      {stats.map((s, i) => (
        <div
          key={i}
          className="flex flex-col items-center justify-center px-2 border-r last:border-r-0 border-gray-100"
        >
          <s.icon className="w-5 h-5 text-teal-700 mb-1" />
          <span className="font-semibold text-gray-800 text-base">{s.value}</span>
          <span className="text-xs text-gray-500">{s.label}</span>
        </div>
      ))}
    </div>
  );
}
