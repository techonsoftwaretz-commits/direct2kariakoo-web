"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation"; // ✅ correct import
import axios from "axios";
import Image from "next/image";
import {
  Search,
  ShoppingCart,
  User,
  ChevronDown,
  X,
  Menu,
  ChevronRight,
  ArrowLeft,
  MessageSquare,
  Package,
} from "lucide-react";
import ProductCard from "./ProductCard";
const CACHE_EXPIRY_MS = 12 * 60 * 60 * 1000; // 12 hours cache expiry

interface Subcategory {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  image: string;
  price: number;
  oldPrice?: number;
  rating?: number;
  reviews?: number;
  attributes?: string[];
}

interface Category {
  id: number;
  name: string;
  icon?: string | null;
  subcategories?: Subcategory[];
}

export default function Header({
  onCategorySelect,
  onSubcategorySelect,
}: {
  onCategorySelect: (cat: Category) => void;
  onSubcategorySelect: (subcategoryId: number) => void;
}) {
  const router = useRouter(); 
  const [showCategories, setShowCategories] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  // 🔍 Product search states
const [searchQuery, setSearchQuery] = useState("");
const [searchResults, setSearchResults] = useState<Product[]>([]);
const [searchLoading, setSearchLoading] = useState(false);
const [showResults, setShowResults] = useState(false);
let searchTimeout: NodeJS.Timeout;

// 🔍 Handle typing
const handleSearchChange = (value: string) => {
  setSearchQuery(value);
  clearTimeout(searchTimeout);

  if (value.length < 2) {
    setSearchResults([]);
    setShowResults(false);
    return;
  }

  // ⏳ debounce search
  searchTimeout = setTimeout(() => {
    fetchSearchResults(value);
  }, 400);
};

// 🔍 Fetch products from backend
const fetchSearchResults = async (query: string) => {
  setSearchLoading(true);
  try {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/products/search?q=${encodeURIComponent(query)}`
    );
    const data = Array.isArray(res.data.products) ? res.data.products : [];
    const formatted = data.map((p: any) => ({
      id: p.id,
      name: p.name,
      image: p.images?.[0] || "/placeholder.png",
      price: p.new_price || p.price,
    }));
    setSearchResults(formatted);
    setShowResults(true);
  } catch (err) {
    console.error("❌ Error fetching search results:", err);
  } finally {
    setSearchLoading(false);
  }
};

// 🔍 When pressing Enter or clicking search icon
const handleSearchSubmit = () => {
  if (!searchQuery.trim()) return;
  router.push(`/user/search?q=${encodeURIComponent(searchQuery)}`);
  setShowResults(false);
};

  // 🔹 Fetch categories and subcategories
  useEffect(() => {
    const fetchData = async () => {
      try {
        const cached = localStorage.getItem("d2k_categories_cache");
        const cachedTime = localStorage.getItem("d2k_categories_cache_time");
        const now = Date.now();
  
        // ✅ 1. Load cached data instantly if available and recent
        if (cached && cachedTime && now - parseInt(cachedTime) < CACHE_EXPIRY_MS) {
          const parsed = JSON.parse(cached);
          setCategories(parsed);
          if (parsed.length > 0) {
            const first = parsed[0];
            setActiveCategory(first);
            fetchCategoryProducts(first);
          }
          setLoading(false);
        }
  
        // ✅ 2. Fetch fresh data from server in background
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/categories`);
        const data = Array.isArray(res.data) ? res.data : [];
  
        const categoriesWithSubs = await Promise.all(
          data.map(async (cat: Category) => {
            try {
              const subRes = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/categories/${cat.id}/subcategories`
              );
              return { ...cat, subcategories: subRes.data || [] };
            } catch {
              return { ...cat, subcategories: [] };
            }
          })
        );
  
        setCategories(categoriesWithSubs);
        localStorage.setItem("d2k_categories_cache", JSON.stringify(categoriesWithSubs));
        localStorage.setItem("d2k_categories_cache_time", now.toString());
  
        if (categoriesWithSubs.length > 0) {
          const first = categoriesWithSubs[0];
          setActiveCategory(first);
          fetchCategoryProducts(first);
        }
      } catch (err) {
        console.error("❌ Error loading categories:", err);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, []);  

  const [cartCount, setCartCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  // 🔹 Fetch unread message count
  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId"); // ✅ Make sure you save this during login

      if (!token || !userId) return;

      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/messages/count-unread-messages/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // ✅ The backend should return { count: number }
      setUnreadCount(res.data.count || 0);
      localStorage.setItem("d2k_unread_count", (res.data.count || 0).toString());
    } catch (err) {
      console.error("❌ Error fetching unread messages:", err);
      setUnreadCount(0);
    }
  };

  // 🔹 Fetch cart count
  const fetchCartCount = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const count = res.data.items?.length || 0;
      setCartCount(count);
      localStorage.setItem("d2k_cart_count", count.toString());
    } catch {
      setCartCount(0);
    }
  };

  // 🔹 Fetch order count (only non-completed orders)
  const fetchOrderCount = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const orders = res.data.orders || res.data || [];

      // ✅ Only count orders that are not completed or failed
      const activeOrders = orders.filter(
        (o: any) =>
          o.status !== "completed" &&
          o.status !== "failed" &&
          o.status !== "refunded"
      );

      setOrderCount(activeOrders.length);
      localStorage.setItem("d2k_order_count", activeOrders.length.toString());
    } catch (err) {
      console.error("❌ Error fetching orders:", err);
      setOrderCount(0);
    }
  };

  // 🔹 Load cart count when page mounts
  useEffect(() => {
    // ✅ Load cached counts instantly
    const cachedCart = localStorage.getItem("d2k_cart_count");
    const cachedOrders = localStorage.getItem("d2k_order_count");
    const cachedUnread = localStorage.getItem("d2k_unread_count");
  
    if (cachedCart) setCartCount(parseInt(cachedCart));
    if (cachedOrders) setOrderCount(parseInt(cachedOrders));
    if (cachedUnread) setUnreadCount(parseInt(cachedUnread));
  
    fetchCartCount();
    fetchOrderCount();
    fetchUnreadCount();
  
    const interval = setInterval(fetchUnreadCount, 15000);
  
    // ✅ Listen for both cart and messages updates
    window.addEventListener("cart-updated", fetchCartCount);
    window.addEventListener("messages-updated", fetchUnreadCount);
  
    return () => {
      window.removeEventListener("cart-updated", fetchCartCount);
      window.removeEventListener("messages-updated", fetchUnreadCount);
      clearInterval(interval);
    };
  }, []);  

  // 🔹 Fetch products from first subcategory
  const fetchCategoryProducts = async (category: Category) => {
    if (!category.subcategories || category.subcategories.length === 0) {
      setCategoryProducts([]);
      return;
    }
    const firstSubId = category.subcategories[0].id;
    setLoadingProducts(true);
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/subcategories/${firstSubId}/products`
      );
      const data = Array.isArray(res.data.products) ? res.data.products : [];
      const formatted = data.map((p: any) => ({
        id: p.id,
        name: p.name,
        image: p.images?.[0] || "/placeholder.png",
        price: p.new_price,
        oldPrice: p.old_price,
        rating: p.average_rating,
        reviews: p.review_count,
        attributes: p.attribute_values?.map((a: any) => a.value),
      }));
      setCategoryProducts(formatted);
    } catch (err) {
      console.error("❌ Error fetching products:", err);
      setCategoryProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  // 🔹 Close dropdowns when clicking outside (More + All Categories)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Close "More" dropdown
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setShowMore(false);
      }

      // Close "All Categories" dropdown
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowCategories(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🔹 Handle All Categories button click
  const handleShowCategories = () => {
    setShowCategories((prev) => {
      const newValue = !prev;
      if (newValue && categories.length > 0) {
        const first = categories[0];
        setActiveCategory(first);
        fetchCategoryProducts(first);
      } else {
        setActiveCategory(null);
      }
      return newValue;
    });
  };

  const visibleCategories = categories.slice(0, 6);
  const hiddenCategories = categories.slice(6);

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      {/* 🔹 Promo Bar */}
      <div className="bg-teal-600 text-white text-sm py-1 text-center font-medium">
        🎉 Big Sale! Enjoy discounts up to 70% off — Shop now!
      </div>

      {/* 🔹 Desktop Header */}
      <div className="hidden md:flex items-center justify-between px-6 lg:px-10 py-3">
        {/* Logo & Categories */}
        <div className="flex items-center gap-6">
        <Image
          src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/logo.png`}
          alt="Direct2Kariakoo"
          width={80}
          height={40}
          className="object-contain cursor-pointer"
          onClick={() => router.push("/user")}
        />
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={handleShowCategories}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-3 py-2 transition-all"
            >
              <span className="font-medium text-sm">All Categories</span>
              <ChevronDown
                size={16}
                className={`transform transition-transform ${
                  showCategories ? "rotate-180" : "rotate-0"
                }`}
              />
            </button>

            {/* 🔹 Mega Menu */}
            {showCategories && (
              <div className="absolute left-0 mt-2 w-[950px] h-[500px] bg-white border border-gray-200 rounded-xl shadow-2xl z-50 flex overflow-hidden">
                {/* Sidebar */}
                <div className="w-64 border-r border-gray-200 bg-gray-50 overflow-y-auto">
                  <div className="flex justify-between items-center px-4 py-2 border-b bg-gray-100">
                    <h3 className="text-sm font-semibold text-gray-800">
                      Categories
                    </h3>
                    <X
                      size={16}
                      className="text-gray-500 cursor-pointer hover:text-teal-600"
                      onClick={() => setShowCategories(false)}
                    />
                  </div>
                  {loading ? (
                    <p className="text-gray-500 text-sm p-4">
                      Loading categories...
                    </p>
                  ) : (
                    <ul>
                      {categories.map((cat) => (
                        <li
                          key={cat.id}
                          onMouseEnter={() => {
                            setActiveCategory(cat);
                            fetchCategoryProducts(cat);
                          }}
                          className={`flex items-center justify-between px-4 py-2 text-sm cursor-pointer hover:bg-white ${
                            activeCategory?.id === cat.id
                              ? "bg-white text-teal-600 font-medium"
                              : "text-gray-700"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {cat.icon && cat.icon.startsWith("http") ? (
                              <Image
                                src={cat.icon}
                                alt={cat.name}
                                width={22}
                                height={22}
                                className="rounded-full object-cover"
                              />
                            ) : (
                              <span>🛍️</span>
                            )}
                            <span>{cat.name}</span>
                          </div>
                          <ChevronRight size={14} className="text-gray-400" />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Subcategories & Products */}
                <div className="flex-1 bg-white p-6 overflow-y-auto">
                  {activeCategory ? (
                    <>
                      <h4 className="text-md font-semibold mb-4 text-gray-800">
                        {activeCategory.name}
                      </h4>

                      {activeCategory.subcategories?.length ? (
                        <div className="grid grid-cols-3 gap-3 mb-5">
                          {activeCategory.subcategories.map((sub) => (
                            <div
                              key={sub.id}
                              onClick={() => {
                                setShowCategories(false); // close the menu
                                router.push(`/user/subcategories/${sub.id}`);
                              }}
                              className="text-sm text-gray-600 hover:text-teal-600 cursor-pointer transition"
                            >
                              {sub.name}
                            </div>
                          ))}
                        </div>
                      ) : null}

                      <h5 className="text-sm font-semibold text-gray-700 mb-3">
                        Recommended Products
                      </h5>
                      {loadingProducts ? (
                        <p className="text-gray-400 text-sm">Loading...</p>
                      ) : categoryProducts.length === 0 ? (
                        <p className="text-gray-400 text-sm">
                          No products found.
                        </p>
                      ) : (
                        <div className="grid grid-cols-3 gap-4 overflow-y-auto pb-4 max-h-[320px]">
                        {categoryProducts.slice(0, 6).map((product) => (
                          <div
                            key={product.id}
                            className="h-[280px] flex cursor-pointer"
                            onClick={() => {
                              setShowCategories(false); // ✅ close mega menu
                              router.push(`/user/products?id=${product.id}`); // ✅ navigate safely via query
                            }}
                          >
                            <ProductCard product={product} />
                          </div>
                        ))}
                      </div>
                      )}
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                      Hover a category to view details
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 🔍 Search with Live Results */}
        <div className="flex-1 max-w-xl mx-10 relative">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search products..."
              className="w-full border border-gray-300 rounded-full py-2.5 pl-5 pr-10 focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => setShowResults(true)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
            />
            <Search
              onClick={handleSearchSubmit}
              className="absolute right-3 top-2.5 text-gray-500 cursor-pointer"
              size={20}
            />
          </div>

          {/* 🔹 Dropdown Results */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute top-11 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
              {searchResults.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setShowResults(false);
                    router.push(`/user/products?id=${product.id}`);
                  }}
                >
                  <Image
                    src={product.image || "/placeholder.png"}
                    alt={product.name}
                    width={45}
                    height={45}
                    className="rounded object-cover"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-800 line-clamp-1">
                      {product.name}
                    </span>
                    <span className="text-xs text-gray-600">
                      TZS {Number(product.price || 0).toLocaleString("en-TZ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 🔹 No results */}
          {showResults && searchQuery.length > 2 && searchResults.length === 0 && !searchLoading && (
            <div className="absolute top-11 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-3 text-sm text-gray-500">
              No products found.
            </div>
          )}

          {/* 🔹 Loading spinner */}
          {searchLoading && (
            <div className="absolute top-11 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-3 text-sm text-gray-500">
              Searching...
            </div>
          )}
        </div>

        {/* Right Section */}
        <div className="hidden md:flex items-center gap-8">
          {/* 🔹 Right-side Icons with notification badge */}
          <div className="flex items-center gap-4">
            {/* Orders → navigates to /user/orders */}
            <div
              onClick={() => router.push("/user/orders")}
              className="relative flex items-center gap-1 text-gray-700 hover:text-teal-600 cursor-pointer"
            >
              <Package size={18} />
              <span className="text-sm font-medium">Orders</span>
              {orderCount > 0 && (
                <span className="absolute -top-2 -right-3 bg-teal-600 text-white text-[10px] font-semibold rounded-full px-1.5">
                  {orderCount}
                </span>
              )}
            </div>

            {/* Messages → navigates to /user/messages */}
            <div
              onClick={() => router.push("/user/messages")}
              className="relative flex items-center gap-1 text-gray-700 hover:text-teal-600 cursor-pointer"
            >
              <MessageSquare size={18} />
              <span className="text-sm font-medium">Messages</span>
              {/* 🔹 Message count badge */}
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-3 bg-red-500 text-white text-[10px] font-semibold rounded-full px-1.5">
                  {unreadCount}
                </span>
              )}
            </div>

            {/* Account → navigates to /user/profile */}
            <div
              onClick={() => router.push("/user/profile")}
              className="flex items-center gap-1 text-gray-700 hover:text-teal-600 cursor-pointer"
            >
              <User size={18} />
              <span className="text-sm font-medium">Account</span>
            </div>

            {/* Cart */}
            <div
              onClick={() => router.push("/user/cart")}
              className="relative text-gray-700 hover:text-teal-600 cursor-pointer"
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-teal-600 text-white text-[10px] font-semibold rounded-full px-1.5">
                  {cartCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 🔹 Mobile Header */}
      <div className="flex md:hidden items-center justify-between px-4 py-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenu(true)}
            className="p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <Menu size={22} className="text-gray-700" />
          </button>
          <Image
            src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/logo.png`}
            alt="Direct2Kariakoo"
            width={70}
            height={30}
            className="object-contain cursor-pointer"
            onClick={() => {
              setMobileMenu(false);
              router.push("/user");
            }}
          />
        </div>

        <div className="flex items-center gap-3">
          {/* 🔍 Search button */}
          <button
            onClick={() => setShowSearch(true)}
            className="p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <Search size={20} className="text-gray-700" />
          </button>

          {/* 🛒 Mobile Cart — now reactive & clickable */}
          <div
            onClick={() => router.push("/user/cart")}
            className="relative p-2 rounded-lg hover:bg-gray-100 transition cursor-pointer"
          >
            <ShoppingCart size={22} className="text-gray-700" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-teal-600 text-white text-[10px] font-semibold rounded-full px-1.5">
                {cartCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 🔹 Mobile Search Overlay */}
      {showSearch && (
        <div className="fixed inset-0 bg-white z-50 p-4 animate-slide-in-right overflow-y-auto">
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => {
                setShowSearch(false);
                setSearchQuery("");
                setSearchResults([]);
              }}
              className="p-2 rounded-full hover:bg-gray-100 transition"
            >
              <ArrowLeft size={22} className="text-gray-700" />
            </button>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
              placeholder="Search products..."
              autoFocus
              className="flex-1 border border-gray-300 rounded-full py-2 px-4 focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm"
            />
          </div>

          {/* 🔹 Search Results */}
          {searchLoading ? (
            <p className="text-center text-gray-400 text-sm mt-10">Searching...</p>
          ) : searchQuery.length < 2 ? (
            <p className="text-gray-400 text-sm text-center mt-10">
              Start typing to search...
            </p>
          ) : searchResults.length === 0 ? (
            <p className="text-center text-gray-400 text-sm mt-10">
              No products found.
            </p>
          ) : (
            <div className="space-y-3">
              {searchResults.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 border-b border-gray-100 pb-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition"
                  onClick={() => {
                    setShowSearch(false);
                    router.push(`/user/products?id=${product.id}`);
                  }}
                >
                  <Image
                    src={product.image || "/placeholder.png"}
                    alt={product.name}
                    width={50}
                    height={50}
                    className="rounded-md object-cover"
                  />
                  <div>
                    <h4 className="text-sm font-medium text-gray-800 line-clamp-1">
                      {product.name}
                    </h4>
                    <p className="text-xs text-gray-600">
                      TZS {Number(product.price || 0).toLocaleString("en-TZ")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {mobileMenu && (
        <div className="fixed inset-0 bg-black/40 z-50 flex">
          <div className="bg-white w-72 h-full shadow-xl overflow-y-auto rounded-r-2xl">
            <div className="flex justify-between items-center px-4 py-3 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800">Categories</h2>
              <X
                size={22}
                className="text-gray-600 cursor-pointer"
                onClick={() => setMobileMenu(false)}
              />
            </div>

            {loading ? (
              <p className="text-gray-500 text-sm p-4">Loading...</p>
            ) : (
              categories.map((cat) => (
                <div key={cat.id} className="px-4 py-2">
                  {/* Category button */}
                  <button
                    onClick={() =>
                      activeCategory?.id === cat.id
                        ? setActiveCategory(null)
                        : setActiveCategory(cat)
                    }
                    className="flex justify-between items-center w-full text-left text-sm font-medium text-gray-700 hover:text-teal-600 py-2"
                  >
                    <span>{cat.name}</span>
                    <ChevronDown
                      size={15}
                      className={`transform transition-transform ${
                        activeCategory?.id === cat.id ? "rotate-180" : "rotate-0"
                      }`}
                    />
                  </button>

                  {/* Subcategory list */}
                  {activeCategory?.id === cat.id && (
                    <ul className="pl-4 space-y-2 mt-1">
                      {cat.subcategories?.length ? (
                        cat.subcategories.map((sub) => (
                          <li
                            key={sub.id}
                            onClick={() => {
                              // ✅ Close menu & trigger subcategory load on homepage
                              setMobileMenu(false);
                              setActiveCategory(cat);
                              onCategorySelect(cat);
                              onSubcategorySelect(sub.id);
                            }}
                            className="text-sm text-gray-600 hover:text-teal-600 cursor-pointer transition"
                          >
                            {sub.name}
                          </li>
                        ))
                      ) : (
                        <p className="text-xs text-gray-400 pl-1">
                          No subcategories
                        </p>
                      )}
                    </ul>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Overlay click closes menu */}
          <div className="flex-1" onClick={() => setMobileMenu(false)}></div>
        </div>
      )}

      {/* 🔹 Bottom Nav (desktop only) */}
      <nav className="hidden md:flex justify-center gap-6 text-gray-700 font-medium text-sm py-2 border-t border-gray-100 relative">
        {loading ? (
          <span className="text-gray-500 text-sm">Loading...</span>
        ) : (
          <>
            {visibleCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat);
                  fetchCategoryProducts(cat);
                  onCategorySelect(cat); // ✅ send selected category to HomePage
                }}                
                className={`transition whitespace-nowrap ${
                  activeCategory?.id === cat.id
                    ? "text-teal-600 font-semibold border-b-2 border-teal-600 pb-1"
                    : "text-gray-700 hover:text-teal-600"
                }`}
              >
                {cat.name}
              </button>
            ))}
            {hiddenCategories.length > 0 && (
              <div className="relative" ref={moreRef}>
                <button
                  onClick={() => setShowMore((prev) => !prev)}
                  className="flex items-center gap-1 hover:text-teal-600 transition"
                >
                  More
                  <ChevronDown
                    size={15}
                    className={`transform transition-transform ${
                      showMore ? "rotate-180" : "rotate-0"
                    }`}
                  />
                </button>
                {showMore && (
                <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <ul className="max-h-64 overflow-y-auto text-left">
                    {hiddenCategories.map((cat) => (
                      <li
                        key={cat.id}
                        onClick={() => {
                          setActiveCategory(cat);
                          fetchCategoryProducts(cat);
                          onCategorySelect(cat); // ✅ tell homepage to update
                          setShowMore(false); // ✅ close dropdown after selecting
                        }}
                        className={`px-4 py-2 text-sm cursor-pointer transition ${
                          activeCategory?.id === cat.id
                            ? "bg-teal-50 text-teal-600 font-semibold"
                            : "text-gray-700 hover:bg-teal-50 hover:text-teal-600"
                        }`}
                      >
                        {cat.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              </div>
            )}
          </>
        )}
      </nav>

      {/* 🔹 Animations */}
      <style>{`
        @keyframes slide-in-right {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease forwards;
        }
      `}</style>
    </header>
  );
}
