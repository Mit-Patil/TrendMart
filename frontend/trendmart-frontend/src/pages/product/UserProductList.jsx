// UserProductList.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import productService from "../product/productService";
import categoryService from "../category/categoryService";
import "../../styles/ProductList.css";

const UserProductList = () => {
const [products, setProducts] = useState([]);
const [categories, setCategories] = useState([]);
const [loading, setLoading] = useState(true);
 const navigate = useNavigate();

 const BASE_URL = "http://localhost:5198"; 

 /**
  * Helper to safely extract the FULL image URL from product data.
  * @param {object} product - The product object received from the API.
  */
 const getImageUrlFromProduct = (product) => {
  let defaultImageUrl = "https://dummyimage.com/200x200/cccccc/000000&text=No+Image";

  // 1. Check for the nested collection property names (most common C# EF Core serialization names)
  // Check for 'productImages' (camelCase) or 'ProductImages' (PascalCase)
  const nestedImages = product.productImages || product.ProductImages; 
    
  if (nestedImages && nestedImages.length > 0) {
   const firstImage = nestedImages[0];
   
   // Check for common casing of the URL property (imageUrl, imageURL, ImageUrl)
   const url = firstImage.imageUrl || firstImage.imageURL || firstImage.ImageUrl;
   
   if (url) {
    // If the URL is absolute (http/https), use it. Otherwise, assume it's a relative path.
    if (url.startsWith('http') || url.startsWith('/')) {
        return url.startsWith('http') ? url : `${BASE_URL}${url}`;
    }
   }
  }

  // 2. Fallback to placeholder if no valid URL is found
  // Using the hardcoded dummy image is safer than relying on the server's placeholder.
  return defaultImageUrl;
 };

 const fetchData = async () => {
  setLoading(true);
  try {
   const productRes = await productService.getAllProduct();
   
   // 🛑 CRITICAL DEBUGGING STEP 
   // We must see the data structure to know which property name is correct.
   if (productRes.data && productRes.data.length > 0) {
    console.log("--- DEBUGGING PRODUCT DATA STRUCTURE ---");
    console.log("First Product Object:", productRes.data[0]); 
    console.log("---------------------------------------");
   }
   // 🛑 END DEBUGGING STEP

   setProducts(productRes.data || []);

   const categoriesRes = await categoryService.getAllCategory();
   setCategories(categoriesRes.data || []);

   setLoading(false);
  } catch (error) {
   console.error("Error fetching products or categories", error);
   setLoading(false);
  }
 };

 useEffect(() => {
  fetchData();
 }, []);

 if (loading) return <div className="loading">Loading...</div>;

 return (
  <div className="product-page container mt-4">
   <h2 className="page-title text-center mb-4">🛍️ All Products</h2>

   <div className="product-grid">
    {products.length > 0 ? (
     products.map((product) => {
      // Find category safely
      const category = categories.find(
       (cat) => (cat.categoryId || cat.CategoryID) === (product.categoryId || product.CategoryID)
      );

      // Get the final, fully qualified image URL
      const finalImageUrl = getImageUrlFromProduct(product);

      return (
       <div
        key={product.productId || product.ProductID}
        className="product-card"
        onClick={() =>
         navigate(`/product/${product.productId || product.ProductID}`)
        }
        style={{ cursor: "pointer" }}
       >
        <img
         src={finalImageUrl}
         alt={product.name || product.Name}
         className="product-image"
         // Fallback for image load failure
         onError={(e) =>
          (e.target.src =
           "https://dummyimage.com/200x200/cccccc/000000&text=No+Image")
         }
        />

        <div className="product-info">
         <h4 className="product-name">{product.name || product.Name}</h4>
         <p className="product-brand mb-1">Brand: <strong>{product.brand || product.Brand}</strong></p>
         
         {/* Display Category */}
         <p className="product-category mb-1">
          Category:{" "}
          <span>
           {category ? category.categoryName || category.CategoryName : "Uncategorized"}
          </span>
         </p>
         
         {/* Display Description (Truncated) */}
         <p className="product-description text-muted small mb-2">
          {product.description || product.Description 
           ? (product.description || product.Description).substring(0, 50) + '...'
           : 'No description.'}
         </p>

         <p className="product-price">
          <span className="fw-bold">Price:</span> ₹{product.price || product.Price}
         </p>
        </div>
       </div>
      );
     })
    ) : (
     <p className="no-products text-center">No products available</p>
    )}
   </div>
  </div>
 );
};

export default UserProductList;