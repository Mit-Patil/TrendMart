import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import productService from "../product/productService";
import categoryService from "../category/categoryService";
import reviewService from "../reviews/reviewService"; 
import wishlistService from "../wishlist/wishlistService"; 
import cartService from "../cart/cartService"; 
import ReviewList from "../reviews/ReviewList";
import AddReviewForm from "../reviews/AddReviewForm";
import { FaStar, FaChevronDown, FaChevronUp, FaHeart, FaRegHeart } from 'react-icons/fa'; 
import "../../styles/ProductDetail.css"; 
import "../../styles/ReviewStyles.css";

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const productId = parseInt(id); 
    const [product, setProduct] = useState(null);
    const [category, setCategory] = useState(null);
    const [variants, setVariants] = useState([]);
    const [selectedVariant, setSelectedVariant] = useState({});
    const [loading, setLoading] = useState(true);
    
    // Review States
    const [productReviews, setProductReviews] = useState([]); 
    const [isReviewsOpen, setIsReviewsOpen] = useState(false); 
    const [isReviewFormOpen, setIsReviewFormOpen] = useState(false); 

    // ⭐ Wishlist States
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [wishlistMessage, setWishlistMessage] = useState(null); 
    
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    
    // ⭐ QUANTITY STATE ADDED
    const [quantity, setQuantity] = useState(1); 

    // Base URL for Images
    const BASE_URL = "http://localhost:5198"; 

    // --- Helper Function to Show and Clear Message ---
    const showFeedbackMessage = (message) => {
        setWishlistMessage(message);
        setTimeout(() => {
            setWishlistMessage(null);
        }, 3000); 
    };

    // --- Authentication Check ---
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

    const [mainImage, setMainImage] = useState("");
    const [allImages, setAllImages] = useState([]);


    // --- Helper Functions ---
    const getSingleImageUrl = (imageObj) => {
        const url = imageObj?.imageUrl || imageObj?.imageURL || imageObj?.ImageUrl;
        
        if (url) {
            return url.startsWith('http') ? url : `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
        }
        return "https://dummyimage.com/400x400/cccccc/000000&text=No+Image";
    };

    // --- Wishlist Handlers ---
    const checkWishlistStatus = async () => {
        if (!isLoggedIn || !product) {
            setIsInWishlist(false);
            return;
        }
        try {
            const status = await wishlistService.checkWishlistStatus(productId);
            setIsInWishlist(!!status); 
        } catch (error) {
            console.error("Failed to check wishlist status:", error);
        }
    };

    const handleToggleWishlist = async () => {
        if (!isLoggedIn) {
            showFeedbackMessage("Please log in to manage your wishlist.");
            navigate('/login');
            return;
        }
        
        const productName = product.name || product.Name;

        try {
            await wishlistService.toggleWishlist(productId);
            const newStatus = await wishlistService.checkWishlistStatus(productId);
            const isNowInWishlist = !!newStatus;

            setIsInWishlist(isNowInWishlist); 

            if (isNowInWishlist) {
                showFeedbackMessage(`"${productName}" added to Wishlist! ❤️`); 
            } else {
                showFeedbackMessage(`"${productName}" removed from Wishlist.`);
            }

        } catch (error) {
            console.error("Failed to toggle wishlist:", error);
            showFeedbackMessage("Error updating wishlist status. Please try again.");
        }
    };
    // ---------------------------------------------


    // --- Data Fetching ---
    const fetchReviews = async () => {
        try {
            const reviewsRes = await reviewService.getReviewsByProductId(id);
            setProductReviews(reviewsRes.data);
        } catch (error) {
            console.error("Error fetching reviews:", error);
        }
    };
    
    const fetchProductData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Product Data
            const productRes = await productService.getProductById(id);
            const fetchedProduct = productRes.data;
            setProduct(fetchedProduct);

            // Image handling
            const nestedImages = fetchedProduct.productImages || fetchedProduct.ProductImages || [];
            const mappedImages = nestedImages.map(img => getSingleImageUrl(img));
            setAllImages(mappedImages);
            if (mappedImages.length > 0) setMainImage(mappedImages[0]);

            // Variant handling
            const fetchedVariants = fetchedProduct.productVariants || fetchedProduct.ProductVariants || [];
            setVariants(fetchedVariants);
            if (fetchedVariants.length > 0) {
                // Initialize selected variant to the first available size and color
                const firstUniqueSize = [...new Set(fetchedVariants.map(v => v.size || v.Size))].filter(Boolean)[0];
                const firstUniqueColor = [...new Set(fetchedVariants.map(v => v.color || v.Color))].filter(Boolean)[0];
                setSelectedVariant({ size: firstUniqueSize, color: firstUniqueColor });
            }

            // Category handling
            const categoryId = fetchedProduct.categoryId || fetchedProduct.CategoryID;
            if (categoryId) {
                const catRes = await categoryService.getCategoryById(categoryId);
                setCategory(catRes.data);
            }
            
            // 2. Fetch Reviews
            await fetchReviews(); 
            
            // 3. Fetch Wishlist Status (Initial check)
            if (isLoggedIn) {
                await checkWishlistStatus();
            }

            setLoading(false);
        } catch (error) {
            console.error("Error fetching product data", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProductData();
    }, [id]);

    useEffect(() => {
        if (isLoggedIn && product) {
            checkWishlistStatus();
        }
    }, [isLoggedIn, product]); 
    // ---------------------------------------------

    // --- Review Submission Callback ---
    const handleReviewSubmitted = () => {
        fetchReviews(); // Re-fetch all reviews to update the list
        setIsReviewFormOpen(false); // Close the form after successful submission
    };
    // ---------------------------------------------


    // --- Variant & Cart Handlers ---
    const handleVariantChange = (type, value) => {
        setSelectedVariant(prev => ({ ...prev, [type]: value }));
    };
    
    const handleThumbnailClick = (imageUrl) => {
        setMainImage(imageUrl);
    };

    const handleAddToCart = async () => { 
        if (!isLoggedIn) {
            showFeedbackMessage("Please log in to add items to the cart.");
            navigate('/login');
            return;
        }

        const currentVariant = variants.find(v => 
            (v.size || v.Size) === selectedVariant.size && (v.color || v.Color) === selectedVariant.color
        );
        
        // Ensure a variant is selected
        if (!currentVariant) {
             showFeedbackMessage("Please select a size and color before adding to cart.");
             return;
        }

        const currentStock = currentVariant.stock || currentVariant.Stock || 0;

        if (currentStock < quantity) {
            showFeedbackMessage(`Selected item has insufficient stock! Max: ${currentStock}`);
            return;
        }

        try {
            // ⭐ CORE LOGIC: Must pass the VariantID (or VariantId) and quantity ⭐
            const variantId = currentVariant.variantId || currentVariant.VariantId;

            await cartService.addItemToCart(
                variantId, 
                quantity
            );

            // Success feedback
            showFeedbackMessage(`**${quantity}x** ${product.name || product.Name} added to cart!`);
            // You might want to update a global cart badge here

        } catch (error) {
            console.error("Error adding to cart:", error);
            
            const errorMessage = error.response?.data?.message || "Failed to add item to cart. Please try again.";

            if (error.response && error.response.status === 401) {
                showFeedbackMessage("Login session expired. Please log in again.");
                navigate('/login');
            } else {
                showFeedbackMessage(errorMessage);
            }
        }
    };

    const handleLoginRedirect = () => {
        navigate('/login');
    };

    // --- Calculate Average Rating ---
    const { averageRating, totalReviews } = useMemo(() => {
        if (productReviews.length === 0) {
            return { averageRating: 0, totalReviews: 0 };
        }
        const totalRating = productReviews.reduce((sum, review) => sum + (review.rating || review.Rating), 0);
        const avg = totalRating / productReviews.length;
        return { 
            averageRating: Math.round(avg * 10) / 10,
            totalReviews: productReviews.length 
        };
    }, [productReviews]);

    // --- Star Rating Display ---
    const getStarDisplay = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <FaStar 
                    key={i} 
                    color={i <= Math.round(rating) ? "#ffc107" : "#e4e5e9"} 
                    size={20} 
                    style={{ marginRight: 2 }}
                />
            );
        }
        return <div className="product-rating-stars">{stars}</div>;
    };
    
    // --- Render Logic ---
    if (loading) return <div className="loading">Loading...</div>;
    if (!product) return <div className="loading">Product not found</div>;

    const uniqueSizes = [...new Set(variants.map(v => v.size || v.Size))].filter(Boolean);
    const uniqueColors = [...new Set(variants.map(v => v.color || v.Color))].filter(Boolean);

    const currentVariant = variants.find(v => 
        (v.size || v.Size) === selectedVariant.size && (v.color || v.Color) === selectedVariant.color
    ) || {};
    const currentStock = currentVariant.stock || currentVariant.Stock || 0;
    
    return (
        <div className="product-detail-page">
            
            {/* ⭐ MESSAGE CONTAINER: Display the temporary wishlist/cart feedback */}
            {wishlistMessage && (
                <div className="wishlist-feedback-message">
                    {wishlistMessage}
                </div>
            )}
            
            <div className="product-detail-container">
                
                <div className="product-image-section">
                    {allImages.length > 1 && (
                        <div className="thumbnail-gallery">
                            {allImages.map((imageUrl, index) => (
                                <img
                                    key={index}
                                    src={imageUrl}
                                    alt={`Product thumbnail ${index + 1}`}
                                    className={`thumbnail-image ${mainImage === imageUrl ? 'active' : ''}`}
                                    onClick={() => handleThumbnailClick(imageUrl)}
                                    onError={(e) =>
                                        (e.target.src = "https://dummyimage.com/100x100/eeeeee/000000&text=No+Image")
                                    }
                                />
                            ))}
                        </div>
                    )}

                    <div className="main-image-display">
                        <img
                            src={mainImage}
                            alt={product.name || product.Name}
                            className="product-detail-image"
                            onError={(e) =>
                                (e.target.src = "https://dummyimage.com/400x400/cccccc/000000&text=No+Image")
                            }
                        />
                    </div>
                </div>

                <div className="product-detail-info">
                    <p className="product-detail-brand">{product.brand || product.Brand}</p>
                    <h2 className="product-detail-name">{product.name || product.Name}</h2>
                    
                    {/* Rating Display */}
                    <div className="product-overall-rating">
                        {getStarDisplay(averageRating)}
                        <span className="rating-text">
                            **{averageRating.toFixed(1)}** ({totalReviews} reviews)
                        </span>
                    </div>
                    
                    <div className="price-category-group">
                        <p className="product-detail-price">
                            **₹{(product.price || product.Price).toFixed(2)}**        <span className="mrp-label">(MRP incl. of all taxes)</span>
                        </p>
                        <p className="product-detail-category">
                            Category: <span>{category ? category.categoryName || category.CategoryName : "Uncategorized"}</span>
                        </p>
                    </div>
                    
                    <hr className="divider"/>

                    {/* Variant Selectors (Size and Color) */}
                    {variants.length > 0 && (
                        <div className="product-variants-section">
                            {/* Size Selector Buttons */}
                            {uniqueSizes.length > 0 && (
                                <div className="variant-group size-selector-group">
                                    <label className="variant-label">Select Size:</label>
                                    <div className="variant-options">
                                        {uniqueSizes.map(size => (
                                            <button 
                                                key={size} 
                                                className={`variant-option ${selectedVariant.size === size ? 'selected' : ''}`}
                                                onClick={() => handleVariantChange('size', size)}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Color Selector Buttons */}
                            {uniqueColors.length > 0 && (
                                <div className="variant-group color-selector-group">
                                    <label className="variant-label">Select Color:</label>
                                    <div className="variant-options">
                                        {uniqueColors.map(color => (
                                            <button 
                                                key={color} 
                                                className={`variant-option ${selectedVariant.color === color ? 'selected' : ''}`}
                                                onClick={() => handleVariantChange('color', color)}
                                            >
                                                {color}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            <p className={`product-stock ${currentStock === 0 ? 'out-of-stock' : 'in-stock'}`}>
                                **{currentStock > 0 ? 'In Stock' : 'Out of Stock!'}** {currentStock > 0 && <span> ({currentStock} available)</span>}
                            </p>
                        </div>
                    )}

                    <hr className="divider"/>

                    {/* ACTION BUTTONS SECTION (Wishlist & Add to Cart) */}
                    {isLoggedIn ? (
                        <>
                            {/* ⭐ QUANTITY SELECTOR */}
                            <div className="quantity-selector-group">
                                <label className="variant-label">Quantity:</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={quantity}
                                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="quantity-input"
                                    disabled={currentStock === 0}
                                />
                                <span className="current-stock-info">
                                    (Max {currentStock} available)
                                </span>
                            </div>
                            
                            <hr className="divider"/>
                        
                            <div className="action-buttons-group">
                                {/* Wishlist Button: Toggles the item status */}
                                <button 
                                    className={`wishlist-btn ${isInWishlist ? 'in-wishlist' : ''}`} 
                                    onClick={handleToggleWishlist}
                                    title={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
                                >
                                    {isInWishlist ? <FaHeart size={28} /> : <FaRegHeart size={28} />}
                                    {isInWishlist ? ' Remove from Wishlist' : ' Add to Wishlist'} 
                                </button>

                                {/* Add to Cart Button */}
                                <button 
                                    className="add-to-cart-btn" 
                                    onClick={handleAddToCart}
                                    disabled={currentStock === 0 || !currentVariant.variantId} // Disable if no stock or no variant selected
                                >
                                    Add to Cart 🛒
                                </button>
                            </div>
                        </>
                        ) : (
                        // Login Button: Shown if not logged in
                        <button 
                            className="login-to-buy-btn" 
                            onClick={handleLoginRedirect}
                        >
                            Login to Buy 👤
                        </button>
                        )}
                    <hr className="divider"/>


                    <h3 className="description-heading">Product Details</h3>
                    <p className="product-detail-description">
                        {product.description || product.Description}
                    </p>
                </div>
            </div>
            
            <hr className="full-width-divider"/>

            {/* Collapsible Review Section */}
            <div className="product-reviews-section">
                
                {/* 1. Review List Dropdown */}
                <div className="review-dropdown-header" onClick={() => setIsReviewsOpen(!isReviewsOpen)}>
                    <h3 className="review-heading">Customer Reviews ({totalReviews})</h3>
                    {isReviewsOpen ? <FaChevronUp /> : <FaChevronDown />}
                </div>

                {isReviewsOpen && (
                    <div className="review-dropdown-content">
                        <ReviewList 
                            productId={id} 
                            reviews={productReviews}
                            setReviews={setProductReviews}
                        />
                    </div>
                )}
                
                <hr className="small-divider"/>

                {/* 2. Add Review Form Dropdown */}
                <div className="review-dropdown-header" onClick={() => setIsReviewFormOpen(!isReviewFormOpen)}>
                    <h3 className="review-heading">
                        Write a Review {isLoggedIn ? "" : "(Login Required)"}
                    </h3>
                    {isReviewFormOpen ? <FaChevronUp /> : <FaChevronDown />}
                </div>

                {isReviewFormOpen && (
                    <div className="review-dropdown-content">
                        <AddReviewForm 
                            productId={id}
                            onReviewSubmitted={handleReviewSubmitted} 
                        />
                    </div>
                )}
            </div>
            {/* End Review Section */}

        </div>
    );
};

export default ProductDetail;