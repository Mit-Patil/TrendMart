import api from "../../services/api";

const productService = {
  // ---------------------- PRODUCT CRUD ----------------------
  getAllProduct: () =>
    api.get("/api/Products", { withCredentials: true }),

  getVendorProducts: (sellerId) =>
    api.get(`/api/Products/vendor/${sellerId}`, { withCredentials: true }),

  getProductById: (id) =>
    api.get(`/api/Products/${id}`, { withCredentials: true }),

  createProduct: (data) =>
    api.post("/api/Products", data, { withCredentials: true }),

  updateProduct: (id, data) =>
    api.put(`/api/Products/${id}`, data, { withCredentials: true }),

  deleteProduct: (id) =>
    api.delete(`/api/Products/${id}`, { withCredentials: true }),

  getProductByCategoryId: (categoryId) =>
    api.get(`/api/Products/category/${categoryId}`, { withCredentials: true }),

  getProductIdFromSession: () =>
    api.get("/api/Products/session", { withCredentials: true }),

  setProductIdInSession: (productId) =>
    api.post(`/api/Products/session/set/${productId}`, null, { withCredentials: true }),

  // ---------------------- FILTERED PRODUCTS API ----------------------
  getFilteredProducts: (filters) =>
    api.get("/api/Products/filtered", {
      params: filters,
      withCredentials: true,
    }),

  // ---------------------- PRODUCT IMAGE APIs ----------------------
  getAllImages: () =>
    api.get("/api/ProductImages", { withCredentials: true }),

  getImagesByProductId: (productId) =>
    api.get(`/api/ProductImages/product/${productId}`, { withCredentials: true }),

  uploadProductImage: (formData) =>
    api.post("/api/ProductImages", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      withCredentials: true,
    }),

  deleteProductImage: (imageId) =>
    api.delete(`/api/ProductImages/${imageId}`, { withCredentials: true }),

  // ---------------------- PRODUCT VARIANT APIs ----------------------
  getVariantsByProductId: (productId) =>
    api.get(`/api/ProductVariants/product/${productId}`, { withCredentials: true }),

  addProductVariant: (data) =>
    api.post("/api/ProductVariants", data, { withCredentials: true }),

  updateProductVariant: (variantId, data) =>
    api.put(`/api/ProductVariants/${variantId}`, data, { withCredentials: true }),

  deleteProductVariant: (variantId) =>
    api.delete(`/api/ProductVariants/${variantId}`, { withCredentials: true }),
};

export default productService;
