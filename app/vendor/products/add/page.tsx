"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Image from "next/image";
import { Loader2, Upload, X } from "lucide-react";

export default function AddProductPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [attributes, setAttributes] = useState<any[]>([]);
  const [attributeValues, setAttributeValues] = useState<{ [key: string]: string }>({});
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [form, setForm] = useState({
    name: "",
    new_price: "",
    old_price: "",
    description: "",
    stock: "",
    category_id: "",
    subcategory_id: "",
  });

  // ---------------- FETCH CATEGORIES ----------------
  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true);
        const res = await api.get("/categories");
        const result = res.data || [];
        setCategories(result);

        // Default select first category if available
        if (result.length > 0) {
          const first = result[0];
          setForm((prev) => ({ ...prev, category_id: first.id.toString() }));
          await fetchSubcategories(first.id.toString());
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, []);

  // ---------------- FETCH SUBCATEGORIES + ATTRIBUTES ----------------
  async function fetchSubcategories(categoryId: string) {
    try {
      const subRes = await api.get(`/categories/${categoryId}/subcategories`);
      const subData = subRes.data || [];
      setSubcategories(subData);

      if (subData.length > 0) {
        setForm((prev) => ({ ...prev, subcategory_id: subData[0].id.toString() }));
      }

      // ✅ Fetch category + global attributes
      const catRes = await api.get(`/categories/${categoryId}`);
      const attrs = catRes.data?.attributes || [];
      setAttributes(attrs);
    } catch (err) {
      console.error("Error fetching subcategories or attributes:", err);
      setAttributes([]);
    }
  }

  // ---------------- HANDLE CHANGE ----------------
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleAttributeChange(attrId: string, value: string) {
    setAttributeValues((prev) => ({ ...prev, [attrId]: value }));
  }

  // ---------------- IMAGE HANDLING ----------------
  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length) {
      const previews = files.map((f) => URL.createObjectURL(f));
      setImages((prev) => [...prev, ...files]);
      setPreviewUrls((prev) => [...prev, ...previews]);
    }
  }

  function removeImage(i: number) {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
    setPreviewUrls((prev) => prev.filter((_, idx) => idx !== i));
  }

  // ---------------- SUBMIT PRODUCT ----------------
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      Object.entries(attributeValues).forEach(([k, v]) =>
        formData.append(`attributes[${k}]`, v)
      );
      images.forEach((img) => formData.append("images[]", img));

      const res = await api.post("/products", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage({ type: "success", text: res.data?.message || "Product added successfully!" });
      setTimeout(() => router.push("/vendor/dashboard"), 1500);
    } catch (err: any) {
      console.error("Submit error:", err);
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to add product.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  // ---------------- UI ----------------
  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      {/* HEADER */}
      <header className="bg-white shadow-sm px-5 py-4 flex justify-between items-center sticky top-0 z-30">
        <h1 className="font-semibold text-gray-800 text-lg">Add Product</h1>
        <button onClick={() => router.back()} className="text-sm text-teal-600 hover:underline">
          Cancel
        </button>
      </header>

      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto mt-6 p-4 sm:p-0 space-y-6">
        {message && (
          <div
            className={`p-3 text-sm rounded-lg ${
              message.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-600 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* BASIC INFO */}
        <section className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Basic Info</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-1 font-medium">Product Name</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter product name"
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-1 font-medium">New Price (TZS)</label>
                <input
                  name="new_price"
                  type="number"
                  value={form.new_price}
                  onChange={handleChange}
                  required
                  placeholder="Enter new price"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1 font-medium">Old Price (Optional)</label>
                <input
                  name="old_price"
                  type="number"
                  value={form.old_price}
                  onChange={handleChange}
                  placeholder="Enter old price"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-1 font-medium">Stock Quantity</label>
              <input
                name="stock"
                type="number"
                value={form.stock}
                onChange={handleChange}
                required
                placeholder="Available stock quantity"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-1 font-medium">Description</label>
              <textarea
                name="description"
                rows={4}
                value={form.description}
                onChange={handleChange}
                placeholder="Write short product description..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-teal-500 outline-none"
              ></textarea>
            </div>
          </div>
        </section>

        {/* CATEGORY & SUBCATEGORY */}
        <section className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Category & Subcategory</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-1 font-medium">Category</label>
              <select
                name="category_id"
                value={form.category_id}
                onChange={(e) => {
                  handleChange(e);
                  fetchSubcategories(e.target.value);
                }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-teal-500 outline-none"
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-1 font-medium">Subcategory</label>
              <select
                name="subcategory_id"
                value={form.subcategory_id}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-teal-500 outline-none"
              >
                <option value="">Select subcategory</option>
                {subcategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* ATTRIBUTES */}
        {attributes.length > 0 && (
          <section className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Attributes</h2>
            <div className="space-y-4">
              {attributes.map((attr) => (
                <div key={attr.id}>
                  <label className="block text-gray-700 mb-1 font-medium">{attr.name}</label>
                  <input
                    type="text"
                    value={attributeValues[attr.id] || ""}
                    onChange={(e) => handleAttributeChange(attr.id, e.target.value)}
                    placeholder={`Enter ${attr.name}`}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* IMAGES */}
        <section className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Product Images</h2>
          <div className="flex flex-wrap gap-3 mb-5">
            {previewUrls.map((url, i) => (
              <div key={i} className="relative w-24 h-24">
                <Image
                  src={url}
                  alt="Preview"
                  fill
                  className="object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-0 right-0 bg-black/70 text-white p-1 rounded-full"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <label className="w-24 h-24 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:border-teal-500 cursor-pointer bg-gray-50">
              <Upload className="w-5 h-5 text-gray-500" />
              <span className="text-xs mt-1 text-gray-500">Upload</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageChange}
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-3 rounded-lg shadow transition disabled:opacity-60"
          >
            {submitting ? (
              <div className="flex justify-center items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Adding Product...
              </div>
            ) : (
              "Submit Product"
            )}
          </button>
        </section>
      </form>
    </main>
  );
}
