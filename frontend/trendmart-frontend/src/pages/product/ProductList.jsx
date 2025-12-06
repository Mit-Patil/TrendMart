import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import productService from "./productService";
import categoryService from "../category/categoryService";
import api from "../../services/api";
import "../../styles/ProductList.css";
import DashboardLayout from "../../components/DashboardLayout";

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // ------------------- Get logged-in user -------------------
        const userRes = await api.get("/api/Auth/me", { withCredentials: true });
        console.log("User API Response:", userRes.data);

        if (!userRes.data.loggedIn) {
          // Not logged in
          navigate("/login");
          return;
        }

        setUser(userRes.data);

        // Redirect non-vendors
        if (userRes.data.role !== "Vendor") {
          navigate("/products"); // Go to public products page
          return;
        }

        const userId = userRes.data.userId;

        // ------------------- Fetch vendor products -------------------
        const productRes = await productService.getVendorProducts(userId);
        setProducts(productRes.data || []);

        // ------------------- Fetch categories -------------------
        const categoriesRes = await categoryService.getAllCategory();
        setCategories(categoriesRes.data || []);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
        navigate("/products"); // Fallback redirect
      }
    };

    fetchData();
  }, [navigate]);

  const handleDelete = async (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await productService.deleteProduct(productId);
        setProducts(products.filter((p) => p.productId !== productId));
      } catch (error) {
        console.error("Delete failed", error);
      }
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  // Extra safety: If somehow user is not a vendor, don't render the page
  if (!user || user.role !== "Vendor") return null;

  return (
    <DashboardLayout>
    <div className="product-page">
      <h2 className="page-title">🛍️ My Products</h2>

      <div className="product-grid">
        {products.length > 0 ? (
          products.map((product) => {
            const category = categories.find(
              (cat) => cat.categoryId === product.categoryId
            );

            // Image logic
            let imageUrl =
              "https://dummyimage.com/200x200/cccccc/000000&text=No+Image";

            if (product.productImages && product.productImages.length > 0) {
              imageUrl = product.productImages[0].imageUrl || imageUrl;
            } else if (product.imageUrl) {
              imageUrl = product.imageUrl;
            }

            return (
              <div key={product.productId} className="product-card">
                <img
                  src={imageUrl}
                  alt={product.name}
                  className="product-image"
                  onError={(e) =>
                    (e.target.src =
                      "https://dummyimage.com/200x200/cccccc/000000&text=No+Image")
                  }
                />

                <div className="product-info">
                  <h4>{product.name}</h4>
                  <p>{product.brand}</p>
                  <p>{product.description}</p>
                  <p>
                    Category:{" "}
                    <span>{category ? category.categoryName : "Uncategorized"}</span>
                  </p>
                  <p>₹{product.price}</p>
                </div>

                <div className="product-actions">
                  <Link
                    to={`/product/edit/${product.productId}`}
                    className="edit-btn"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(product.productId)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <p>You have no products yet.</p>
        )}
      </div>
    </div>
    </DashboardLayout>
  );
};

export default ProductList;
