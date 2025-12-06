import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import userService from "./userService";
import "../../styles/forms.css";

import { 
  validateName, 
  validateEmail, 
  validatePassword, 
  validatePhone,
} from "../../validation";

const UserRegister = () => {
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    passwordHash: "",
    phone: "",
    role: "Customer",
  });

  // Form validation before submit
  const validateFormOnSubmit = () => {
    const newErrors = {};
    newErrors.firstName = validateName(formData.firstName);
    newErrors.lastName = validateName(formData.lastName);
    newErrors.email = validateEmail(formData.email);
    newErrors.passwordHash = validatePassword(formData.passwordHash);
    newErrors.phone = validatePhone(formData.phone);
    setErrors(newErrors);
    return Object.values(newErrors).every((err) => err === "");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    let error = "";
    if (name === "firstName") error = validateName(value);
    if (name === "lastName") error = validateName(value);
    if (name === "email") error = validateEmail(value);
    if (name === "passwordHash") error = validatePassword(value);
    if (name === "phone") error = validatePhone(value);

    setErrors({ ...errors, [name]: error });
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateFormOnSubmit()) {
      alert("Please correct the highlighted fields!");
      return;
    }

    try {
      // Check if user exists
      const res = await userService.getUserByEmail(formData.email);
      const existingUser = res.data;

      if (existingUser) {
        alert("User already exists. Proceeding to next phase.");
        navigate(`/users/address/${existingUser.userId}`);
        return;
      }

      // Register new user
      const createRes = await userService.createUser(formData);
      const userId = createRes.data?.userId;

      if (!userId) {
        alert("Error registering user!");
        return;
      }

      // ✅ Create profile using FormData
      const profileFormData = new FormData();
      profileFormData.append("userId", userId);
      profileFormData.append("profilePictureUrl", "");
      profileFormData.append("dateOfBirth", "");
      profileFormData.append("gender", "Not Specified");
      profileFormData.append("bio", "");
      profileFormData.append("socialLinks", "");

      // await userService.createProfile({
      //   userId,
      //   profilePictureUrl: "",
      //   dateOfBirth: "",
      //   gender: "Not Specified",
      //   bio: "",
      //   socialLinks: "",
      // });


      // Create default address
      // await userService.createAddress({
      //   userId,
      //   fullName: "Not Provided",
      //   phone: "0000000000",
      //   addressLine1: "Unknown",
      //   addressLine2: "",
      //   city: "Unknown",
      //   state: "Unknown",
      //   postalCode: "000000",
      //   country: "India",
      //   isDefault: true,
      // });

      // Success alert
      alert(
        `Thanks for registering in TrendMart, ${formData.firstName}! 🎉\nProceed to fill Address and Profile Details.`
      );
      navigate(`/users/address/${userId}`);
    } catch (error) {
      console.error("Registration error:", error);
      alert(
        error.response?.data?.title ||
        error.response?.data?.message ||
        "Error registering user!"
      );
    }
  };

  return (
    <div className="container form-container">
      <h2 className="form-title">User Registration</h2>
      <form onSubmit={handleSubmit} className="form-card">
        {/* First Name */}
        <div className="form-group">
          <label className="required">First Name</label>
          <input
            type="text"
            className="form-control"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="Enter first name"
          />
          {errors.firstName && <p className="error">{errors.firstName}</p>}
        </div>

        {/* Last Name */}
        <div className="form-group">
          <label className="required">Last Name</label>
          <input
            type="text"
            className="form-control"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            placeholder="Enter last name"
          />
          {errors.lastName && <p className="error">{errors.lastName}</p>}
        </div>

        {/* Email */}
        <div className="form-group">
          <label className="required">Email</label>
          <input
            type="email"
            className="form-control"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter email"
          />
          {errors.email && <p className="error">{errors.email}</p>}
        </div>

        {/* Password */}
        <div className="form-group">
          <label className="required">Password</label>
          <input
            type="password"
            className="form-control"
            name="passwordHash"
            value={formData.passwordHash}
            onChange={handleChange}
            placeholder="Enter password"
          />
          {errors.passwordHash && <p className="error">{errors.passwordHash}</p>}
        </div>

        {/* Phone */}
        <div className="form-group">
          <label>Phone</label>
          <input
            type="tel"
            className="form-control"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Enter phone"
          />
          {errors.phone && <p className="error">{errors.phone}</p>}
        </div>

        <div className="form-footer">
          <button type="submit" className="btn btn-primary">
            Register
          </button>
        </div>

        <div className="form-footer-link">
          <a href="/login">Already have an account? Sign in</a>
        </div>
      </form>
    </div>
  );
};

export default UserRegister;
