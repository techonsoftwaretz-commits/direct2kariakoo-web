import { Zap } from "lucide-react";
import Link from "next/link";

export default function SalesCard() {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Zap className="text-yellow-500 w-6 h-6" />
          <h2 className="font-semibold text-gray-800 text-lg">
            Current Package
          </h2>
        </div>
        <span className="text-teal-600 font-bold text-lg">Pro Plan</span>
      </div>
      <p className="text-gray-700 text-sm">
        Product Upload Limit: 500 times
      </p>
      <p className="text-gray-500 text-sm mb-4">
        Package Expires: 2025-09-30
      </p>
      <Link
        href="/vendor/settings/subscription"
        className="block w-full text-center bg-teal-600 text-white font-medium rounded-lg py-2.5 hover:bg-teal-700 transition"
      >
        Upgrade Package
      </Link>
    </div>
  );
}
