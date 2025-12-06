import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import cartService from "../cart/cartService";
import productService from "../../pages/product/productService";
import AddressSelector from "../users/AddressSelector";
import orderService from "../order_payment/orderService";
import "../../styles/CheckoutPage.css";

const CheckoutPage = () => {
  const navigate = useNavigate();

  const [cart, setCart] = useState(null);
  const [products, setProducts] = useState({}); // productId -> product details
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  // Fetch cart and product details
  const fetchCart = async () => {
    setLoading(true);
    setMessage("");
    try {
      const response = await cartService.getCart();
      const cartData = response.data;
      setCart(cartData);

      // Fetch product details for unique productIds
      const uniqueProductIds = [
        ...new Set(cartData.cartItems.map((item) => item.variant?.productId)),
      ];

      const productsMap = {};
      await Promise.all(
        uniqueProductIds.map(async (id) => {
          if (id) {
            const res = await productService.getProductById(id);
            productsMap[id] = res.data;
          }
        })
      );

      setProducts(productsMap);
    } catch (err) {
      console.error(err);
      setCart({ cartItems: [] });
      setMessage("Failed to load cart.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // Calculate total
  const calculateTotal = () => {
    if (!cart?.cartItems) return 0;
    return cart.cartItems.reduce((sum, item) => {
      const product = products[item.variant?.productId] || {};
      const price = Number(product.price ?? item.price ?? 0);
      const qty = Number(item.quantity ?? 1);
      return sum + price * qty;
    }, 0);
  };
  const total = calculateTotal();

  // Proceed to checkout (create order)
  const handleProceedToCheckout = async () => {
    if (!cart?.cartItems?.length) {
      setMessage("Your cart is empty.");
      return;
    }
    if (!selectedAddressId) {
      setMessage("Please select a shipping address.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const orderRes = await orderService.createOrder(selectedAddressId);
      const orderId = orderRes.data.orderId;

      const items = cart.cartItems.map((item) => ({
        orderId,
        variantId: item.variantId ?? item.VariantId,
        quantity: item.quantity,
        price: item.price,
      }));

      await orderService.addOrderItems(items);
      navigate(`/orders/${orderId}`);
    } catch (err) {
      console.error(err);
      setMessage("Failed to create order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading checkout...</div>;
  if (!cart || cart.cartItems.length === 0) return <div className="empty-cart">Your cart is empty.</div>;

  return (
    <div className="checkout-page container my-5">
      <h2>🛒 Checkout</h2>
      {message && <div className="alert alert-danger">{message}</div>}

      <div className="address-section mb-4">
        <AddressSelector onAddressSelect={setSelectedAddressId} />
      </div>

      <div className="cart-items mb-4">
        {cart.cartItems.map((item) => {
          const variant = item.variant || {};
          const product = products[variant.productId] || {};

          const name = product.name ?? `Product #${variant.productId}`;
          const brand = product.brand ?? "N/A";
          const price = Number(product.price ?? item.price ?? 0);
          const qty = Number(item.quantity ?? 1);
          const itemTotal = price * qty;

          const productImages = product.productImages || [];
          const img =
            productImages.length > 0
              ? productImages[0].imageUrl
              : product.imageUrl || "https://dummyimage.com/100x100/cccccc/000000&text=No+Image";

          return (
            <div
              key={item.cartItemId ?? item.CartItemId}
              className="cart-item-row p-3 mb-3 d-flex align-items-center justify-content-between border rounded shadow-sm"
            >
              <div
                className="me-3"
                style={{ cursor: "pointer" }}
                onClick={() => navigate(`/product/${variant.productId}`)}
              >
                <img
                  src={img}
                  alt={name}
                  width={90}
                  height={90}
                  className="rounded"
                  style={{ objectFit: "cover" }}
                  onError={(e) =>
                    (e.target.src =
                      "https://dummyimage.com/100x100/cccccc/000000&text=No+Image")
                  }
                />
              </div>

              <div className="flex-grow-1">
                <h5>{name}</h5>
                <p className="text-muted small mb-1">Brand: {brand}</p>
                <p className="text-muted small mb-1">
                  Size: {variant.size ?? "N/A"} | Color: {variant.color ?? "N/A"}
                </p>
                <p className="text-muted small mb-0">Unit Price: ₹{price}</p>
              </div>

              <div className="text-end" style={{ minWidth: "150px" }}>
                <p className="fw-bold mb-1 h5">₹{itemTotal}</p>
                <p className="text-muted small mb-0">Qty: {qty}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="checkout-summary p-4 border rounded bg-light d-flex justify-content-between align-items-center shadow-sm">
        <h4 className="text-dark">Grand Total: ₹{total}</h4>
        <button
          className="btn btn-success btn-lg"
          onClick={handleProceedToCheckout}
          disabled={total <= 0}
        >
          Proceed to Payment
        </button>
      </div>
    </div>
  );
};

export default CheckoutPage;
