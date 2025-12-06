import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/DashboardLayout.css";

const DashboardLayout = ({ children }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const verifyUser = async () => {
      try {
        const res = await api.get("/api/Auth/me", { withCredentials: true });
        if (!res.data.loggedIn) return navigate("/login");
        setUser(res.data);
      } catch {
        navigate("/login");
      }
    };
    verifyUser();
  }, [navigate]);

  if (!user) return <div>Checking login...</div>;

  // Menu based on role
  let menu = [];
 if (user.role === "Customer") {
  menu = [
    { label: "Edit Profile", path: `/users/edit/${user.userId}` },
    { label: "My Reviews", path: "/reviews" },
    { label: "Wishlist", path: "/wishlist" },
    { label: "Cart", path: "/cart" },
    { label: "Orders", path: "/orders" },

    // ⭐ Add this link
    { label: "Become a Seller", path: "/become-seller" },
  ];
}
 else if (user.role === "Vendor") {
    menu = [
      { label: "Edit Profile", path: `/users/edit/${user.userId}` },
      { label: "Create Product", path: "/product/create" },
      { label: "My Products", path: "/product/productList" },
      { label: "My Reviews", path: "/reviews" },
      { label: "Wishlist", path: "/wishlist" },
      { label: "Cart", path: "/cart" },
      { label: "Orders", path: "/orders" },
    ];
  } else if (user.role === "Admin") {
    menu = [
      { label: "Edit Profile", path: `/users/edit/${user.userId}` },
      { label: "Manage Users", path: "/users" },
      { label: "My Reviews", path: "/reviews" },
      { label: "Wishlist", path: "/wishlist" },
      { label: "Cart", path: "/cart" },
      { label: "Orders", path: "/orders" }, 
      { label: "Category List", path: "/categories" },
      { label: "Create Category", path: "/category/create" }
       ];
  }

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <ul>
          {menu.map((item, index) => (
            <li key={index}>
              <Link to={item.path}>{item.label}</Link>
            </li>
          ))}
        </ul>
      </aside>

      {/* Main Content */}
      <main className="dashboard-content">{children}</main>
    </div>
  );
};

export default DashboardLayout;
