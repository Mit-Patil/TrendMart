import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import userService from "../users/userService";
import DashboardLayout from "../../components/DashboardLayout";

const BecomeSeller = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");

  const upgradeToVendor = async () => {
    try {
      const res = await userService.upgradeToVendor();

      if (res.data.success) {
        setMessage("You are now a Seller! Redirecting...");
        setTimeout(() => navigate("/"), 1500);
      } else {
        setMessage(res.data.message || "Something went wrong.");
      }
    } catch (error) {
      setMessage("Error updating role.");
    }
  };

  return (
    <DashboardLayout>
    <div className="container mt-4">
      <h2>Become a Seller</h2>
      <p>Click below to convert your Customer account into a Seller account.</p>

      <button className="btn btn-primary" onClick={upgradeToVendor}>
        Upgrade to Seller
      </button>

      {message && <p className="mt-3 alert alert-info">{message}</p>}
    </div>
    </DashboardLayout>
  );
};

export default BecomeSeller;
