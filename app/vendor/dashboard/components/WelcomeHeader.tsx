export default function WelcomeHeader({ vendor }: { vendor?: any }) {
    return (
      <div className="mb-3">
        <h2 className="text-[20px] font-bold text-gray-800 leading-tight">
          Welcome back, <span className="text-teal-700">{vendor?.name || "Vendor"} 👋</span>
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Here’s your business overview today
        </p>
      </div>
    );
  }
  