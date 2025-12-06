import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import React, { useEffect, useState } from "react";
import api from "./services/api";

import UserRegister from "./pages/users/UserRegister";
import UserAddressForm from "./pages/users/UserAddressForm";
import UserDisplay from "./pages/users/UserDisplay";
import UserEdit from "./pages/users/UserEdit";
import Login from "./pages/users/Login";
import HomePage from "./pages/Home/HomePage";
import ProfileCreate from "./pages/users/ProfileCreate";


// Import product_category pages
import CategoryList from "./pages/category/CategoryList";
import CategoryCreate from "./pages/category/CategoryCreate";
import CategoryEdit from "./pages/category/CategoryEdit";

// Import product pages
import ProductList from "./pages/product/ProductList";
import ProductCreate from "./pages/product/ProductCreate";
import ProductEdit from "./pages/product/ProductEdit";
import ProductImageAdd from "./pages/product/ProductImageAdd";
import UserProductList from "./pages/product/UserProductList";
import ProductDetail from "./pages/product/ProductDetail";
import ProductVariantsAdd from "./pages/product/ProductVariantsAdd";


import CartDisplay from "./pages/cart/CartDisplay";
import OrderDetailPage from "./pages/order_payment/OrderDetailPage";
import CheckoutPage from "./pages/order_payment/CheckoutPage";
import OrderHistoryPage from "./pages/order_payment/OrderHistoryPage";

import MyReviews from "./pages/reviews/MyReviews";

import Navbar from "./pages/Home/Navbar";
import Wishlist from "./pages/wishlist/Wishlist";
import ProductsDisplay from "./pages/product/ProductsDisplay";
import BecomeSeller from "./pages/users/BecomeSeller";
function App() {
  const [user, setUser] = useState(null);

useEffect(() => {
  const fetchUser = async () => {
    try {
      const res = await api.get("/api/Auth/me", { withCredentials: true });

      if (res.data.loggedIn) {
        setUser({
          firstName: res.data.firstName || "",
          lastName: res.data.lastName || "",
          profilePic: res.data.profilePic || null,
          userId: res.data.userId,
          email: res.data.username
        });
      }
    } catch (err) {
      setUser(null);
    }
  };
  fetchUser();
}, []);


  return (
    <Router>

        {/*Top Header bar*/}
          <Navbar user={user} cartCount={0} />
      <Routes>
        {/* HomePage */}
        <Route path="/" element={<HomePage />} />

        {/* Users */}
        <Route path="/users" element={<UserDisplay />} />
        <Route path="/users/register" element={<UserRegister />} />
        <Route path="/users/address/:userId" element={<UserAddressForm />} />
        <Route path="/users/edit/:id" element={<UserEdit />} />
        <Route path="/users/profile/:userId" element={<ProfileCreate />} />


        {/* Product Categories */}
        <Route path="/categories" element={<CategoryList />} />
        <Route path="/category/create" element={<CategoryCreate />} />
        <Route path="/category/edit/:id" element={<CategoryEdit />} />

        {/* Products */}
        <Route path="/product/productList" element={<ProductList />} />
        <Route path="/product/create" element={<ProductCreate />} />
        <Route path="/product/edit/:id" element={<ProductEdit />} />
        <Route path="/product/imgAdd" element={<ProductImageAdd />} />
        {/* <Route path="/products" element={<UserProductList />} /> */}
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/product/ProductVariantsAdd" element={<ProductVariantsAdd />} />

        {/*carts */}
        <Route path="/cart" element={<CartDisplay />} />
        <Route path="/orders/:orderId" element={<OrderDetailPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/orders" element={<OrderHistoryPage />} />



          <Route path="/reviews" element={<MyReviews />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/products" element={<ProductsDisplay />} />

          <Route path="/become-seller" element={<BecomeSeller />} />


        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
