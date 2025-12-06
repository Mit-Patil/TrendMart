// src/pages/product/ProductImageAdd.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import productService from "./productService";
import "../../styles/forms.css";
import DashboardLayout from "../../components/DashboardLayout";
import { validateProfileImage } from "../../validation"; // reuse validation

const ProductImageAdd = () => {
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [images, setImages] = useState([]);
  const [error, setError] = useState("");

  // ----------------- LOAD PRODUCT INFO USING SESSION -----------------
  useEffect(() => {
    const loadProduct = async () => {
      try {
        const sessionRes = await productService.getProductIdFromSession();
        const productId = sessionRes.data.productId;

        const productRes = await productService.getProductById(productId);
        setProduct(productRes.data);
      } catch (err) {
        console.error(err);
        alert("Unable to load product information");
      }
    };
    loadProduct();
  }, []);

  // ----------------- IMAGE SELECTION -----------------
  const handleImageChange = (e) => {
    const selectedFiles = Array.from(e.target.files); // convert FileList to array

    // Validate all selected images
    const errors = selectedFiles
      .map((file) => validateProfileImage(file))
      .filter((msg) => msg !== "");

    if (errors.length > 0) {
      alert(errors.join("\n"));
      e.target.value = null;
      setImages([]);
      return;
    }

    setImages(selectedFiles);
    setError("");
  };

  // ----------------- UPLOAD ALL IMAGES -----------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (images.length === 0) {
      setError("Please select at least one image");
      return;
    }

    try {
      for (const img of images) {
        const formData = new FormData();
        formData.append("ImageFile", img);
        formData.append("ProductID", 0); // backend uses session ProductID

        await productService.uploadProductImage(formData);
      }

      alert("Images uploaded successfully!");
      setImages([]);
      navigate("/product/ProductVariantsAdd");
    } catch (err) {
      console.error(err);
      setError("Error uploading images");
    }
  };

  if (!product) return <div className="container mt-5 text-center">Loading...</div>;

  return (
    <DashboardLayout>
      <div className="container form-container">
        <h2 className="form-title text-center mb-4">Upload Product Images</h2>

        {/* ---------------- PRODUCT INFO CARD ---------------- */}
        <div className="form-card mb-4">
          <h4>Product Information</h4>
          <p><strong>Name:</strong> {product.name}</p>
          <p><strong>Brand:</strong> {product.brand}</p>
          <p><strong>Price:</strong> ₹{product.price}</p>
          <p><strong>Category ID:</strong> {product.categoryId}</p>
          <p><strong>Description:</strong> {product.description}</p>
        </div>

        {/* ---------------- IMAGE UPLOAD FORM ---------------- */}
        <form onSubmit={handleSubmit} className="form-card">
          <div className="form-group mb-3">
            <label className="required">Select Images</label>
            <input
              type="file"
              multiple
              className="form-control"
              onChange={handleImageChange}
            />
            {error && <p className="error">{error}</p>}
          </div>

          <div className="form-footer d-flex justify-content-center">
            <button type="submit" className="btn btn-primary">
              Upload Images
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default ProductImageAdd;
