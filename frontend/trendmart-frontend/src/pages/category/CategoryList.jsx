import React, { useState, useEffect } from "react";
import categoryService from "./categoryService";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";
import "../../styles/CategoryList.css";
import DashboardLayout from "../../components/DashboardLayout";

const CategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  // Check admin
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await api.get("/api/Auth/me", { withCredentials: true });
        const user = res.data;
        if (user.loggedIn && user.role === "Admin") setIsAdmin(true);
      } catch (err) {
        console.error(err);
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, []);

  // Fetch categories
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await categoryService.getAllCategory();

      if (response?.data && Array.isArray(response.data)) {
        setCategories(response.data);
      } else {
        setError("Invalid data format received");
        setCategories([]);
      }
    } catch (err) {
      console.error("Error fetching categories", err);
      setError("Failed to fetch categories");
      setCategories([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <div className="message">...Loading</div>;
  if (error) return <div className="message error">{error}</div>;
  if (categories.length === 0) return <div className="message">No categories found.</div>;

  return (
    <DashboardLayout>
    <div className="category-list-container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Category List</h2>
        {isAdmin && (
          <button
            className="btn btn-primary"
            onClick={() => navigate("/category/create")}
          >
            Add New Category
          </button>
        )}
      </div>

      <table className="category-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            {isAdmin && <th>Action</th>}
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <tr key={category.categoryId}>
              <td>{category.categoryName || "No Name"}</td>
              <td>{category.description || "No Description"}</td>
              {isAdmin && (
                <td>
                  <button
                    className="btn btn-sm btn-outline-primary me-2"
                    onClick={() =>
                      navigate(`/category/edit/${category.categoryId}`)
                    }
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={async () => {
                      if (
                        window.confirm(
                          "Are you sure you want to delete this category?"
                        )
                      ) {
                        try {
                          await categoryService.deleteCategory(category.categoryId);
                          fetchData();
                        } catch (error) {
                          alert("Cannot delete category. It may have products assigned.");
                          console.error(error);
                        }
                      }
                    }}
                  >
                    Delete
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </DashboardLayout>
  );
};

export default CategoryList;
