import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import categoryService from "./categoryService";
import api from "../../services/api";
import "../../styles/forms.css";
import DashboardLayout from "../../components/DashboardLayout";

// Import validations
import { validateRequired, validateCategoryName } from "../../validation";

const CategoryCreate = () => {
  const [formData, setFormData] = useState({
    CategoryName: "",
    Description: "",
  });

  const [errors, setErrors] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // ---------------- Check Admin ----------------
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await api.get("/api/Auth/me", { withCredentials: true });
        const user = res.data;
        if (user.loggedIn && user.role === "Admin") setIsAdmin(true);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setIsAdmin(false);
        setLoading(false);
      }
    };
    checkAdmin();
  }, []);

  // ---------------- Handle Field Change ----------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Validate on change
    if (name === "CategoryName") {
      setErrors((prev) => ({ ...prev, CategoryName: validateCategoryName(value) }));
    }
    if (name === "Description") {
      setErrors((prev) => ({ ...prev, Description: validateRequired(value) }));
    }
  };

  // ---------------- Handle Submit ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Run validations
    const nameError = validateCategoryName(formData.CategoryName);
    const descError = validateRequired(formData.Description);

    setErrors({ CategoryName: nameError, Description: descError });

    if (nameError || descError) return;

    try {
      await categoryService.createCategory(formData);
      alert("Category created successfully!");
      setFormData({ CategoryName: "", Description: "" });
      setErrors({});
    } catch (error) {
      if (error.response && error.response.status === 409) {
        alert("Category name already exists!");
      } else {
        alert("Error in category creation!");
      }
      console.error(error);
    }
  };

  if (loading)
    return <div className="container mt-5 text-center">Loading...</div>;

  if (!isAdmin)
    return (
      <div className="container mt-5 text-center">
        <h4>Only admins can create categories.</h4>
      </div>
    );

  return (
    <DashboardLayout>
      <div className="container form-container">
        <div className="mb-3 text-end">
          <Link to="/categories" className="btn btn-secondary">
            &larr; Back to Category List
          </Link>
        </div>

        <h2 className="form-title text-center">Category Creation</h2>

        <form onSubmit={handleSubmit} className="form-card">
          <div className="form-group mb-3">
            <label className="required">Category Name:</label>
            <input
              type="text"
              name="CategoryName"
              className="form-control"
              value={formData.CategoryName}
              onChange={handleChange}
              placeholder="Enter category name"
            />
            {errors.CategoryName && <p className="error">{errors.CategoryName}</p>}
          </div>

          <div className="form-group mb-3">
            <label className="required">Category Description:</label>
            <textarea
              name="Description"
              className="form-control"
              value={formData.Description}
              onChange={handleChange}
              placeholder="Enter category description"
            />
            {errors.Description && <p className="error">{errors.Description}</p>}
          </div>

          <div className="form-footer d-flex justify-content-center">
            <button type="submit" className="btn btn-primary">
              Create
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default CategoryCreate;
