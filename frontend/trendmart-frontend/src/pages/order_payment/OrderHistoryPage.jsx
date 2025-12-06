import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import orderService from "../order_payment/orderService";
import { format } from 'date-fns';
import DashboardLayout from '../../components/DashboardLayout';
import "../../styles/OrderHistory.css";

const OrderHistoryPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                const response = await orderService.getMyOrders();
                setOrders(response.data);
            } catch (err) {
                console.error("Error fetching order history:", err);
                if (err.response?.status === 401) {
                    setError('You must be logged in to view your order history.');
                } else {
                    setError('Failed to load order history. Server error.');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    const renderOrderCard = (order) => {
        const itemCount = order.orderItems.reduce((sum, item) => sum + item.quantity, 0);

        const statusColor = {
            Delivered: "delivered",
            Shipped: "shipped",
            Processing: "processing",
            Canceled: "canceled"
        }[order.status] || "unknown";

        return (
            <div
                key={order.orderId}
                className="order-card"
                onClick={() => navigate(`/orders/${order.orderId}`)}
            >
                <div className="order-row">

                    {/* Order Date */}
                    <div className="order-col">
                        <p className="label">Order Date</p>
                        <p className="value">{format(new Date(order.orderDate), "MMM dd, yyyy")}</p>
                    </div>

                    {/* Order ID */}
                    <div className="order-col">
                        <p className="label">Order ID</p>
                        <p className="value">#{order.orderId}</p>
                    </div>

                    {/* Order Status */}
                    <div className="order-col text-center">
                        <span className={`order-status ${statusColor}`}>
                            {order.status}
                        </span>
                    </div>

                    {/* 🔥 Payment Status (FIXED) */}
                    <div className="order-col text-center">
                        <p className="label">Payment</p>

                        <span
                            className={`payment-status ${
                                order.paymentStatus === "Paid" ? "text-success" : "text-danger"
                            }`}
                        >
                            {order.paymentStatus || "Unpaid"}
                        </span>
                    </div>

                    {/* Items Count */}
                    <div className="order-col text-end">
                        <p className="label">Items</p>
                        <p className="value">{itemCount}</p>
                    </div>

                    {/* Total */}
                    <div className="order-col text-end">
                        <p className="label">Total</p>
                        <p className="value total-amount">₹{order.totalAmount.toFixed(2)}</p>
                    </div>

                </div>
            </div>
        );
    };

    return (
        <DashboardLayout>
            <div className="orders-page container my-5">

                {loading && <p>Loading order history...</p>}
                {error && <p className="text-danger">{error}</p>}

                {!loading && !error && orders.length === 0 && (
                    <div className="no-orders text-center p-5 border rounded bg-light">
                        <h2 className="mb-3">No Orders Yet</h2>
                        <p>You haven't placed any orders yet. Start shopping now!</p>

                        <button className="btn btn-primary mt-3" onClick={() => navigate("/")}>
                            Go Shopping
                        </button>
                    </div>
                )}

                {!loading && !error && orders.length > 0 && (
                    <>
                        <h2 className="mb-4">Your Order History ({orders.length} orders)</h2>
                        {orders.map(renderOrderCard)}
                    </>
                )}

            </div>
        </DashboardLayout>
    );
};

export default OrderHistoryPage;
