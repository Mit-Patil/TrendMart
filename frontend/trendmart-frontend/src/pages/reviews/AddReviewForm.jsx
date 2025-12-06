// src/pages/reviews/AddReviewForm.jsx

import React, { useState, useEffect } from 'react';
import { FaStar } from 'react-icons/fa';
import reviewService from "./reviewService";
import api from "../../services/api";

/**
 * Component for submitting a new review.
 * @param {object} props
 * @param {number} productId - The ID of the product being reviewed.
 * @param {function} onReviewSubmitted - Callback function to refresh the review list.
 */
const AddReviewForm = ({ productId, onReviewSubmitted }) => {
    const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Check login status on mount
    useEffect(() => {
        const checkLogin = async () => {
            try {
                const res = await api.get("/api/Auth/me", { withCredentials: true });
                if (res.data.loggedIn) setIsLoggedIn(true);
            } catch (err) {
                setIsLoggedIn(false);
            }
        };
        checkLogin();
    }, []);

    const handleReviewChange = (e) => {
        setNewReview({ ...newReview, [e.target.name]: e.target.value });
    };

    const handleRatingChange = (ratingValue) => {
        setNewReview({ ...newReview, rating: ratingValue });
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!isLoggedIn) {
            alert("Please log in to submit a review.");
            return;
        }

        setIsSubmitting(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const payload = {
                productId: productId,
                rating: newReview.rating,
                comment: newReview.comment.trim(),
            };

            await reviewService.submitReview(payload);
            setSuccessMessage("Review submitted successfully!");
            setNewReview({ rating: 5, comment: '' }); // Clear form
            onReviewSubmitted(); // Call parent to refresh the list
        } catch (err) {
            console.error("Review submission error:", err);
            const message = err.response?.data?.message || "Failed to submit review. Check if you have already reviewed this product.";
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (!isLoggedIn) {
        return (
            <div className="alert-login-required">
                <p>Please **log in** to submit a review for this product.</p>
            </div>
        );
    }

    return (
        <div className="review-form-section">
            {error && <div className="alert error">{error}</div>}
            {successMessage && <div className="alert success">{successMessage}</div>}

            <form onSubmit={handleReviewSubmit}>
                <div className="form-group rating-selector">
                    <label>Rating:</label>
                    {[...Array(5)].map((_, i) => (
                        <FaStar
                            key={i}
                            color={i < newReview.rating ? "#ffc107" : "#e4e5e9"}
                            size={25}
                            style={{ cursor: 'pointer', margin: '0 2px' }}
                            onClick={() => handleRatingChange(i + 1)}
                        />
                    ))}
                    <input type="hidden" name="rating" value={newReview.rating} required />
                </div>
                <div className="form-group">
                    <label htmlFor="comment">Comment:</label>
                    <textarea
                        id="comment"
                        name="comment"
                        value={newReview.comment}
                        onChange={handleReviewChange}
                        rows="4"
                        placeholder="Share your thoughts on the product..."
                        required
                    />
                </div>
                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
            </form>
        </div>
    );
};

export default AddReviewForm;