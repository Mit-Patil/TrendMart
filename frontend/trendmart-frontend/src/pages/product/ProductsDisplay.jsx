// src/pages/ProductsDisplay.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import productService from "../product/productService";
import categoryService from "../category/categoryService";
import "../../styles/ProductList.css";

const ProductsDisplay = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [sizeFilter, setSizeFilter] = useState("");
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [showFilters, setShowFilters] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const BASE_URL = "http://localhost:5198";

  // -------------------- IMAGE URL --------------------
  const getImageUrl = (product) => {
    const fallback = "https://dummyimage.com/200x200/cccccc/000000&text=No+Image";
    const imgs = product.productImages || [];
    if (imgs.length > 0) {
      const url = imgs[0].imageUrl;
      return url ? (url.startsWith("http") ? url : `${BASE_URL}${url}`) : fallback;
    }
    return fallback;
  };

  // -------------------- FETCH CATEGORIES --------------------
  const fetchCategories = async () => {
    try {
      const res = await categoryService.getAllCategory();
      setCategories(res.data || []);
    } catch (err) {
      console.error("Error fetching categories", err);
    }
  };

  // -------------------- FETCH FILTERED PRODUCTS --------------------
  const fetchFilteredProducts = async (filters) => {
    setLoading(true);
    try {
      const res = await productService.getFilteredProducts(filters);
      setProducts(res.data.products || []);
    } catch (err) {
      console.error("Error fetching filtered products", err);
    } finally {
      setLoading(false);
    }
  };

  // -------------------- DEBOUNCE FOR BRAND SEARCH --------------------
  const typingTimeoutRef = useRef(null);
  const handleBrandChange = (e) => {
    const value = e.target.value;
    setBrandFilter(value);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      updateFiltersInURL({ search: value });
    }, 500);
  };

  // -------------------- URL <-> FILTER SYNC --------------------
  const updateFiltersInURL = (overrides = {}) => {
    const params = new URLSearchParams(location.search);

    params.set("category", overrides.category ?? categoryFilter);
    params.set("gender", overrides.gender ?? genderFilter);
    params.set("size", overrides.size ?? sizeFilter);
    params.set("price", overrides.price ?? priceRange[1]);
    params.set("search", overrides.search ?? brandFilter);

    // Remove empty params
    for (let key of ["category", "gender", "size", "price", "search"]) {
      if (!params.get(key)) params.delete(key);
    }

    navigate(`/products?${params.toString()}`);
  };

  // -------------------- APPLY URL QUERY TO FILTERS --------------------
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setCategoryFilter(params.get("category") || "");
    setGenderFilter(params.get("gender") || "");
    setSizeFilter(params.get("size") || "");
    setBrandFilter(params.get("search") || "");
    setPriceRange([0, Number(params.get("price") || 50000)]);
  }, [location.search]);

  // -------------------- FETCH PRODUCTS WHEN FILTERS CHANGE --------------------
  useEffect(() => {
    const filters = {
      categoryId: categoryFilter || undefined,
      gender: genderFilter || undefined,
      sizes: sizeFilter || undefined,
      search: brandFilter || undefined,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
    };
    fetchFilteredProducts(filters);
  }, [categoryFilter, genderFilter, sizeFilter, brandFilter, priceRange]);

  // -------------------- INITIAL FETCH CATEGORIES --------------------
  useEffect(() => {
    fetchCategories();
  }, []);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4">🛍️ Explore Products</h2>

      {/* Toggle Filters */}
      <div className="mb-3 text-end">
        <button
          className="btn btn-outline-secondary"
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? "Hide Filters" : "Show Filters"}
        </button>
      </div>

      {/* FILTER BAR */}
      {showFilters && (
        <div className="filter-bar p-3 mb-4 shadow-sm rounded bg-light">
          <div className="row g-3">
            {/* CATEGORY */}
            <div className="col-md-3">
              <label>Category</label>
              <select
                className="form-select"
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  updateFiltersInURL({ category: e.target.value });
                }}
              >
                <option value="">All</option>
                {categories.map((c) => (
                  <option key={c.categoryId} value={c.categoryId}>
                    {c.categoryName}
                  </option>
                ))}
              </select>
            </div>

            {/* BRAND */}
            <div className="col-md-3">
              <label>Brand</label>
              <input
                className="form-control"
                placeholder="Search brand..."
                value={brandFilter}
                onChange={handleBrandChange}
              />
            </div>

            {/* GENDER */}
            <div className="col-md-2">
              <label>Gender</label>
              <select
                className="form-select"
                value={genderFilter}
                onChange={(e) => {
                  setGenderFilter(e.target.value);
                  updateFiltersInURL({ gender: e.target.value });
                }}
              >
                <option value="">All</option>
                <option value="Men">Male</option>
                <option value="Female">Female</option>
                <option value="Unisex">Unisex</option>
              </select>
            </div>

            {/* SIZE */}
            <div className="col-md-2">
              <label>Size</label>
              <select
                className="form-select"
                value={sizeFilter}
                onChange={(e) => {
                  setSizeFilter(e.target.value);
                  updateFiltersInURL({ size: e.target.value });
                }}
              >
                <option value="">All</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
                <option value="36">36</option>
                <option value="78">78</option>
              </select>
            </div>

            {/* PRICE */}
            <div className="col-md-2">
              <label>Max Price: ₹{priceRange[1]}</label>
              <input
                type="range"
                className="form-range"
                min="0"
                max="50000"
                value={priceRange[1]}
                onChange={(e) => {
                  setPriceRange([0, Number(e.target.value)]);
                  updateFiltersInURL({ price: e.target.value });
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT GRID */}
      <div className="product-grid">
        {products.length > 0 ? (
          products.map((p) => (
            <div
              key={p.productId}
              className="product-card"
              onClick={() => navigate(`/product/${p.productId}`)}
            >
              <img
                src={getImageUrl(p)}
                className="product-image"
                onError={(e) =>
                  (e.target.src =
                    "https://dummyimage.com/200x200/cccccc/000000&text=No+Image")
                }
              />
              <div className="product-info">
                <h5>{p.name}</h5>
                <p className="text-muted small">Brand: {p.brand}</p>
                <p>
                  <strong>₹{p.price}</strong>
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center">No products found</p>
        )}
      </div>
    </div>
  );
};

export default ProductsDisplay;
