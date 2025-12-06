import api from "../../services/api";

const cartService = {
    getCart: () => api.get("/api/Carts/mycart", { withCredentials: true }),
    addItemToCart: (variantId, quantity) =>
        api.post(`/api/Carts/add?variantId=${variantId}&quantity=${quantity}`, null, { withCredentials: true }),
    removeCartItem: (cartItemId) => api.delete(`/api/CartItems/${cartItemId}`, { withCredentials: true }),
    clearCart: () => api.delete("/api/Carts/clear", { withCredentials: true })
};



export default cartService;
