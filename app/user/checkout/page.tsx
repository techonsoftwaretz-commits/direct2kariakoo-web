"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle } from "lucide-react";
import Header from "@/app/user/components/Header";

export default function CheckoutPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"mobile" | "card" | "manual">("mobile");
  const [phone, setPhone] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [name, setName] = useState("");
  const [saveCard, setSaveCard] = useState(false);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [vendorGroups, setVendorGroups] = useState<any[]>([]);
  const [isDesktop, setIsDesktop] = useState(false);

  const [networks] = useState(["M-Pesa", "Airtel Money", "Tigo Pesa", "HaloPesa"]);
  const [selectedNetwork, setSelectedNetwork] = useState("M-Pesa");

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
  const businessName = "Direct2Kariakoo";

  // ✅ Responsive detection
  useEffect(() => {
    const updateLayout = () => setIsDesktop(window.innerWidth >= 1024);
    updateLayout();
    window.addEventListener("resize", updateLayout);
    return () => window.removeEventListener("resize", updateLayout);
  }, []);

  // ✅ Fetch cart
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return router.push("/user/login");

    const fetchCart = async () => {
      try {
        const res = await axios.get(`${apiBaseUrl}/cart`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const items = res.data.items || [];
        setCartItems(items);
        const totalAmount = items.reduce(
          (sum: number, it: any) => sum + it.product.new_price * it.quantity,
          0
        );
        setTotal(totalAmount);
      } catch (err) {
        console.error("❌ Failed to load cart:", err);
      }
    };

    fetchCart();
  }, [apiBaseUrl, router]);

  // ✅ Fetch vendor groups for Manual Payment tab
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (tab !== "manual" || !cartItems.length) return;

    const fetchVendors = async () => {
      try {
        const itemsPayload = cartItems.map((item) => ({
          product_id: item.product_id || item.product?.id,
          quantity: item.quantity,
        }));

        const res = await axios.post(
          `${apiBaseUrl}/checkout/vendors`, // ✅ correct route
          { items: itemsPayload },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.data.vendors) {
          setVendorGroups(res.data.vendors);
        } else {
          setVendorGroups([]);
        }
      } catch (err: any) {
        console.error("❌ Failed to fetch vendor groups:", err.response?.data || err.message);
        setVendorGroups([]);
      }
    };

    fetchVendors();
  }, [tab, cartItems, apiBaseUrl]);

  // ✅ Card formatting
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "").substring(0, 16);
    const groups = value.match(/.{1,4}/g);
    setCardNumber(groups ? groups.join(" ") : value);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 4) value = value.substring(0, 4);
    if (value.length >= 3) value = `${value.substring(0, 2)}/${value.substring(2, 4)}`;
    setExpiry(value);
  };

  // ✅ Payment logic
  const handlePayment = async (isManualConfirm = false) => {
    const token = localStorage.getItem("token");
    if (!token) return router.push("/user/login");

    try {
      setLoading(true);
      const itemsPayload = cartItems.map((item) => ({
        product_id: item.product_id || item.product?.id,
        quantity: item.quantity,
      }));

      if (!itemsPayload.length) return alert("Cart is empty.");

      // --- MOBILE MONEY ---
      if (tab === "mobile") {
        if (!phone.trim()) return alert("Enter your mobile number");

        await axios.post(
          `${apiBaseUrl}/checkout`,
          { phone, provider: selectedNetwork, items: itemsPayload },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        alert("Payment initiated! Confirm on your mobile device.");
        clearCartAndGo();
      }

      // --- CARD PAYMENT ---
      else if (tab === "card") {
        if (!cardNumber || !expiry || !cvv || !name)
          return alert("Please fill all card details");

        await axios.post(
          `${apiBaseUrl}/checkout/card`,
          {
            card_number: cardNumber.replace(/\s/g, ""),
            expiry,
            cvv,
            name,
            save_card: saveCard,
            items: itemsPayload,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        alert("Card payment successful!");
        clearCartAndGo();
      }

      // --- MANUAL PAYMENT ---
      else if (tab === "manual" && isManualConfirm) {
        await axios.post(
          `${apiBaseUrl}/checkout/confirm-manual`,
          { total, reference: "ManualConfirm", items: itemsPayload },
          { headers: { Authorization: `Bearer ${token}` } }
        );      

        alert("Manual payment confirmed. Orders placed successfully!");
        clearCartAndGo();
      }
    } catch (err: any) {
      console.error("❌ Payment Error:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const clearCartAndGo = async () => {
    const token = localStorage.getItem("token");
    try {
      await axios.post(`${apiBaseUrl}/cart/clear`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}
    localStorage.removeItem("cart_items");
    localStorage.removeItem("checkout_total");
    window.dispatchEvent(new Event("cart-updated"));
    window.dispatchEvent(new Event("orders-updated"));
    router.push("/user/orders");
  };

  const handleBack = () => {
    if (window.history.length > 1) router.back();
    else router.push("/user/cart");
  };

  // ✅ Render
  return (
    <div className="bg-gray-50 min-h-screen">
      {isDesktop && <Header onCategorySelect={() => {}} onSubcategorySelect={() => {}} />}

      {!isDesktop && (
        <div className="sticky top-0 z-50 bg-white border-b border-gray-200 flex items-center justify-between px-4 py-3 shadow-sm">
          <button
            onClick={handleBack}
            className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition"
          >
            <ArrowLeft size={22} className="text-yellow-500" />
          </button>
          <h1 className="text-[15px] font-semibold text-gray-800">Checkout</h1>
          <div className="w-8" />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-10 flex flex-col lg:flex-row gap-8">
        {/* LEFT */}
        <div className="flex-1 space-y-8">
          {/* Address */}
          <section className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-gray-800">Delivery Address</h3>
              <button className="text-yellow-600 text-sm font-medium hover:underline">
                + Add new address
              </button>
            </div>
            <p className="text-sm text-gray-600">
              Use your default address or add a new one.
            </p>
          </section>

          {/* Payment Methods */}
          <section className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Methods</h3>

            {/* Tabs */}
            <div className="flex gap-4 mb-6">
              {["mobile", "card", "manual"].map((key) => (
                <button
                  key={key}
                  onClick={() => setTab(key as any)}
                  className={`flex-1 border rounded-lg py-2 text-sm font-medium transition ${
                    tab === key
                      ? "border-yellow-400 bg-yellow-50 text-yellow-700"
                      : "border-gray-200 text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {key === "mobile" ? "Mobile Money" : key === "card" ? "Card" : "Manual Payment"}
                </button>
              ))}
            </div>

            {/* --- MOBILE --- */}
            {tab === "mobile" && (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Select Network
                </label>
                <div className="flex gap-2 flex-wrap mb-3">
                  {networks.map((net) => (
                    <button
                      key={net}
                      onClick={() => setSelectedNetwork(net)}
                      className={`px-4 py-2 rounded-lg border text-sm transition ${
                        selectedNetwork === net
                          ? "bg-yellow-400 border-yellow-400 text-black font-medium"
                          : "bg-gray-100 border-gray-200 text-gray-700"
                      }`}
                    >
                      {net}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="07XXXXXXXX"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
            )}

            {/* --- CARD --- */}
            {tab === "card" && (
              <div className="space-y-4">
                <input
                  type="text"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-yellow-400 tracking-widest"
                />
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={expiry}
                    onChange={handleExpiryChange}
                    placeholder="MM/YY"
                    maxLength={5}
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-yellow-400"
                  />
                  <input
                    type="password"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    placeholder="CVV"
                    maxLength={4}
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Card Holder Name"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-yellow-400"
                />
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={saveCard}
                    onChange={(e) => setSaveCard(e.target.checked)}
                    className="mr-2 accent-yellow-400"
                  />
                  <span className="text-sm text-gray-700">Save card for future</span>
                </div>
              </div>
            )}

            {/* --- MANUAL PAYMENT --- */}
            {tab === "manual" && (
              <div className="space-y-6 text-gray-700">
                {vendorGroups.length === 0 && (
                  <p className="text-sm text-gray-500">Fetching vendor details...</p>
                )}

                {vendorGroups.map((group) => (
                  <div
                    key={group.vendor.id}
                    className="border border-gray-200 rounded-xl p-4 bg-gray-50"
                  >
                    <h4 className="font-semibold text-gray-800 mb-2">
                      Vendor: {group.vendor.name}
                    </h4>

                    <ul className="text-sm text-gray-700 space-y-1 mb-3">
                      {group.items.map((it: any) => (
                        <li key={it.id} className="flex justify-between">
                          <span>
                            {it.name} × {it.quantity}
                          </span>
                          <span className="text-yellow-600">
                            TZS {(it.price * it.quantity).toLocaleString()}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className="text-sm font-medium text-gray-800 mb-2">
                      Total:{" "}
                      <span className="text-yellow-600">
                        TZS {group.total.toLocaleString()}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 mb-1">Payment Options:</p>
                    <ul className="text-xs text-gray-700">
                      {group.vendor.payment_options.length ? (
                        group.vendor.payment_options.map((opt: any) => (
                          <li key={opt.id}>
                            {opt.method}: <b>{opt.account}</b>
                          </li>
                        ))
                      ) : (
                        <li className="text-gray-400">No payment methods added</li>
                      )}
                    </ul>
                  </div>
                ))}

                <button
                  onClick={() => handlePayment(true)}
                  disabled={loading}
                  className={`w-full mt-2 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition ${
                    loading
                      ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                      : "bg-yellow-400 hover:bg-yellow-300 text-black"
                  }`}
                >
                  <CheckCircle size={18} />
                  {loading ? "Processing..." : "I Have Paid – Place Order"}
                </button>
              </div>
            )}
          </section>
        </div>

        {/* RIGHT */}
        <aside className="lg:w-[30%]">
          <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Summary</h3>
            <div className="flex justify-between text-sm mb-2">
              <span>Subtotal</span>
              <span className="font-medium">TZS {total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span>Delivery fee</span>
              <span className="font-medium text-green-600">-</span>
            </div>
            <div className="flex justify-between text-base font-semibold border-t border-gray-200 pt-3 mt-2">
              <span>Total</span>
              <span className="text-yellow-600 font-bold">TZS {total.toLocaleString()}</span>
            </div>

            {tab !== "manual" && (
              <button
                onClick={() => handlePayment()}
                disabled={loading}
                className={`w-full mt-6 py-3 rounded-lg font-semibold transition ${
                  loading
                    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                    : "bg-yellow-400 hover:bg-yellow-300 text-black"
                }`}
              >
                {loading ? "Processing..." : "Place Order"}
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
