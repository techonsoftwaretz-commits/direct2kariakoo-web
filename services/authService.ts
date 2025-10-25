import { api } from "@/lib/api";

export const AuthService = {
  // -------------------- CUSTOMER REGISTRATION --------------------
  async registerCustomer(form: any) {
    try {
      const payload = {
        name: `${form.firstName} ${form.lastName}`,
        email: form.email,
        phone: form.phone,
        password: form.password,
        password_confirmation: form.password,
        role: "user",
        address: form.address,
      };

      const { data } = await api.post("/register", payload);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      return { success: true, user: data.user, token: data.token };
    } catch (error: any) {
      return handleError(error);
    }
  },

  // -------------------- VENDOR REGISTRATION --------------------
  async registerVendor(form: any) {
    try {
      const fd = new FormData();
      fd.append("name", `${form.firstName} ${form.lastName}`);
      fd.append("email", form.email);
      fd.append("phone", form.phone);
      fd.append("password", form.password);
      fd.append("password_confirmation", form.password);
      fd.append("role", "vendor");
      fd.append("business_name", form.businessName);
      fd.append("business_address", form.businessAddress);
      fd.append("avatar", form.avatar);
      fd.append("business_license", form.businessLicense); // ✅ FIXED key name
      if (form.nidaNumber) fd.append("nida_number", form.nidaNumber);
      if (form.nidaDocument) fd.append("nida_document", form.nidaDocument); // ✅ FIXED key name
      if (form.latitude) fd.append("latitude", String(form.latitude));
      if (form.longitude) fd.append("longitude", String(form.longitude));
  
      const { data } = await api.post("/register", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
  
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
  
      return { success: true, user: data.user, token: data.token };
    } catch (error: any) {
      return handleError(error);
    }
  },

  // -------------------- LOGIN --------------------
  async login(email: string, password: string) {
    try {
      console.log("🚀 Sending to:", api.defaults.baseURL + "/login");
      const { data } = await api.post("/login", { email, password });
      console.log("✅ Login response:", data);
  
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
  
      return { success: true, user: data.user, token: data.token };
    } catch (error: any) {
      console.error("❌ Login failed:", error.response?.status, error.response?.data);
      return handleError(error);
    }
  },  

  // -------------------- LOGOUT --------------------
  async logout() {
    try {
      await api.post("/logout");
    } catch {
      /* ignore logout errors */
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return { success: true };
  },

  // -------------------- GET CURRENT USER --------------------
  getCurrentUser() {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("user");
      return user ? JSON.parse(user) : null;
    }
    return null;
  },
};

// -------------------- ERROR HANDLER --------------------
function handleError(error: any) {
  if (error.response) {
    // Backend responded but with an error
    return {
      success: false,
      status: error.response.status,
      message:
        error.response.data?.message ||
        "Something went wrong. Please try again later.",
    };
  }

  if (error.request) {
    // No response received
    return {
      success: false,
      status: 0,
      message: "No response from server. Check your internet connection.",
    };
  }

  // Other unknown error
  return {
    success: false,
    status: 0,
    message: "Unexpected error occurred.",
  };
}
