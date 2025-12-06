import api from "../../services/api";

const orderService = {
    /**
     * STEP 1: CREATE ORDER
     * @description Sends only addressId. Backend returns { orderId }
     */
    createOrder: (addressId) => {
        return api.post("/api/Orders/create", { addressId }, { withCredentials: true });
    },

    /**
     * STEP 2: ADD ITEMS TO ORDER
     * @description Sends list of items to backend
     * items = [{ orderId, variantId, quantity }]
     */
    addOrderItems: (items) => {
        return api.post("/api/OrderItems/add", items, { withCredentials: true });
    },

    /**
     * Get all orders for current user
     */
    getMyOrders: () => {
        return api.get("/api/Orders", { withCredentials: true });
    },

    /**
     * Get specific order detail
     */
    getOrderDetail: (orderId) => {
        return api.get(`/api/Orders/${orderId}`, { withCredentials: true });
    },

    /**
     * ==========================
     * PAYMENT RELATED METHODS
     * ==========================
     */

    // Get all payments (optional)
    getPayments: () => {
        return api.get("/api/Payments", { withCredentials: true });
    },

    // Get payment by ID
    getPaymentById: (id) => {
        return api.get(`/api/Payments/${id}`, { withCredentials: true });
    },

    // Create a new payment
    createPayment: (paymentData) => {
        return api.post("/api/Payments", paymentData, { withCredentials: true });
    },

    /**
     * ---------------- Razorpay Integration ----------------
     * Create a Razorpay order from backend
     * @param {number} amount - total amount in rupees
     * @returns Razorpay order data
     */
    createRazorpayOrder: (amount) => {
        // amount is in rupees, backend will convert to paise
        return api.post(
            "/api/razorpay/create-order",
            { amount },
            { withCredentials: true }
        ).then(res => res.data)
         .catch(err => {
            console.error("Error creating Razorpay order:", err);
            throw err;
        });
    }
};

export default orderService;
