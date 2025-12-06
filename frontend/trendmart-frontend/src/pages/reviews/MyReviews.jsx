// src/pages/reviews/MyReviews.jsx
import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import reviewService from "./reviewService";
import "../../styles/MyReviews.css";
import { FaStar, FaTrashAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";   // << ADDED

const MyReviews = () => {
  const navigate = useNavigate(); // << ADDED

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await reviewService.getReviewsByUserId();
      setReviews(response.data || []);
    } catch (err) {
      console.error("Error fetching reviews:", err);
      if (err.response?.status === 401) {
        setError("Please log in to view your reviews.");
      } else {
        setError(err.response?.data?.message || "Failed to load reviews. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this review?")) return;

    try {
      await reviewService.deleteReview(id);
      setReviews(prev => prev.filter(r => (r.reviewId || r.ReviewId) !== id));
      alert("Review deleted!");
    } catch (err) {
      console.error("Error deleting review:", err);
      alert(err.response?.data?.message || "Error deleting review");
    }
  };

  // ⭐⭐ NEW: go to product page
  const openProduct = (productId) => {
    if (!productId) return;
    navigate(`/product/${productId}`);
  };

  // star component
  const getStarRating = (rating) => (
    <div style={{ display: "flex" }}>
      {[1,2,3,4,5].map(i => (
        <FaStar
          key={i}
          color={i <= rating ? "#ffc107" : "#e4e5e9"}
          size={18}
          style={{ marginRight: 2 }}
        />
      ))}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="dashboard-content">
        {loading && <div>Loading your reviews...</div>}
        {error && <div className="error">{error}</div>}

        {!loading && !error && reviews.length === 0 && (
          <div className="empty-reviews">You haven't written any reviews yet.</div>
        )}

        {!loading && !error && reviews.length > 0 && (
          <div className="reviews-page container my-5">
            <h2>⭐ My Product Reviews</h2>
            <hr />

            <div className="review-list">
              {reviews.map((review) => {
                const reviewId = review.reviewId || review.ReviewId;

                // ⭐ Extract product data from multiple possible structures
                const product = 
                    review.product || 
                    review.Product || 
                    review.productDetails || {};

                const productName =
                    product.name ||
                    product.Name ||
                    review.productName ||
                    "Product";

                const productId =
                    product.productId ||
                    product.ProductId ||
                    review.productId ||
                    review.ProductId ||
                    null;

                const reviewDate =
                    review.reviewDate ||
                    review.createdDate ||
                    review.CreatedAt;

                return (
                  <div
                    key={reviewId}
                    className="review-card p-3 mb-3 border rounded shadow-sm"
                    onClick={() => openProduct(productId)}  // << ADDED
                    style={{ cursor: "pointer" }}            // << ADDED
                  >
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h5 className="mb-1">{productName}</h5>
                        {getStarRating(review.rating)}
                        <p className="text-muted small mb-2">
                          Reviewed on: {reviewDate ? new Date(reviewDate).toLocaleDateString() : "N/A"}
                        </p>
                      </div>

                      <div>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={(e) => {
                            e.stopPropagation(); // << prevent product redirect on delete click
                            handleDelete(reviewId);
                          }}
                          title="Delete review"
                        >
                          <FaTrashAlt />
                        </button>
                      </div>
                    </div>

                    <p className="review-text mt-2">{review.comment}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyReviews;
