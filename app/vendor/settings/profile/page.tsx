"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import {
  Loader2,
  Camera,
  Edit2,
  Check,
  MapPin,
  Store,
  Mail,
  Phone,
  X,
} from "lucide-react";
import { api } from "@/lib/api";

export default function VendorProfilePage() {
  const [vendor, setVendor] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [showMapPicker, setShowMapPicker] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  // Fetch profile
  async function fetchProfile() {
    try {
      setLoading(true);
      const res = await api.get("/me");
      const data = res.data.user || res.data;
      setUser(data);
      setVendor(data.vendor || {});
      setPhone(data.vendor?.phone || "");
      setLocation(data.vendor?.business_address || "");
    } catch (err) {
      console.error("Failed to fetch profile", err);
    } finally {
      setLoading(false);
    }
  }

  // Upload profile picture
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("logo", file);

    try {
      setIsUploading(true);
      await api.post("/vendor/update-profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Profile picture updated!");
      fetchProfile();
    } catch (err: any) {
      console.error("Upload failed:", err.response?.data || err.message);
      alert("Failed to upload picture. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }

  // Update field (phone or address)
  async function handleUpdate(field: string, value: string) {
    if (!value) return alert("Value cannot be empty");

    const formData = new FormData();
    formData.append(field, value);

    try {
      await api.post("/vendor/update-profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Updated successfully!");
      fetchProfile();
    } catch (err: any) {
      console.error("Update failed:", err.response?.data || err.message);
      alert("Update failed: " + (err.response?.data?.message || "Server error"));
    }
  }

  // Loading screen
  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-yellow-500" />
      </div>
    );

  const logoUrl = vendor?.logo
    ? `${process.env.NEXT_PUBLIC_STORAGE_URL?.replace(/\/$/, "")}/${vendor.logo}`
    : "/placeholder.png";

  return (
    <main className="min-h-screen bg-[#F9FAFB] pb-24 font-poppins">
      <header className="bg-white shadow-sm p-4 sticky top-0 z-30">
        <h1 className="text-lg font-semibold text-gray-800 text-center">
          My Profile
        </h1>
      </header>

      <div className="max-w-2xl mx-auto p-5">
        {/* Avatar */}
        <div className="flex flex-col items-center mb-8 relative">
          <div className="relative">
            <Image
              src={logoUrl}
              alt="Vendor Logo"
              width={110}
              height={110}
              className="rounded-full object-cover border-4 border-white shadow-md"
            />
            <label className="absolute bottom-0 right-0 bg-gray-100 p-2 rounded-full cursor-pointer hover:bg-gray-200 transition">
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />
              ) : (
                <Camera className="w-4 h-4 text-yellow-600" />
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
              />
            </label>
          </div>
          <h2 className="mt-4 text-lg font-semibold text-gray-900">
            {vendor?.business_name || "-"}
          </h2>
          <p className="text-gray-500 text-sm">Vendor Account</p>
        </div>

        {/* Business Name */}
        <ProfileCard
          icon={<Store className="w-5 h-5 text-yellow-600" />}
          title="Business Name"
          subtitle={vendor?.business_name || "-"}
        />

        {/* Email */}
        <ProfileCard
          icon={<Mail className="w-5 h-5 text-yellow-600" />}
          title="Email"
          subtitle={user?.email || vendor?.email || "-"}
        />

        {/* Phone */}
        <EditableRow
          icon={<Phone className="w-5 h-5 text-yellow-600 mt-0.5" />}
          label="Phone"
          value={phone}
          editing={editingPhone}
          setEditing={setEditingPhone}
          onSave={(v: string) => handleUpdate("phone", v)}
        />

        {/* Location */}
        <div className="bg-gray-100 rounded-xl p-4 mb-4 flex items-start justify-between">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="text-sm text-gray-600">Business Address</h4>
              <p className="font-medium text-gray-800 mt-1">{location || "-"}</p>
            </div>
          </div>
          <button
            onClick={() => setShowMapPicker(true)}
            className="text-yellow-600 hover:text-yellow-700 transition"
          >
            <Edit2 size={16} />
          </button>
        </div>

        {vendor?.is_approved === false && (
          <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl text-sm text-orange-700 mt-6">
            ⚠️ Your store is pending approval.
          </div>
        )}
      </div>

      {/* Map Picker Modal */}
      {showMapPicker && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl w-[90%] max-w-lg shadow-lg overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3 border-b">
              <h3 className="text-lg font-semibold text-gray-800">
                Select Business Location
              </h3>
              <button
                onClick={() => setShowMapPicker(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4">
              <MapPicker
                onSelect={(addr: string, lat: number, lng: number) => {
                  setLocation(addr);
                  handleUpdate("business_address", addr);
                }}
                initialAddress={location}
              />
              <button
                onClick={() => setShowMapPicker(false)}
                className="w-full mt-3 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-2 rounded-lg"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// ------------------------ Reusable Components ------------------------
function ProfileCard({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="bg-gray-100 rounded-xl p-4 mb-4 flex items-start gap-3">
      <div>{icon}</div>
      <div>
        <h4 className="text-sm text-gray-600">{title}</h4>
        <p className="font-medium text-gray-800 mt-1">{subtitle}</p>
      </div>
    </div>
  );
}

function EditableRow({
  icon,
  label,
  value,
  editing,
  setEditing,
  onSave,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  editing: boolean;
  setEditing: (b: boolean) => void;
  onSave: (val: string) => void;
}) {
  const [val, setVal] = useState(value);

  return (
    <div className="bg-gray-100 rounded-xl p-4 mb-4 flex items-start justify-between">
      <div className="flex items-start gap-3">
        {icon}
        <div>
          <h4 className="text-sm text-gray-600">{label}</h4>
          {editing ? (
            <div className="mt-2 flex items-center gap-2">
              <input
                value={val}
                onChange={(e) => setVal(e.target.value)}
                className="border border-gray-300 rounded-lg px-2 py-1 text-sm w-44 text-gray-900 bg-white focus:ring-2 focus:ring-yellow-400 outline-none caret-yellow-500"
              />
              <button
                onClick={() => {
                  onSave(val);
                  setEditing(false);
                }}
                className="p-1 rounded-md bg-yellow-500 text-black font-semibold"
              >
                <Check size={14} />
              </button>
            </div>
          ) : (
            <p className="font-medium text-gray-800 mt-1">{value || "-"}</p>
          )}
        </div>
      </div>
      {!editing && (
        <button
          onClick={() => setEditing(true)}
          className="text-yellow-600 hover:text-yellow-700 transition"
        >
          <Edit2 size={16} />
        </button>
      )}
    </div>
  );
}

// ✅ Fixed MapPicker — now shows readable place names instead of lat/lng
function MapPicker({
  onSelect,
  initialAddress,
}: {
  onSelect: (address: string, lat: number, lng: number) => void;
  initialAddress?: string;
}) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.google || !mapRef.current) return;

    const defaultPosition = { lat: -6.8, lng: 39.28 };
    const map = new google.maps.Map(mapRef.current, {
      center: defaultPosition,
      zoom: 12,
    });

    const input = document.getElementById("placeInput") as HTMLInputElement;
    const autocomplete = new google.maps.places.Autocomplete(input);
    autocomplete.bindTo("bounds", map);

    const marker = new google.maps.Marker({ map });
    const geocoder = new google.maps.Geocoder();

    // When user selects place from search box
    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry || !place.geometry.location) return;
      map.setCenter(place.geometry.location);
      marker.setPosition(place.geometry.location);
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      onSelect(place.formatted_address || "", lat, lng);
    });

    // When user taps on map
    map.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      marker.setPosition(e.latLng);

      // Reverse geocode to get address
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          const address = results[0].formatted_address;
          onSelect(address, lat, lng);
        } else {
          onSelect("Unknown location", lat, lng);
        }
      });
    });
  }, []);

  return (
    <div>
      <input
        id="placeInput"
        className="w-full border p-2 rounded mb-2 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-yellow-400 caret-yellow-500"
        placeholder={initialAddress || "Search or tap on map"}
      />
      <div ref={mapRef} className="w-full h-64 rounded-lg border" />
    </div>
  );
}
