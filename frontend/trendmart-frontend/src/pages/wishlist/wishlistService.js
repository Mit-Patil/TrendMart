
import api from '../../services/api'; 

const WISHLIST_API_URL = '/api/Wishlists';

const wishlistService = {


    checkWishlistStatus: async (productId) => {
        try {
            const response = await api.get(`${WISHLIST_API_URL}/status/${productId}`, { withCredentials: true });
            return response.data;
        } catch (error) {
            if (error.response && error.response.status === 401) {
                return false;
            }
            throw error;
        }
    },

    toggleWishlist: async (productId) => {
        try {
            // POST: /api/Wishlists/toggle/{productId}
            const response = await api.post(`${WISHLIST_API_URL}/toggle/${productId}`, null, { withCredentials: true });
            return response.data;
        } catch (error) {
            throw error;
        }
    },
};

export default wishlistService;