import api from "../../services/api";

const categoryService = {
  
  getAllCategory: () => api.get("/api/Categories"),
  getCategoryById: (id) => api.get(`/api/Categories/${id}`),
  createCategory: (data) => api.post("/api/Categories", data),
  updateCategory: (id, data) => api.put(`/api/Categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/api/Categories/${id}`),


};

export default categoryService;
