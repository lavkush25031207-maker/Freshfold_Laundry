const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD
  ? "https://freshfold-api-kns9.onrender.com/api"
  : "http://localhost:8080/api");
const TOKEN_KEY = "freshfold-token";
const fallbackAreas = [
  {
    pincode: "110001",
    areaName: "Central Delhi",
    latitude: 28.6304,
    longitude: 77.2177,
  },
  {
    pincode: "110016",
    areaName: "South Delhi",
    latitude: 28.5483,
    longitude: 77.1969,
  },
  {
    pincode: "110080",
    areaName: "Delhi NCR",
    latitude: 28.5053,
    longitude: 77.3047,
  },
  {
    pincode: "122001",
    areaName: "Gurugram",
    latitude: 28.4595,
    longitude: 77.0266,
  },
  {
    pincode: "201301",
    areaName: "Noida",
    latitude: 28.5355,
    longitude: 77.391,
  },
];

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      ...options.headers,
    },
  });
  if (!response.ok) {
    const problem = await response.json().catch(() => ({}));
    const error = new Error(
      problem.message || "Something went wrong. Please try again.",
    );
    error.status = response.status;
    throw error;
  }
  return response.status === 204 ? null : response.json();
}

export const api = {
  signup: (payload) =>
    request("/auth/signup", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload) =>
    request("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  me: () => request("/auth/me"),
  logout: () => request("/auth/logout", { method: "POST" }),
  services: () => request("/services"),
  serviceAreas: () =>
    request("/service-areas").catch((error) => {
      if ([403, 404].includes(error.status)) return fallbackAreas;
      throw error;
    }),
  slots: (pincode) => request(`/slots?pincode=${encodeURIComponent(pincode)}`),
  createOrder: (payload) =>
    request("/orders", { method: "POST", body: JSON.stringify(payload) }),
  trackOrder: (orderNumber) => request(`/orders/${orderNumber}`),
  myOrders: () => request("/orders/mine"),
  orders: () =>
    request("/admin/orders").catch((error) => {
      if (error.status === 404)
        throw new Error(
          "Admin API is unavailable. Restart the Spring Boot backend to load the latest routes.",
        );
      throw error;
    }),
  updateStatus: (orderNumber, status) =>
    request(`/admin/orders/${orderNumber}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  updateStage: (orderNumber, stage) =>
    request(`/admin/orders/${orderNumber}/stage`, {
      method: "PATCH",
      body: JSON.stringify({ stage }),
    }),
  updatePayment: (orderNumber, paymentStatus) =>
    request(`/admin/orders/${orderNumber}/payment`, {
      method: "PATCH",
      body: JSON.stringify({ paymentStatus }),
    }),
  deliveryAgents: () => request("/admin/delivery-agents"),
  createDeliveryAgent: (payload) =>
    request("/admin/delivery-agents", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateDeliveryAgent: (id, payload) =>
    request(`/admin/delivery-agents/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteDeliveryAgent: (id) =>
    request(`/admin/delivery-agents/${id}`, { method: "DELETE" }),
};
