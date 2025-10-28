"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle } from "lucide-react";
import Header from "@/app/user/components/Header";

export default function CheckoutPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"mobile" | "card" | "lipa">("mobile");
  const [phone, setPhone] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [name, setName] = useState("");
  const [saveCard, setSaveCard] = useState(false);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [isDesktop, setIsDesktop] = useState(false);

  const [networks] = useState(["M-Pesa", "Airtel Money", "Tigo Pesa", "HaloPesa"]);
  const [selectedNetwork, setSelectedNetwork] = useState("M-Pesa");

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
  const lipaNamba = "555999";
  const businessName = "Direct2Kariakoo";

  /* ✅ Responsive layout detection */
  useEffect(() => {
    const updateLayout = () => setIsDesktop(window.innerWidth >= 1024);
    updateLayout();
    window.addEventListener("resize", updateLayout);
    return () => window.removeEventListener("resize", updateLayout);
  }, []);

  /* ✅ Fetch total and cart items */
  useEffect(() => {
    const checkoutTotal = localStorage.getItem("checkout_total");
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
        console.error("❌ Failed to fetch cart total:", err);
      }
    };

    const buyNow = new URLSearchParams(window.location.search).get("buyNow");

    if (buyNow === "true") {
      // ✅ Handle "Buy Now" single-product checkout
      const storedItems = localStorage.getItem("checkout_items");
      if (storedItems) {
        try {
          const parsed = JSON.parse(storedItems);
          setCartItems(parsed);
          const storedTotal = localStorage.getItem("checkout_total");
          setTotal(storedTotal ? parseFloat(storedTotal) : 0);
        } catch (e) {
          console.error("Failed to parse checkout_items:", e);
        }
      }
    } else if (checkoutTotal) {
      setTotal(Number(checkoutTotal));
    } else {
      fetchCart();
    }
    
  }, []);

  /* ✅ Format Card Number */
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    value = value.substring(0, 16);
    const groups = value.match(/.{1,4}/g);
    setCardNumber(groups ? groups.join(" ") : value);
  };

  /* ✅ Format Expiry */
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 4) value = value.substring(0, 4);
    if (value.length >= 3) value = `${value.substring(0, 2)}/${value.substring(2, 4)}`;
    setExpiry(value);
  };

  /* ✅ Main Payment Logic */
  const handlePayment = async (isLipaConfirm = false) => {
    const token = localStorage.getItem("token");
    if (!token) return router.push("/user/login");
  
    try {
      setLoading(true);
  
      // ✅ Get items to pay for
      let itemsPayload = cartItems.map((item) => ({
        product_id: item.product_id || item.product?.id,
        quantity: item.quantity,
      }));
  
      if (!itemsPayload.length) {
        const savedCart = localStorage.getItem("cart_items");
        if (savedCart) {
          const parsed = JSON.parse(savedCart);
          itemsPayload = parsed.map((it: any) => ({
            product_id: it.product_id || it.product?.id,
            quantity: it.quantity,
          }));
        }
      }
  
      if (!itemsPayload.length) {
        alert("Cart is empty — please add items first.");
        return;
      }
  
      // ✅ Payment methods
      if (tab === "mobile") {
        if (!phone.trim()) return alert("Please enter your mobile number");
  
        await axios.post(
          `${apiBaseUrl}/checkout`,
          { phone, provider: selectedNetwork, items: itemsPayload },
          { headers: { Authorization: `Bearer ${token}` } }
        );
  
        // ✅ Clear backend cart
        await axios.delete(`${apiBaseUrl}/cart/clear`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
  
        // ✅ Clear local storage cart
        localStorage.removeItem("cart_items");
        localStorage.removeItem("checkout_total");
        window.dispatchEvent(new Event("cart-updated"));
        window.dispatchEvent(new Event("orders-updated"));
  
        alert("Payment initiated! Confirm on your mobile device.");
        router.push("/user/orders");
      }
  
      else if (tab === "card") {
        if (!cardNumber || !expiry || !cvv || !name)
          return alert("Please fill in all card details");
  
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
  
        // ✅ Clear backend + local cart
        await axios.delete(`${apiBaseUrl}/cart/clear`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
        localStorage.removeItem("cart_items");
        localStorage.removeItem("checkout_total");
        window.dispatchEvent(new Event("cart-updated"));
        window.dispatchEvent(new Event("orders-updated"));
  
        alert("Card payment successful!");
        router.push("/user/orders");
      }
  
      else if (tab === "lipa" && isLipaConfirm) {
        await axios.post(
          `${apiBaseUrl}/checkout/confirm-lipa`,
          { total, reference: "LipaNambaManualConfirm", items: itemsPayload },
          { headers: { Authorization: `Bearer ${token}` } }
        );
  
        await axios.delete(`${apiBaseUrl}/cart/clear`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
        localStorage.removeItem("cart_items");
        localStorage.removeItem("checkout_total");
        window.dispatchEvent(new Event("cart-updated"));
        window.dispatchEvent(new Event("orders-updated"));
  
        alert("Payment confirmed! Your order has been placed successfully.");
        router.push("/user/orders");
      }
    } catch (err: any) {
      console.error("❌ Payment Error:", err.response?.data || err.message);
      alert(
        err.response?.data?.message || "Payment failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };
  
  /* ✅ Handle Back Arrow */
  const handleBack = () => {
    if (window.history.length > 1) router.back();
    else router.push("/user/cart");
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* ✅ Desktop Header */}
      {isDesktop && (
        <Header onCategorySelect={() => {}} onSubcategorySelect={() => {}} />
      )}

      {/* ✅ Mobile Top Bar with Back Arrow */}
      {!isDesktop && (
        <div className="sticky top-0 z-50 bg-white border-b border-gray-200 flex items-center justify-between px-4 py-3 shadow-sm">
          <button
            onClick={handleBack}
            className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition"
          >
            <ArrowLeft size={22} className="text-yellow-500" />
          </button>
          <h1 className="text-[15px] font-semibold text-gray-800">Checkout</h1>
          <div className="w-8" /> {/* spacer */}
        </div>
      )}

      {/* ✅ Checkout Layout */}
      <div className="max-w-7xl mx-auto px-4 py-10 flex flex-col lg:flex-row gap-8">
        {/* LEFT COLUMN */}
        <div className="flex-1 space-y-8">
          {/* Delivery Address */}
          <section className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-gray-800">Delivery Address</h3>
              <button className="text-yellow-600 text-sm font-medium hover:underline">
                + Add new address
              </button>
            </div>
            <p className="text-sm text-gray-600">
              Use your default account address or add a new one.
            </p>
          </section>

          {/* Payment Methods */}
          <section className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Methods</h3>

            {/* Tabs */}
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setTab("mobile")}
                className={`flex-1 border rounded-lg py-2 text-sm font-medium transition ${
                  tab === "mobile"
                    ? "border-yellow-400 bg-yellow-50 text-yellow-700"
                    : "border-gray-200 text-gray-700 hover:border-gray-300"
                }`}
              >
                Mobile Money
              </button>
              <button
                onClick={() => setTab("card")}
                className={`flex-1 border rounded-lg py-2 text-sm font-medium transition ${
                  tab === "card"
                    ? "border-yellow-400 bg-yellow-50 text-yellow-700"
                    : "border-gray-200 text-gray-700 hover:border-gray-300"
                }`}
              >
                Card
              </button>
              <button
                onClick={() => setTab("lipa")}
                className={`flex-1 border rounded-lg py-2 text-sm font-medium transition ${
                  tab === "lipa"
                    ? "border-yellow-400 bg-yellow-50 text-yellow-700"
                    : "border-gray-200 text-gray-700 hover:border-gray-300"
                }`}
              >
                Lipa Namba
              </button>
            </div>

            {/* ✅ MOBILE MONEY */}
            {tab === "mobile" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Select Network
                  </label>
                  <div className="flex gap-2 flex-wrap">
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
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Mobile Money Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="07XXXXXXXX"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
              </div>
            )}

            {/* ✅ CARD PAYMENT */}
            {tab === "card" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 tracking-widest"
                  />
                </div>

                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Expiry (MM/YY)
                    </label>
                    <input
                      type="text"
                      value={expiry}
                      onChange={handleExpiryChange}
                      placeholder="MM/YY"
                      maxLength={5}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      CVV
                    </label>
                    <input
                      type="password"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      placeholder="***"
                      maxLength={4}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Card Holder Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>

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

            {/* ✅ LIPA NAMBA */}
            {tab === "lipa" && (
              <div className="space-y-6 text-gray-700">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-center">
                  <p className="text-sm">Business Name:</p>
                  <p className="text-lg font-bold text-yellow-600">{businessName}</p>
                  <p className="mt-2 text-sm">Lipa Namba:</p>
                  <p className="text-2xl font-bold text-gray-900">{lipaNamba}</p>
                </div>

                <div>
                  <p className="font-semibold mb-2 text-sm">How to Pay via USSD:</p>
                  <ul className="list-disc pl-5 text-xs space-y-2">
                    <li>
                      <b>M-Pesa:</b> Dial *150*00# → Lipa kwa M-Pesa → Lipa Namba → Enter {lipaNamba}
                    </li>
                    <li>
                      <b>Tigo Pesa:</b> Dial *150*01# → Lipa Kwa Simu → Ingiza Lipa Namba → Enter {lipaNamba}
                    </li>
                    <li>
                      <b>Airtel Money:</b> Dial *150*60# → Lipa kwa Airtel Money → Enter {lipaNamba}
                    </li>
                    <li>
                      <b>HaloPesa:</b> Dial *150*88# → Lipa kwa HaloPesa → Enter {lipaNamba}
                    </li>
                  </ul>
                </div>

                <p className="text-xs text-gray-500 text-center">
                  After payment, confirm via WhatsApp or call <b>+255 700 000 000</b>
                </p>

                {/* ✅ Confirm Payment Button */}
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

        {/* ✅ RIGHT COLUMN - Summary */}
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

            {tab !== "lipa" && (
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
