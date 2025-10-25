"use client";

interface Props {
  isCustomer: boolean;
  setIsCustomer: (v: boolean) => void;
}

export default function AccountTypeSwitch({ isCustomer, setIsCustomer }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-2 flex justify-between mb-4">
      <button
        onClick={() => setIsCustomer(true)}
        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-[15px] ${
          isCustomer
            ? "bg-yellow-400 text-black shadow"
            : "bg-gray-100 text-gray-700"
        }`}
      >
        👤 Customer
      </button>
      <div className="w-3" />
      <button
        onClick={() => setIsCustomer(false)}
        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-[15px] ${
          !isCustomer
            ? "bg-yellow-400 text-black shadow"
            : "bg-gray-100 text-gray-700"
        }`}
      >
        🏬 Vendor
      </button>
    </div>
  );
}
