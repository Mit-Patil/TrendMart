// src/pages/reviews/ReviewList.jsx

import React, { useState, useEffect } from 'react';
import { FaStar, FaTrashAlt } from 'react-icons/fa';
import reviewService from "./reviewService";
import api from "../../services/api";

/**
 * Component for displaying the list of product reviews.
 * @param {object} props
 * @param {number} productId - The ID of the product whose reviews are displayed.
 * @param {object[]} reviews - The array of reviews passed from the parent.
 * @param {function} setReviews - Setter function to update reviews in the parent state.
 */
const ReviewList = ({ productId, reviews, setReviews }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [userId, setUserId] = useState(null); // The authenticated user's ID
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Fetch user details for ownership check
    useEffect(() => {
        const checkLogin = async () => {
            try {
                const res = await api.get("/api/Auth/me", { withCredentials: true });
                if (res.data.loggedIn) {
                    setIsLoggedIn(true);
                    setUserId(res.data.userId || res.data.UserID);
                }
            } catch (err) {
                console.log("Not logged in.");
            }
        };
        checkLogin();
    }, []);
    
    // --- Delete Review Handler ---
    const handleDeleteReview = async (reviewId) => {
        if (!window.confirm("Are you sure you want to delete this review?")) return;

        try {
            await reviewService.deleteReview(reviewId);
            // Update the reviews state in the parent (ProductDetail)
            setReviews(prevReviews => prevReviews.filter(r => r.reviewId !== reviewId));
            alert("Review deleted successfully!");
        } catch (error) {
            const message = error.response?.data?.message || "Failed to delete review. You can only delete your own reviews.";
            alert(message);
        }
    };

    // --- JSX Helpers ---
    const getStarRating = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <FaStar
                    key={i}
                    color={i <= rating ? "#ffc107" : "#e4e5e9"}
                    size={16}
                    style={{ marginRight: 2 }}
                />
            );
        }
        return <div className="rating-stars">{stars}</div>;
    };

    if (loading) return <div className="loading">Loading reviews...</div>;
    if (error) return <div className="alert error">{error}</div>;

    if (reviews.length === 0) {
        return <p>No reviews yet for this product. Be the first to share your experience!</p>;
    }

    return (
        <div className="reviews-list">
            {reviews.map((review) => {
                const reviewId = review.reviewId || review.ReviewId;
                const reviewUserId = review.userId || review.UserId;
                const isOwner = isLoggedIn && userId === reviewUserId;

                // Safely access the nested User object and construct the name
                const reviewUser = review.User || review.user;
                const firstName = reviewUser?.FirstName || reviewUser?.firstName || '';
                const lastName = reviewUser?.LastName || reviewUser?.lastName || '';
                const userName = (firstName + ' ' + lastName).trim() || `User ${reviewUserId}`; 

                return (
                    <div key={reviewId} className="review-item">
                        <div className="review-header">
                            <span className="review-user-info">
                                **{userName}** - Reviewed on {new Date(review.reviewDate).toLocaleDateString()}
                            </span>
                            {isOwner && (
                                <button 
                                    className="delete-review-btn"
                                    onClick={() => handleDeleteReview(reviewId)}
                                    title="Delete your review"
                                >
                                    <FaTrashAlt size={14} />
                                </button>
                            )}
                        </div>
                        {getStarRating(review.rating)}
                        <p className="review-comment">{review.comment}</p>
                    </div>
                );
            })}
        </div>
    );
};

export default ReviewList;