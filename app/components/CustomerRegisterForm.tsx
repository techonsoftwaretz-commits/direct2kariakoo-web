"use client";

import { useState } from "react";
import InputCardField from "./InputCardField";
import { AuthService } from "@/services/authService";
import MapPicker from "./MapPicker";

export default function CustomerRegisterForm({ onSuccess }: { onSuccess?: () => void }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    address: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showMap, setShowMap] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      setError("Please fill all required fields.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        latitude: coordinates?.lat,
        longitude: coordinates?.lng,
      };

      const res = await AuthService.registerCustomer(payload);
      setSuccess("Account created successfully!");
      if (onSuccess) onSuccess();
      console.log("✅ Registered customer:", res);
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Name fields */}
      <div className="grid grid-cols-2 gap-3">
        <InputCardField
          label="First Name *"
          value={form.firstName}
          onChange={(v) => setForm({ ...form, firstName: v })}
        />
        <InputCardField
          label="Last Name *"
          value={form.lastName}
          onChange={(v) => setForm({ ...form, lastName: v })}
        />
      </div>

      <InputCardField
        label="Email Address *"
        type="email"
        placeholder="example@email.com"
        value={form.email}
        onChange={(v) => setForm({ ...form, email: v })}
      />

      <InputCardField
        label="Password *"
        type="password"
        placeholder="Minimum 8 characters"
        value={form.password}
        onChange={(v) => setForm({ ...form, password: v })}
      />

      <InputCardField
        label="Phone"
        placeholder="+255XXXXXXXXX"
        value={form.phone}
        onChange={(v) => setForm({ ...form, phone: v })}
      />

      {/* Map Picker */}
      <div className="relative">
        <InputCardField
          label="Address *"
          placeholder="Select your location"
          readOnly
          value={form.address}
          onChange={(v) => setForm({ ...form, address: v })}
        />
        <button
          type="button"
          onClick={() => setShowMap(true)}
          className="absolute right-3 top-8 text-yellow-600 text-sm underline"
        >
          Pick on Map
        </button>
      </div>

      {/* Error & Success */}
      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
      {success && <p className="text-green-600 text-sm mt-1">{success}</p>}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-yellow-400 text-black font-bold py-3 rounded-xl mt-3 shadow"
      >
        {loading ? "Submitting..." : "Sign Up as Customer"}
      </button>

      {/* Map Modal */}
      {showMap && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-4 w-[90%] max-w-lg">
            <h3 className="font-semibold text-gray-800 mb-2">
              Select Your Location
            </h3>
            <MapPicker
              onSelect={(addr, lat, lng) => {
                setForm({ ...form, address: addr });
                setCoordinates({ lat, lng });
              }}
              initialAddress={form.address}
            />
            <div className="flex justify-end mt-3">
              <button
                type="button"
                onClick={() => setShowMap(false)}
                className="bg-yellow-500 px-4 py-2 rounded text-black font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
