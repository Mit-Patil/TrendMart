import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import productService from "../product/productService";
import categoryService from "../category/categoryService";
import "../../styles/Home.css"; // optional, we can provide CSS
const BASE_URL = "http://localhost:5198";

const HomePage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper to get full image URL safely
  const getImageUrl = (product) => {
    const images = product.productImages || product.ProductImages;
    if (images && images.length > 0) {
      const url = images[0].imageUrl || images[0].imageURL || images[0].ImageUrl;
      return url ? (url.startsWith("http") ? url : `${BASE_URL}${url}`) : "https://dummyimage.com/200x200/cccccc/000000&text=No+Image";
    }
    return "https://dummyimage.com/200x200/cccccc/000000&text=No+Image";
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const productRes = await productService.getAllProduct();
      setProducts(productRes.data || []);

      const categoriesRes = await categoryService.getAllCategory();
      setCategories(categoriesRes.data || []);
    } catch (err) {
      console.error("Error fetching products/categories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <div className="loading text-center mt-5">Loading products...</div>;

  return (
    <div className="home-container container mt-4">
      <h2 className="text-center mb-4">🛍️ TrendMart Products</h2>

      <div className="product-grid">
        {products.length > 0 ? (
          products.map((product) => {
            const category = categories.find(
              (cat) => (cat.categoryId || cat.CategoryID) === (product.categoryId || product.CategoryID)
            );
            const finalImageUrl = getImageUrl(product);

            return (
              <div
                key={product.productId || product.ProductID}
                className="product-card shadow-sm"
                onClick={() => navigate(`/product/${product.productId || product.ProductID}`)}
              >
                <div className="product-image-container">
                  <img
                    src={finalImageUrl}
                    alt={product.name || product.Name}
                    className="product-image"
                    onError={(e) => (e.target.src = "https://dummyimage.com/200x200/cccccc/000000&text=No+Image")}
                  />
                </div>

                <div className="product-info p-2">
                  <h5 className="product-name">{product.name || product.Name}</h5>
                  <p className="product-brand mb-1"><strong>Brand:</strong> {product.brand || product.Brand}</p>
                  <p className="product-category mb-1">
                    <strong>Category:</strong> {category ? category.categoryName || category.CategoryName : "Uncategorized"}
                  </p>
                  <p className="product-description text-muted small">
                    {(product.description || product.Description)?.substring(0, 60) + '...'}
                  </p>
                  <p className="product-price fw-bold">₹{product.price || product.Price}</p>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-center">No products available</p>
        )}
      </div>
    </div>
  );
};

export default HomePage;
