// src/pages/Home/Navbar.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const Navbar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authInfo, setAuthInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false); 
  const [searchQuery, setSearchQuery] = useState("");

  const loadUser = async () => {
    try {
      const meRes = await api.get("/api/Auth/me", { withCredentials: true });
      const me = meRes.data;

      if (!me || !me.loggedIn) {
        setAuthInfo({ loggedIn: false });
        setUser(null);
        setLoading(false);
        return;
      }

      setAuthInfo({
        loggedIn: true,
        userId: me.userId,
        role: me.role,
        username: me.username,
      });

      const userId = me.userId;
      let u = null;
      try {
        const userRes = await api.get(`/api/Users/${userId}`, { withCredentials: true });
        u = userRes.data;
      } catch (err) {}

      let profilePic = me.profileImageUrl || null;
      if (!profilePic) {
        try {
          const profileRes = await api.get(`/api/UserProfiles/user/${userId}`, { withCredentials: true });
          profilePic = profileRes.data?.profilePictureUrl || null;
        } catch (err) {}
      }

      setUser({
        firstName: (u && (u.firstName || u.FirstName)) || me.firstName || "",
        lastName: (u && (u.lastName || u.LastName)) || me.lastName || "",
        profilePic,
      });

      setLoading(false);
    } catch (err) {
      console.error("Navbar loadUser error:", err);
      setAuthInfo({ loggedIn: false });
      setUser(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
    const handleStorageChange = (event) => {
      if (event.key === "userUpdated") loadUser();
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const initials =
    (user?.firstName?.charAt(0) || "")?.toUpperCase() +
    (user?.lastName?.charAt(0) || "")?.toUpperCase();

  const handleProfileClick = () => {
    if (authInfo?.userId) navigate(`/users/edit/${authInfo.userId}`);
  };

  const handleLogout = async () => {
    try {
      await api.post("/api/Auth/logout", {}, { withCredentials: true });
      setAuthInfo({ loggedIn: false });
      setUser(null);
      window.location.reload(); 
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };
const handleSearch = (e) => {
  e.preventDefault();
  if (searchQuery.trim() !== "") {
    // Search by product name or brand
    navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
    setSearchQuery("");
  }
};


  return (
    <nav
      style={{
        height: "64px",
        display: "flex",
        alignItems: "center",
        padding: "0 32px",
        backgroundColor: "#111827",
        color: "white",
        justifyContent: "space-between",
        borderBottom: "1px solid #374151",
        position: "relative",
      }}
    >
      {/* Left: Logo + Brand (Home Link) */}
      <div
        style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}
        onClick={() => navigate("/")}
      >
        <span style={{ fontSize: "24px" }}>👕</span>
        <span style={{ fontSize: "20px", fontWeight: 700 }}>TrendMart</span>
      </div>

      {/* Middle: Links + Search */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <a
          style={linkStyle}
          onClick={() => navigate("/products?gender=Male")}
        >
          Shop Men
        </a>
        <a
          style={linkStyle}
          onClick={() => navigate("/products?gender=Female")}
        >
          Shop Women
        </a>

        {/* Search Form */}
        <form onSubmit={handleSearch} style={{ display: "flex", alignItems: "center" }}>
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: "6px 10px",
              borderRadius: "6px 0 0 6px",
              border: "1px solid #4b5563",
              outline: "none",
            }}
          />
          <button
            type="submit"
            style={{
              padding: "6px 12px",
              borderRadius: "0 6px 6px 0",
              border: "1px solid #4b5563",
              borderLeft: "none",
              backgroundColor: "#f97316",
              color: "white",
              cursor: "pointer",
            }}
          >
            🔍
          </button>
        </form>
      </div>

      {/* Right: Profile + Cart */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        {loading ? (
          <div style={{ color: "#ccc" }}>Checking...</div>
        ) : authInfo?.loggedIn && user ? (
          <>
        <div
          style={{
            ...userIconStyle,
            backgroundColor: user.profilePic ? "transparent" : "#f97316",
            backgroundImage: user.profilePic ? `url(${user.profilePic})` : "none",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          onClick={handleProfileClick}
          title="Go to Profile"
        >
          {!user.profilePic && initials}
        </div>


            <div style={{ position: "relative" }}>
              <div
                style={{ cursor: "pointer", fontSize: "14px", fontWeight: 500 }}
                onClick={() => setShowDropdown((prev) => !prev)}
              >
                {user.firstName} {user.lastName}
              </div>

              {showDropdown && (
                <div style={dropdownStyle}>
                  <button onClick={handleProfileClick} style={dropdownButtonStyle}>
                    Profile
                  </button>
                  <button onClick={handleLogout} style={dropdownButtonStyle}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <button style={loginButtonStyle} onClick={() => navigate("/login")}>
            Login
          </button>
        )}

        {/* Cart Icon */}
        <button style={cartButtonStyle} onClick={() => navigate("/cart")}>
          <span style={{ fontSize: "20px" }}>🛒</span>
          <span style={cartBadgeStyle}>0</span>
        </button>
      </div>
    </nav>
  );
};

// Reusable styles
const linkStyle = {
  color: "white",
  textDecoration: "none",
  padding: "8px 16px",
  borderRadius: "6px",
  cursor: "pointer",
  transition: "background-color 0.2s",
  onMouseEnter: (e) => (e.target.style.backgroundColor = "#1f2937"),
  onMouseLeave: (e) => (e.target.style.backgroundColor = "transparent"),
};

const userIconStyle = {
  width: "40px",
  height: "40px",
  borderRadius: "50%",
  backgroundColor: "#f97316",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "14px",
  fontWeight: "600",
  border: "2px solid #4b5563",
  cursor: "pointer",
};

const dropdownStyle = {
  position: "absolute",
  top: "100%",
  right: 0,
  backgroundColor: "#1f2937",
  borderRadius: "6px",
  minWidth: "140px",
  padding: "8px 0",
  zIndex: 10,
};

const dropdownButtonStyle = {
  width: "100%",
  padding: "8px 16px",
  background: "transparent",
  border: "none",
  color: "white",
  textAlign: "left",
  cursor: "pointer",
  fontSize: "14px",
  transition: "background-color 0.2s",
};

const loginButtonStyle = {
  padding: "8px 20px",
  borderRadius: "999px",
  border: "1px solid #4b5563",
  background: "transparent",
  color: "white",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "500",
};

const cartButtonStyle = {
  background: "none",
  border: "none",
  color: "white",
  cursor: "pointer",
  position: "relative",
  padding: "8px",
  borderRadius: "6px",
};

const cartBadgeStyle = {
  position: "absolute",
  top: "2px",
  right: "2px",
  backgroundColor: "#f97316",
  color: "white",
  borderRadius: "999px",
  fontSize: "10px",
  fontWeight: "700",
  minWidth: "16px",
  height: "16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 4px",
};

export default Navbar;
