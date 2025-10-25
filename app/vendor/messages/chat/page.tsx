"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import { ArrowLeft, SendHorizontal } from "lucide-react";

/* ---------------------------- Inner Chat Component --------------------------- */
function VendorChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const userId = searchParams.get("userId"); // Receiver (customer)
  const userName = searchParams.get("userName") || "Customer";
  const avatar = searchParams.get("avatar");

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [vendorId, setVendorId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  /* ---------------------- Load vendor ID from /me endpoint ---------------------- */
  useEffect(() => {
    const fetchVendor = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const id =
          res.data?.vendor?.id || res.data?.id || res.data?.vendor_id || null;
        if (id) {
          setVendorId(id);
          localStorage.setItem("userId", id.toString());
        }
      } catch (err) {
        console.error("❌ Error loading vendor info:", err);
      }
    };
    fetchVendor();
  }, []);

  /* ----------------------------- Fetch Messages ----------------------------- */
  const fetchMessages = async () => {
    if (!userId) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/messages/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessages(res.data || []);

      // ✅ Mark as read
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/messages/read/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("❌ Error fetching chat:", err);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  /* ------------------------------ Send Message ------------------------------ */
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/messages`,
        { receiver_id: userId, message: newMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessages((prev) => [...prev, res.data.message]);
      setNewMessage("");
      scrollToBottom();
    } catch (err) {
      console.error("❌ Error sending message:", err);
    }
  };

  /* ------------------------- Poll messages every 5s -------------------------- */
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(scrollToBottom, [messages]);

  /* ---------------------------- Loading Indicator ---------------------------- */
  if (loading)
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Loading chat...
      </div>
    );

  /* ------------------------------- Chat Layout ------------------------------- */
  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* HEADER */}
      <div className="flex items-center px-4 py-3 bg-white border-b shadow-sm sticky top-0 z-10">
        <button
          onClick={() => router.push("/vendor/messages")}
          className="p-2 hover:bg-gray-100 rounded-full transition"
        >
          <ArrowLeft size={22} className="text-gray-700" />
        </button>
        <div className="ml-3 flex items-center gap-2">
          {avatar && (
            <img
              src={decodeURIComponent(avatar)}
              alt={userName}
              className="w-8 h-8 rounded-full object-cover border border-gray-200"
            />
          )}
          <div>
            <h3 className="font-semibold text-gray-800 text-sm">{userName}</h3>
            <p className="text-xs text-gray-500">Online</p>
          </div>
        </div>
      </div>

      {/* CHAT BODY */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {messages.length === 0 && (
          <p className="text-center text-gray-400 mt-10 text-sm">
            No messages yet. Start chatting!
          </p>
        )}

        {messages.map((msg) => {
          const isSender =
            vendorId && Number(msg.sender_id) === Number(vendorId);

          return (
            <div
              key={msg.id}
              className={`flex w-full ${
                isSender ? "justify-end" : "justify-start"
              }`}
            >
              {/* RECEIVED (Left) */}
              {!isSender && (
                <div className="flex items-end gap-2 max-w-[80%]">
                  <img
                    src={
                      decodeURIComponent(avatar || "/avatars/default.png") ||
                      "/avatars/default.png"
                    }
                    alt="User"
                    className="w-8 h-8 rounded-full object-cover border border-gray-200"
                  />
                  <div className="bg-white border border-gray-100 shadow-sm text-gray-800 px-4 py-2 rounded-2xl rounded-bl-none text-sm">
                    <p className="leading-relaxed break-words">{msg.text}</p>
                    <span className="text-[10px] text-gray-400 mt-1 block text-right">
                      {new Date(msg.time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              )}

              {/* SENT (Right) */}
              {isSender && (
                <div className="flex items-end gap-2 max-w-[80%] justify-end">
                  <div className="bg-teal-600 text-white shadow-md px-4 py-2 rounded-2xl rounded-br-none text-sm">
                    <p className="leading-relaxed break-words">{msg.text}</p>
                    <span className="text-[10px] text-teal-100 mt-1 block text-right">
                      {new Date(msg.time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <img
                    src="/avatars/vendor.png"
                    alt="You"
                    className="w-8 h-8 rounded-full object-cover border border-gray-200"
                  />
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef}></div>
      </div>

      {/* INPUT AREA */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-3 shadow-inner">
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none bg-gray-50"
        />
        <button
          onClick={sendMessage}
          className="bg-teal-600 text-white rounded-full p-2 hover:bg-teal-700 active:scale-95 transition"
        >
          <SendHorizontal size={18} />
        </button>
      </div>
    </div>
  );
}

/* ------------------------- Wrap with Suspense boundary ------------------------ */
export default function VendorChatPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-500">Loading chat...</div>}>
      <VendorChatContent />
    </Suspense>
  );
}
