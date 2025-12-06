import api from "../../services/api";
import axios from "axios";

const API_URL = "http://localhost:5198/api"; // Make sure this matches your backend URL

const userService = {
  // Users
  getAllUsers: () => api.get("/api/Users"),
  getUserById: (id) => api.get(`/api/Users/${id}`),
  createUser: (data) => api.post("/api/Users", data),
  updateUser: (id, data) => api.put(`/api/Users/${id}`, data),
  deleteUser: (id) => api.delete(`/api/Users/${id}`),

  // User ID from session
  getUserIdFromSession: () =>
    api.get("/api/Users/session", { withCredentials: true }),

  // Get user by email
  getUserByEmail: async (email) => {
    try {
      const res = await axios.get(`${API_URL}/Users/by-email`, {
        params: { email },
      });
      return res;
    } catch (err) {
      if (err.response && err.response.status === 404) {
        // User not found is not an error, just return null
        return { data: null };
      }
      throw err; // Only throw for real errors
    }
  },

  // Addresses
  getAddressesByUserId: (userId) =>
    api.get(`/api/UserAddresses/user/${userId}`),
  updateOrCreateAddressesByUserId: (userId, data) =>
    api.put(`/api/UserAddresses/user/${userId}`, data, { withCredentials: true }),
  createAddress: (data) => api.post("/api/UserAddresses", data),
  updateAddress: (id, data) => api.put(`/api/UserAddresses/${id}`, data),
  deleteAddress: (id) => api.delete(`/api/UserAddresses/${id}`),

  // Profiles
  getAllProfiles: () => api.get("/api/UserProfiles"),
  getProfileById: (id) => api.get(`/api/UserProfiles/${id}`),
// Profiles
createProfile: (data) => {
  const formData = new FormData();

  for (const key in data) {
    if (data[key] !== undefined && data[key] !== null) {
      formData.append(key, data[key]);
    }
  }

  return api.post("/api/UserProfiles", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
},

  updateProfile: (id, data) => api.put(`/api/UserProfiles/user/${id}`, data),
  deleteProfile: (id) => api.delete(`/api/UserProfiles/${id}`),

  // Profile by userId
  getProfileByUserId: (userId) =>
    api.get(`/api/UserProfiles/user/${userId}`),
updateOrCreateProfileByUserId: (userId, formData) =>
  api.put(`/api/UserProfiles/user/${userId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }),


  // Delete user completely
  deleteUserCompletely: (id) =>
    api.delete(`/api/Users/Complete/${id}`, { withCredentials: true }),

  upgradeToVendor: () =>
  api.put("/api/Users/upgradeToVendor", {}, { withCredentials: true }),

};

export default userService;
