import React, { useEffect, useState } from "react";
import api from "../services/api";

const UserInfoCard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    profileImageUrl: "/default-profile.png"
  });

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        // 1️⃣ Get logged-in user
        const res = await api.get("/api/Auth/me", { withCredentials: true });
        if (!res.data.loggedIn) return;

        const userId = res.data.userId;

        // 2️⃣ Get user basic info
        const userRes = await api.get(`/api/Users/${userId}`);
        const user = userRes.data;

        // 3️⃣ Get user profile (image)
        let imageUrl = "/default-profile.png";
        try {
          const profileRes = await api.get(`/api/UserProfiles/user/${userId}`);
          if (profileRes.data?.profilePictureUrl) {
            imageUrl = profileRes.data.profilePictureUrl;
          }
        } catch {}

        setData({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          profileImageUrl: imageUrl
        });

        setLoading(false);
      } catch (error) {
        console.error("Error loading user info:", error);
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  if (loading)
    return <div className="text-center p-3">Loading profile…</div>;

  return (
    <div className="d-flex align-items-center p-3">
      <img
        src={data.profileImageUrl}
        alt="Profile"
        className="rounded-circle me-3"
        style={{ width: 60, height: 60, objectFit: "cover" }}
      />
      <div>
        <h6 className="mb-0">{data.firstName} {data.lastName}</h6>
        <small className="text-muted">{data.email}</small>
      </div>
    </div>
  );
};

export default UserInfoCard;
