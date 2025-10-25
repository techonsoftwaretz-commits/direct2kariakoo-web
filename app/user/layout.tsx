import "../globals.css";
import Script from "next/script";

export const metadata = {
  title: "User | Direct2Kariakoo",
  description: "Shop smart and direct from Kariakoo vendors.",
};

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 font-sans">
      {/* ✅ Load Google Maps Script safely (client-side) */}
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        strategy="afterInteractive"
      />

      {/* 🧱 Main container for all /user routes */}
      {children}
    </div>
  );
}
