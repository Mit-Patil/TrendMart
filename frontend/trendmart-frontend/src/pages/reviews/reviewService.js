import api from "../../services/api";
const reviewService = {
    getReviewsByProductId: (productId) => {
        return api.get(`/api/Reviews/by-product/${productId}`); 
    },

    getReviewsByUserId: () => {
        return api.get(`/api/Reviews/my-reviews`); 
    },

    submitReview: (reviewData) => {
        return api.post('/api/Reviews', reviewData);
    },
    
    updateReview: (reviewId, reviewData) => {
        return api.put(`/api/Reviews/${reviewId}`, reviewData);
    },

    deleteReview: (reviewId) => {
        return api.delete(`/api/Reviews/${reviewId}`);
    },
};

export default reviewService;