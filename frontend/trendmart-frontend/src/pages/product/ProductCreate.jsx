import React, { useState, useEffect } from "react";
import productService from "./productService";
import categoryService from "../category/categoryService";
import api from "../../services/api";
import { useNavigate, Link } from "react-router-dom";
import "../../styles/forms.css";
import DashboardLayout from "../../components/DashboardLayout";

import {
  validateProductName,
  validateProductDescription,
  validateProductPrice,
  validateProductBrand,
  validateProductCategory
} from "../../validation";

const ProductCreate = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    Name: "",
    Description: "",
    Price: "",
    CategoryID: "",
    Brand: "",
  });

  const [categories, setCategories] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchUserAndCategories = async () => {
      try {
        // Fetch logged-in user
        const res = await api.get("/api/Auth/me", { withCredentials: true });
        if (!res.data.loggedIn) {
          navigate("/login");
          return;
        }
        setUser(res.data);

        // Fetch categories
        const catRes = await categoryService.getAllCategory();
        setCategories(catRes.data || []);
      } catch (err) {
        console.error(err);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndCategories();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Live field validation
    let error = "";
    if (name === "Name") error = validateProductName(value);
    if (name === "Description") error = validateProductDescription(value);
    if (name === "Price") error = validateProductPrice(value);
    if (name === "Brand") error = validateProductBrand(value);
    if (name === "CategoryID") error = validateProductCategory(value);

    setErrors({ ...errors, [name]: error });
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields before submit
    const validationResults = {
      Name: validateProductName(formData.Name),
      Description: validateProductDescription(formData.Description),
      Price: validateProductPrice(formData.Price),
      Brand: validateProductBrand(formData.Brand),
      CategoryID: validateProductCategory(formData.CategoryID),
    };

    setErrors(validationResults);

    const hasError = Object.values(validationResults).some((err) => err !== "");
    if (hasError) return;

    // Original submit logic
    if (!user || user.role !== "Vendor") {
      alert("Only vendors can add products");
      return;
    }

    try {
      const res = await productService.createProduct(formData);
      const product = res.data.product;

      if (!product) {
        alert("Product created but response invalid");
        return;
      }

      alert("Product Registered Successfully!");

      // Reset form
      setFormData({ Name: "", Description: "", Price: "", CategoryID: "", Brand: "" });

      // Navigate to add images / variants
      navigate("/product/imgAdd"); 
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error registering product");
    }
  };

  if (loading) return <div className="container mt-5 text-center">Loading...</div>;

  if (!user || user.role !== "Vendor") {
    return (
      <div className="container mt-5 text-center">
        <h4>Only vendors can add products.</h4>
        <Link to="/products" className="btn btn-secondary mt-3">
          Go to Product List
        </Link>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="container form-container">
        <h2 className="form-title text-center">Product Registration</h2>

        <div className="mb-3 text-center">
        <Link to="/product/productlist" className="link-button">
          &larr; Product List
        </Link>
        </div>


        <form onSubmit={handleSubmit} className="form-card">
          {/* Name */}
          <div className="form-group mb-3">
            <label className="required">Name</label>
            <input
              type="text"
              className="form-control"
              name="Name"
              value={formData.Name}
              onChange={handleChange}
              placeholder="Enter product name"
            />
            {errors.Name && <p className="error">{errors.Name}</p>}
          </div>

          {/* Description */}
          <div className="form-group mb-3">
            <label className="required">Description</label>
            <input
              type="text"
              className="form-control"
              name="Description"
              value={formData.Description}
              onChange={handleChange}
              placeholder="Enter description"
            />
            {errors.Description && <p className="error">{errors.Description}</p>}
          </div>

          {/* Price */}
          <div className="form-group mb-3">
            <label className="required">Price</label>
            <input
              type="number"
              className="form-control"
              name="Price"
              value={formData.Price}
              onChange={handleChange}
              placeholder="Enter price"
            />
            {errors.Price && <p className="error">{errors.Price}</p>}
          </div>

          {/* Brand */}
          <div className="form-group mb-3">
            <label className="required">Brand</label>
            <input
              type="text"
              className="form-control"
              name="Brand"
              value={formData.Brand}
              onChange={handleChange}
              placeholder="Enter brand"
            />
            {errors.Brand && <p className="error">{errors.Brand}</p>}
          </div>

          {/* Category */}
          <div className="form-group mb-3">
            <label className="required">Category</label>
            <select
              className="form-control"
              name="CategoryID"
              value={formData.CategoryID}
              onChange={handleChange}
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.categoryId} value={cat.categoryId}>
                  {cat.categoryName}
                </option>
              ))}
            </select>
            {errors.CategoryID && <p className="error">{errors.CategoryID}</p>}
          </div>

          <div className="form-footer d-flex justify-content-center">
            <button type="submit" className="btn btn-primary">
              Register Product
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default ProductCreate;
