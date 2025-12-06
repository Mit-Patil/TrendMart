import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import cartService from "./cartService";
import productService from "../../pages/product/productService";
import "../../styles/CartDisplay.css";
import DashboardLayout from "../../components/DashboardLayout";

const CartDisplay = () => {
  const navigate = useNavigate();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");
  const [products, setProducts] = useState({}); // Store productId -> product data

  // Fetch Cart
  const fetchCart = async () => {
    setLoading(true);
    setError(null);
    setMessage("");
    try {
      const response = await cartService.getCart();
      const cartData = response.data;
      setCart(cartData);

      // Fetch product details for each variant
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
      setError("Failed to load cart.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // Update Quantity
  const handleUpdateQuantity = async (variantId, newQuantity) => {
    newQuantity = parseInt(newQuantity);
    if (isNaN(newQuantity) || newQuantity < 0) return;

    const currentItem = cart.cartItems.find((item) => item.variantId === variantId);
    if (!currentItem) return;

    if (newQuantity === 0) {
      await handleRemoveItem(currentItem.cartItemId);
      return;
    }

    try {
      await cartService.addItemToCart(variantId, newQuantity);
      fetchCart();
    } catch (err) {
      console.error(err);
      setMessage("Failed to update quantity.");
    }
  };

  // Remove Item
  const handleRemoveItem = async (cartItemId) => {
    try {
      await cartService.removeCartItem(cartItemId);
      fetchCart();
    } catch (err) {
      console.error(err);
      setMessage("Failed to remove item.");
    }
  };

  // Checkout
  const handleProceedToCheckout = () => {
    if (!cart?.cartItems?.length) {
      setMessage("Your cart is empty.");
      return;
    }
    navigate("/checkout", { state: { cartItems: cart.cartItems } });
  };

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

  return (
    <DashboardLayout>
      {loading && <div>Loading your cart...</div>}
      {error && <div className="error">{error}</div>}

      {!loading && !error && cart?.cartItems?.length === 0 && (
        <div className="empty-cart">Your cart is empty.</div>
      )}

      {!loading && !error && cart?.cartItems?.length > 0 && (
        <div className="cart-page container my-5">
          <h2>Your Cart</h2>

          {message && <div className="alert alert-warning">{message}</div>}

          {cart.cartItems.map((item) => {
            const variant = item.variant || {};
            const product = products[variant.productId] || {};

            const name = product.name ?? `Product #${variant.productId}`;
            const brand = product.brand ?? "N/A";
            const price = Number(product.price ?? item.price ?? 0);
            const qty = Number(item.quantity ?? 1);
            const itemTotal = price * qty;

                const productImages = product.productImages || [];
                let img =
                productImages.length > 0
                    ? productImages[0].imageUrl
                    : product.imageUrl || "https://dummyimage.com/100x100/cccccc/000000&text=No+Image";


            return (
              <div
                key={item.cartItemId}
                className="cart-item-row p-3 mb-3 d-flex align-items-center justify-content-between border rounded shadow-sm"
              >
                <div
                  className="me-3"
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate(`/product/${variant.productId}`)}
                >
                 <img
                  src={img}
                  alt={item.productName}
                  width={100}
                  height={100}
                  style={{ objectFit: "cover" }}
                  onError={(e) => e.target.src = "/default-product.png"}
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

                <div className="d-flex align-items-center mx-3">
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => handleUpdateQuantity(item.variantId, qty - 1)}
                    disabled={qty <= 1}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={qty}
                    min="1"
                    className="form-control form-control-sm text-center mx-1"
                    style={{ width: "60px" }}
                    onChange={(e) =>
                      handleUpdateQuantity(item.variantId, parseInt(e.target.value) || 1)
                    }
                  />
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => handleUpdateQuantity(item.variantId, qty + 1)}
                  >
                    +
                  </button>
                </div>

                <div className="text-end" style={{ minWidth: "150px" }}>
                  <p className="fw-bold mb-1 h5">₹{itemTotal}</p>
                  <button
                    className="btn btn-sm btn-link text-danger p-0"
                    onClick={() => handleRemoveItem(item.cartItemId)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}

          <hr />

          <div className="cart-summary p-4 border rounded bg-light text-end shadow-sm">
            <h3>Total: ₹{total}</h3>
            <button className="btn btn-success btn-lg mt-2" onClick={handleProceedToCheckout}>
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default CartDisplay;
