"use client";

import { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import Link from "next/link";
import axios from "axios";
import VendorHeader from "../dashboard/components/VendorHeader";

export default function VendorMessagesPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendor, setVendor] = useState<any>(null);

  // ✅ Fetch conversations from Laravel API
  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("⚠️ No token found. Please login again.");
        setLoading(false);
        return;
      }

      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/conversations`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // ✅ Format results (safeguarded)
      const data = (res.data || []).map((msg: any) => ({
        id: msg.id,
        name: msg.name || "Unknown User",
        avatar: msg.avatar || "/avatars/default.png",
        lastMessage: msg.lastMessage || "",
        time: msg.time
          ? new Date(msg.time).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "",
        unread: msg.unread > 0,
      }));

      setMessages(data);
    } catch (err) {
      console.error("❌ Error fetching messages:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Load vendor info and start polling
  useEffect(() => {
    const storedVendor = localStorage.getItem("vendor");
    if (storedVendor) {
      setVendor(JSON.parse(storedVendor));
    }

    fetchMessages();

    const interval = setInterval(fetchMessages, 30000); // auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  // =======================
  // 💬 UI: Loading State
  // =======================
  if (loading)
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Loading messages...
      </div>
    );

  // =======================
  // 💬 UI: Empty State
  // =======================
  if (messages.length === 0)
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <VendorHeader vendor={vendor} />
        <div className="flex flex-col items-center justify-center h-[70vh] text-gray-600">
          <div className="w-28 h-28 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
            <MessageCircle className="w-12 h-12 text-blue-500" />
          </div>
          <h3 className="font-semibold text-lg">No messages yet</h3>
          <p className="text-sm text-gray-500">
            Start a chat with a customer or check later.
          </p>
        </div>
      </div>
    );

  // =======================
  // 💬 UI: Messages List
  // =======================
  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      {/* ✅ Global Vendor Header */}
      <VendorHeader vendor={vendor} />

      {/* ✅ Messages List */}
      <div className="divide-y bg-white mt-2">
        {messages.map((m) => (
          <Link
            key={m.id}
            href={`/vendor/messages/chat?userId=${m.id}&userName=${encodeURIComponent(
              m.name
            )}&avatar=${encodeURIComponent(m.avatar || "")}`}
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition relative"
          >
            <img
              src={m.avatar}
              alt={m.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm text-gray-800">{m.name}</h4>
              <p className="text-xs text-gray-500 truncate">{m.lastMessage}</p>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs text-gray-400">{m.time}</span>
              {m.unread && (
                <span className="w-2.5 h-2.5 bg-blue-500 rounded-full mt-1"></span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
