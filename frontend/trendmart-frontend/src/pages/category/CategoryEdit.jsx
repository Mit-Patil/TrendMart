import React, { useState, useEffect } from "react";
import categoryService from "./categoryService";
import api from "../../services/api";
import { useParams, useNavigate } from "react-router-dom";
import "../../styles/forms.css";

// Import validations
import { validateRequired, validateCategoryName } from "../../validation";
import DashboardLayout from "../../components/DashboardLayout";

const CategoryEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [category, setCategory] = useState(null);
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

  // ---------------- Fetch category details ----------------
  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const categoryRes = await categoryService.getCategoryById(id);
        setCategory(categoryRes.data);
      } catch (error) {
        console.error("Error fetching category:", error);
      }
    };
    fetchCategory();
  }, [id]);

  // ---------------- Handle field change ----------------
  const handleCategoryChange = (e) => {
    const { name, value } = e.target;
    setCategory((prev) => ({ ...prev, [name]: value }));

    // Validate on change
    if (name === "categoryName") {
      setErrors((prev) => ({ ...prev, categoryName: validateCategoryName(value) }));
    }
    if (name === "description") {
      setErrors((prev) => ({ ...prev, description: validateRequired(value) }));
    }
  };

  // ---------------- Handle submit ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!category) return;

    // Validate all fields
    const nameError = validateCategoryName(category.categoryName || "");
    const descError = validateRequired(category.description || "");

    const newErrors = { categoryName: nameError, description: descError };
    setErrors(newErrors);

    // If any errors, stop submission
    if (nameError || descError) return;

    try {
      if (category.categoryId) {
        await categoryService.updateCategory(category.categoryId, category);
      }
      alert("Category updated successfully!");
      navigate("/categories");
    } catch (error) {
      if (error.response && error.response.status === 409) {
        alert("Category name already exists!");
      } else {
        alert("Error updating category!");
      }
      console.error(error);
    }
  };

  if (loading) return <div className="container mt-5 text-center">Loading...</div>;

  if (!isAdmin)
    return (
      <div className="container mt-5 text-center">
        <h4>Only admins can edit categories.</h4>
      </div>
    );

  if (!category) return <div className="container mt-5 text-center">Loading category...</div>;

  return (
    <DashboardLayout>
      <div className="container form-container">
        <h2 className="form-title text-center">Edit Category</h2>
        <form onSubmit={handleSubmit} className="form-card">
          <div className="form-group mb-3">
            <label className="required">Category Name:</label>
            <input
              type="text"
              name="categoryName"
              className="form-control"
              value={category.categoryName || ""}
              onChange={handleCategoryChange}
              placeholder="Enter category name"
            />
            {errors.categoryName && <p className="error">{errors.categoryName}</p>}
          </div>

          <div className="form-group mb-3">
            <label className="required">Category Description:</label>
            <textarea
              name="description"
              className="form-control"
              value={category.description || ""}
              onChange={handleCategoryChange}
              placeholder="Enter category description"
            />
            {errors.description && <p className="error">{errors.description}</p>}
          </div>

          <div className="form-footer d-flex justify-content-center">
            <button type="submit" className="btn btn-primary">
              Update
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default CategoryEdit;
