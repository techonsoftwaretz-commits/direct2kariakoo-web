// /app/user/utils/cartUtils.ts
export const updateCartCache = (items: any[]) => {
    localStorage.setItem("cart_items", JSON.stringify(items));
    window.dispatchEvent(new Event("cart-updated")); // Notify all headers
  };
  