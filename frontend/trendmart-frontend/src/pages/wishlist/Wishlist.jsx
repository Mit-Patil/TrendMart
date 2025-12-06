// src/pages/wishlist/Wishlist.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import wishlistService from "./wishlistService";
import api from "../../services/api";
import productService from "../product/productService";
import { FaTrashAlt } from "react-icons/fa";
import "../../styles/Wishlist.css";

const Wishlist = () => {
  const [wishlist, setWishlist] = useState([]);
  const [products, setProducts] = useState({}); // productId -> product data
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();

  // Fetch logged-in user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/api/Auth/me", { withCredentials: true });
        if (res.data.loggedIn) setUserId(res.data.userId);
        else setUserId(null);
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };
    fetchUser();
  }, []);

  // Fetch wishlist and product details
  useEffect(() => {
    if (!userId) return;

    const fetchWishlist = async () => {
      try {
        const res = await api.get("/api/Wishlists/my", { withCredentials: true });
        const wishlistData = res.data || [];
        setWishlist(wishlistData);

        // Fetch product details
        const uniqueProductIds = [...new Set(wishlistData.map((item) => item.productId))];
        const productsMap = {};
        await Promise.all(
          uniqueProductIds.map(async (id) => {
            const productRes = await productService.getProductById(id);
            productsMap[id] = productRes.data;
          })
        );
        setProducts(productsMap);
      } catch (err) {
        console.error("Error fetching wishlist:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [userId]);

  // Remove wishlist item
  const handleRemove = async (productId) => {
    try {
      await wishlistService.toggleWishlist(productId);
      setWishlist((prev) => prev.filter((item) => item.productId !== productId));
      const newProducts = { ...products };
      delete newProducts[productId];
      setProducts(newProducts);
    } catch (err) {
      alert("Failed to remove item.");
    }
  };

  const menu = [
    { label: "Edit Profile", path: `/users/edit/${userId}` },
    { label: "My Reviews", path: "/reviews" },
    { label: "Wishlist", path: "/wishlist" },
    { label: "Cart", path: "/cart" },
    { label: "Orders", path: "/orders" },
  ];

  if (loading) return <div>Loading your wishlist...</div>;

  return (
    <DashboardLayout menu={menu}>
      <div className="wishlist-container container mt-4">
        <h2 className="mb-4">My Wishlist</h2>

        {wishlist.length === 0 ? (
          <p>Your wishlist is empty.</p>
        ) : (
          <div className="wishlist-items row">
            {wishlist.map((item) => {
              const product = products[item.productId] || {};
              const productImages = product.productImages || [];
              const imgUrl =
                productImages.length > 0
                  ? productImages[0].imageUrl
                  : product.imageUrl || "/default-product.png";

              return (
                <div
                  key={item.productId}
                  className="wishlist-card col-md-4 p-3 d-flex align-items-center border rounded shadow-sm mb-3"
                >
                  <img
                    src={imgUrl}
                    alt={product.name || "Product"}
                    width={100}
                    height={100}
                    style={{ objectFit: "cover", cursor: "pointer" }}
                    onClick={() => navigate(`/product/${item.productId}`)}
                    onError={(e) => (e.target.src = "/default-product.png")}
                  />

                  <div className="wishlist-info flex-grow-1 ms-3">
                    <h5
                      style={{ cursor: "pointer" }}
                      onClick={() => navigate(`/product/${item.productId}`)}
                    >
                      {product.name || item.productName}
                    </h5>
                    <p className="text-muted mb-1">₹{product.price ?? item.price}</p>
                    <p className="text-muted small mb-1">Brand: {product.brand ?? "N/A"}</p>
                  </div>

                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleRemove(item.productId)}
                  >
                    <FaTrashAlt />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Wishlist;
