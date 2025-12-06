import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import userService from "./userService";
import api from "../../services/api"; // for auth check
import "../../styles/userlist.css";
import DashboardLayout from "../../components/DashboardLayout";

const UserDisplay = () => {
  const [users, setUsers] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  // Check if admin is logged in
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await api.get("/api/Auth/me", { withCredentials: true });
        if (!res.data.loggedIn || res.data.role !== "Admin") {
          navigate("/login");
          return;
        }
        setIsAdmin(true);
      } catch (err) {
        console.error("Auth error", err);
        navigate("/login");
      }
    };
    checkAdmin();
  }, [navigate]);

  // Fetch users, profiles, and addresses
  const fetchData = async () => {
    try {
      const userRes = await userService.getAllUsers();
      setUsers(userRes.data);

      const profileRes = await userService.getAllProfiles();
      setProfiles(profileRes.data);

      const addressRes = await Promise.all(
        userRes.data.map((u) => userService.getAddressesByUserId(u.userId))
      );
      setAddresses(addressRes.map((p) => p.data).flat());

      setLoading(false);
    } catch (err) {
      console.error("Error loading data", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin]);

  const getProfile = (userId) => profiles.find((p) => p.userId === userId) || {};
  const getAddressCount = (userId) =>
    addresses.filter((a) => a.userId === userId).length;

  if (loading)
    return <div className="loading">Loading user data...</div>;

  if (!isAdmin)
    return <div className="loading">You do not have permission to view this page.</div>;

  return (
    <DashboardLayout>
    <div className="container mt-4">
      <h2 className="mb-4 text-center">All Users</h2>

      <div className="row">
        {users.map((user) => {
          const profile = getProfile(user.userId);

          return (
            <div key={user.userId} className="col-md-4 mb-4">
              <div className="card shadow-sm user-card h-100">
                {/* Profile Image */}
                <div className="text-center p-3">
                  <img
                    src={
                      profile.profilePictureUrl ||
                      "https://via.placeholder.com/120"
                    }
                    alt="Profile"
                    className="rounded-circle profile-img"
                  />
                </div>

                <div className="card-body">
                  <h5 className="card-title text-center">
                    {user.firstName} {user.lastName}
                  </h5>
                  <p className="text-muted text-center">{user.role}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Phone:</strong> {user.phone || "N/A"}</p>

                  {profile && (
                    <>
                      <p><strong>DOB:</strong> {profile.dateOfBirth || "N/A"}</p>
                      <p><strong>Gender:</strong> {profile.gender || "N/A"}</p>
                      <p><strong>Bio:</strong> {profile.bio || "N/A"}</p>
                      <p><strong>Social Links:</strong> {profile.socialLinks || "N/A"}</p>
                    </>
                  )}

                  <p><strong>Addresses:</strong> {getAddressCount(user.userId)}</p>

                  <div className="d-flex justify-content-between mt-3">
                    <a
                      href={`/users/edit/${user.userId}`}
                      className="btn btn-primary btn-sm"
                    >
                      Edit
                    </a>
<button
  className="btn btn-danger btn-sm"
  onClick={async () => {
    if (window.confirm("Are you sure you want to delete this user completely?")) {
      try {
        await userService.deleteUserCompletely(user.userId); // ✅ single safe call
        fetchData(); // refresh list
      } catch (err) {
        console.error("Failed to delete user completely", err);
        alert("Failed to delete user completely");
      }
    }
  }}
>
  Delete
</button>



                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
    </DashboardLayout>
  );
};

export default UserDisplay;
