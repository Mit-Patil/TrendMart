// src/pages/product/ProductVariantsAdd.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import productService from "./productService";
import "../../styles/forms.css";
import DashboardLayout from "../../components/DashboardLayout";
import { validateSize, validateColor, validateStock } from "../../validation";

const ProductVariantsAdd = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState({
    Gender: "",
    Size: "",
    Color: "",
    Stock: "",
  });
  const [errors, setErrors] = useState({ Size: "", Color: "", Stock: "" });

  // ----------------- FETCH USER -----------------
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/api/Auth/me", { withCredentials: true });
        if (!res.data.loggedIn) {
          navigate("/login");
          return;
        }
        setUser(res.data);
      } catch (err) {
        console.error("Error fetching user:", err);
        navigate("/login");
      }
    };
    fetchUser();
  }, [navigate]);

  // ----------------- LOAD PRODUCT INFO FROM SESSION -----------------
  useEffect(() => {
    const loadProduct = async () => {
      try {
        const sessionRes = await productService.getProductIdFromSession();
        const productId = sessionRes.data.productId;
        if (!productId) {
          alert("No product selected.");
          return;
        }
        const productRes = await productService.getProductById(productId);
        setProduct(productRes.data);
      } catch (err) {
        console.error(err);
        alert("Unable to load product information");
      }
    };
    loadProduct();
  }, []);

  // ----------------- HANDLE FORM CHANGE -----------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setVariants({ ...variants, [name]: value });

    // Live validation
    let error = "";
    if (name === "Size") error = validateSize(value);
    if (name === "Color") error = validateColor(value);
    if (name === "Stock") error = validateStock(value);
    setErrors({ ...errors, [name]: error });
  };

  // ----------------- HANDLE SUBMIT -----------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields
    const validationResults = {
      Size: validateSize(variants.Size),
      Color: validateColor(variants.Color),
      Stock: validateStock(variants.Stock),
    };
    setErrors(validationResults);

    const hasError = Object.values(validationResults).some((err) => err !== "");
    if (hasError) {
      alert("Please fix the errors before submitting");
      return;
    }

    if (!user || user.role !== "Vendor") {
      alert("Only vendors can add products");
      return;
    }

    try {
      await productService.addProductVariant(variants);
      alert("Product variant registered successfully!");
      setVariants({ Gender: "", Size: "", Color: "", Stock: "" });
    } catch (err) {
      console.error("Error registering product variant:", err);
      alert(err.response?.data?.message || "Error registering product variant");
    }
  };

  if (!product) return <div className="container mt-5 text-center">Loading...</div>;

  return (
    <DashboardLayout>
      <div className="container form-container">
        <h2 className="form-title text-center mb-4">Product Variant Registration</h2>

        {/* ---------------- PRODUCT INFO CARD ---------------- */}
        <div className="form-card mb-4">
          <h4>Product Information</h4>
          <p><strong>Name:</strong> {product.name}</p>
          <p><strong>Brand:</strong> {product.brand}</p>
          <p><strong>Price:</strong> ₹{product.price}</p>
          <p><strong>Category ID:</strong> {product.categoryId}</p>
          <p><strong>Description:</strong> {product.description}</p>
        </div>

        {/* ---------------- VARIANT FORM ---------------- */}
        <form onSubmit={handleSubmit} className="form-card">
          <div className="form-group mb-3">
            <label>Gender:</label>
            <select
              className="form-control"
              name="Gender"
              value={variants.Gender}
              onChange={handleChange}
            >
              <option value="">-- Select Gender --</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Unisex">Unisex</option>
            </select>
          </div>

          <div className="form-group mb-3">
            <label className="required">Size:</label>
            <input
              type="text"
              className="form-control"
              name="Size"
              value={variants.Size}
              onChange={handleChange}
              placeholder="Enter Sizes (S, M, L or number)"
            />
            {errors.Size && <p className="error">{errors.Size}</p>}
          </div>

          <div className="form-group mb-3">
            <label className="required">Color:</label>
            <input
              type="text"
              className="form-control"
              name="Color"
              value={variants.Color}
              onChange={handleChange}
              placeholder="Enter Color"
            />
            {errors.Color && <p className="error">{errors.Color}</p>}
          </div>

          <div className="form-group mb-3">
            <label className="required">Stock:</label>
            <input
              type="number"
              className="form-control"
              name="Stock"
              value={variants.Stock}
              onChange={handleChange}
              placeholder="Enter Stock"
            />
            {errors.Stock && <p className="error">{errors.Stock}</p>}
          </div>

          <div className="form-footer d-flex justify-content-center">
            <button type="submit" className="btn btn-primary w-100">
              Register Variant
            </button>
          </div>

          <div className="mt-3 text-center">
            <a href="/product/productList" className="link-button">Back to Products</a>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default ProductVariantsAdd;
