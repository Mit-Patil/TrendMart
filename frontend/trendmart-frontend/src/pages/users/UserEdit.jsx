import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import userService from "./userService";
import api from "../../services/api";
import "../../styles/forms.css";

import {
  validateName,
  validateEmail,
  validatePhone,
  validateDOB,
  validateGender,
  validateBio,
  validateSocialLinks,
  validateCityState,
  validateAddressLine,
  validatePostalCode,
  validateCountry,
  validateProfileImage,
} from "../../validation";

const UserEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  const [errors, setErrors] = useState({});
  const [user, setUser] = useState({
    userId: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const [profile, setProfile] = useState({
    profileId: "",
    dateOfBirth: "",
    gender: "",
    bio: "",
    socialLinks: "",
    profileImageUrl: null,
  });

  const [previewImage, setPreviewImage] = useState(null);
  const [addresses, setAddresses] = useState([]);

  // AUTH CHECK
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await api.get("/api/Auth/me", { withCredentials: true });
        const loggedInUser = res.data;

        if (!loggedInUser.loggedIn) return navigate("/login");

        if (loggedInUser.role !== "Admin" && loggedInUser.userId !== Number(id)) {
          alert("You do not have permission to edit this user");
          navigate("/");
        }
      } catch {
        navigate("/login");
      }
    };
    checkAuth();
  }, [id, navigate]);

  // FETCH USER, PROFILE, ADDRESS
  useEffect(() => {
    const load = async () => {
      try {
        const userRes = await userService.getUserById(id);
        setUser(userRes.data);

        try {
          const res = await userService.getProfileByUserId(id);
          if (res.data) {
            const data = res.data;
            setProfile({
              profileId: data.profileId,
              dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split("T")[0] : "",
              gender: data.gender || "Male",
              bio: data.bio || "",
              socialLinks: data.socialLinks || "",
              profileImageUrl: data.profilePictureUrl || null,
            });
            setPreviewImage(data.profilePictureUrl || null);
          }
        } catch {}

        try {
          const addrRes = await userService.getAddressesByUserId(id);
          setAddresses(addrRes.data.length ? addrRes.data : []);
        } catch {
          setAddresses([]);
        }

        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // HANDLERS
  const handleUserChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({ ...prev, [name]: value }));

    let error = "";
    if (name === "firstName" || name === "lastName") error = validateName(value);
    if (name === "email") error = validateEmail(value);
    if (name === "phone") error = validatePhone(value);

    setErrors({ ...errors, [name]: error });
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));

    let error = "";
    if (name === "dateOfBirth") error = validateDOB(value);
    if (name === "gender") error = validateGender(value);
    if (name === "bio") error = validateBio(value);
    if (name === "socialLinks") error = validateSocialLinks(value);

    setErrors({ ...errors, [name]: error });
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    const error = validateProfileImage(file);
    setErrors({ ...errors, profileImage: error });

    if (!error && file) setPreviewImage(file);
  };

  const handleAddressChange = (index, e) => {
    const newAddresses = [...addresses];
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      newAddresses.forEach((addr, i) => (addr.isDefault = i === index ? checked : false));
    } else {
      newAddresses[index] = { ...newAddresses[index], [name]: value };

      const addrErrors = errors.addresses ? [...errors.addresses] : [];
      if (!addrErrors[index]) addrErrors[index] = {};

      switch (name) {
        case "fullName":
          addrErrors[index][name] = validateName(value);
          break;
        case "phone":
          addrErrors[index][name] = validatePhone(value);
          break;
        case "addressLine1":
          addrErrors[index][name] = validateAddressLine(value);
          break;
        case "city":
        case "state":
          addrErrors[index][name] = validateCityState(value);
          break;
        case "postalCode":
          addrErrors[index][name] = validatePostalCode(value);
          break;
        case "country":
          addrErrors[index][name] = validateCountry(value);
          break;
        default:
          break;
      }
      setErrors({ ...errors, addresses: addrErrors });
    }

    setAddresses(newAddresses);
  };

  const addNewAddress = () => {
    setAddresses([
      ...addresses,
      {
        addressId: 0,
        fullName: "",
        phone: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "India",
        isDefault: false,
      },
    ]);
  };

  // VALIDATE ALL
  const validateAll = () => {
    const newErrors = {};

    newErrors.firstName = validateName(user.firstName);
    newErrors.lastName = validateName(user.lastName);
    newErrors.email = validateEmail(user.email);
    newErrors.phone = validatePhone(user.phone || "");

    newErrors.dateOfBirth = validateDOB(profile.dateOfBirth);
    newErrors.gender = validateGender(profile.gender);
    newErrors.bio = validateBio(profile.bio);
    newErrors.socialLinks = validateSocialLinks(profile.socialLinks);

    if (previewImage instanceof File) {
      newErrors.profileImage = validateProfileImage(previewImage);
    }

    newErrors.addresses = addresses.map((addr) => ({
      fullName: validateName(addr.fullName || ""),
      phone: validatePhone(addr.phone || ""),
      addressLine1: validateAddressLine(addr.addressLine1 || ""),
      city: validateCityState(addr.city || ""),
      state: validateCityState(addr.state || ""),
      postalCode: validatePostalCode(addr.postalCode || ""),
      country: validateCountry(addr.country || ""),
    }));

    setErrors(newErrors);

    const validUserFields = ["firstName", "lastName", "email", "phone", "dateOfBirth", "gender", "bio", "socialLinks", "profileImage"];
    const hasError = validUserFields.some((key) => newErrors[key]);
    const hasAddressError = newErrors.addresses.some((a) => Object.values(a).some((err) => err));

    return !(hasError || hasAddressError);
  };

  // SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) {
      alert("Fix validation errors before submitting");
      return;
    }

    try {
      await userService.updateUser(user.userId, user);

      const profileForm = new FormData();
      if (previewImage instanceof File) profileForm.append("profileImage", previewImage);
      profileForm.append("dateOfBirth", profile.dateOfBirth);
      profileForm.append("gender", profile.gender);
      profileForm.append("bio", profile.bio);
      profileForm.append("socialLinks", profile.socialLinks);
      profileForm.append("userId", user.userId);

      await api.put(`/api/UserProfiles/user/${user.userId}`, profileForm, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      await api.put(`/api/UserAddresses/user/${user.userId}`, addresses, { withCredentials: true });

      alert("All details updated successfully!");
      navigate("/users");
    } catch (err) {
      console.error(err);
      alert("Failed to update details. Check console.");
    }
  };

  if (loading) return <div className="container mt-5 text-center">Loading...</div>;

  return (
    <DashboardLayout>
      <div className="container mt-4 form-container">
        <div className="user-top-info d-flex align-items-center mb-4">
          <img
            src={
              previewImage instanceof File
                ? URL.createObjectURL(previewImage)
                : previewImage || "/default-profile.png"
            }
            alt="Profile"
            className="rounded-circle me-3"
            style={{ width: "80px", height: "80px", objectFit: "cover" }}
          />
          <div>
            <h5>{user.firstName} {user.lastName}</h5>
            <p>{user.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="form-card" encType="multipart/form-data">

          {/* PROFILE IMAGE */}
          <div className="form-group mb-3">
            <label>Profile Photo</label>
            <input
              type="file"
              className="form-control"
              accept="image/*"
              onChange={handleProfileImageChange}
            />
            {errors.profileImage && <p className="error">{errors.profileImage}</p>}
          </div>

          {/* USER DETAILS */}
          <h5>User Details</h5>

          <div className="form-group">
            <label>First Name</label>
            <input
              type="text"
              name="firstName"
              value={user.firstName}
              onChange={handleUserChange}
              placeholder="Enter first name"
              className="form-control"
            />
            {errors.firstName && <p className="error">{errors.firstName}</p>}
          </div>

          <div className="form-group">
            <label>Last Name</label>
            <input
              type="text"
              name="lastName"
              value={user.lastName}
              onChange={handleUserChange}
              placeholder="Enter last name"
              className="form-control"
            />
            {errors.lastName && <p className="error">{errors.lastName}</p>}
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={user.email}
              onChange={handleUserChange}
              placeholder="Enter email"
              className="form-control"
            />
            {errors.email && <p className="error">{errors.email}</p>}
          </div>

          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              name="phone"
              value={user.phone}
              onChange={handleUserChange}
              placeholder="Enter phone"
              className="form-control"
            />
            {errors.phone && <p className="error">{errors.phone}</p>}
          </div>

          {/* PROFILE DETAILS */}
          <h5 className="mt-4">Profile Details</h5>

          <div className="form-group">
            <label>Date of Birth</label>
            <input
              type="date"
              name="dateOfBirth"
              value={profile.dateOfBirth}
              onChange={handleProfileChange}
              className="form-control"
            />
            {errors.dateOfBirth && <p className="error">{errors.dateOfBirth}</p>}
          </div>

          <div className="form-group">
            <label>Gender</label>
            <select
              name="gender"
              value={profile.gender}
              onChange={handleProfileChange}
              className="form-control"
            >
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            {errors.gender && <p className="error">{errors.gender}</p>}
          </div>

          <div className="form-group">
            <label>Bio</label>
            <textarea
              name="bio"
              value={profile.bio}
              onChange={handleProfileChange}
              className="form-control"
            />
            {errors.bio && <p className="error">{errors.bio}</p>}
          </div>

          <div className="form-group">
            <label>Social Links</label>
            <input
              type="text"
              name="socialLinks"
              value={profile.socialLinks}
              onChange={handleProfileChange}
              className="form-control"
            />
            {errors.socialLinks && <p className="error">{errors.socialLinks}</p>}
          </div>

          {/* ADDRESSES */}
          <h5>Addresses</h5>
          {addresses.map((addr, i) => (
            <div key={i} className="address-card mb-3 p-3 border rounded">
              <h6>
                Address #{i + 1} {addr.isDefault ? "(Default)" : ""}
              </h6>

              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={addr.fullName || ""}
                  onChange={(e) => handleAddressChange(i, e)}
                  className="form-control"
                />
                {errors.addresses?.[i]?.fullName && (
                  <p className="error">{errors.addresses[i].fullName}</p>
                )}
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={addr.phone || ""}
                  onChange={(e) => handleAddressChange(i, e)}
                  className="form-control"
                />
                {errors.addresses?.[i]?.phone && (
                  <p className="error">{errors.addresses[i].phone}</p>
                )}
              </div>

              <div className="form-group">
                <label>Address Line 1</label>
                <input
                  type="text"
                  name="addressLine1"
                  value={addr.addressLine1 || ""}
                  onChange={(e) => handleAddressChange(i, e)}
                  className="form-control"
                />
                {errors.addresses?.[i]?.addressLine1 && (
                  <p className="error">{errors.addresses[i].addressLine1}</p>
                )}
              </div>

              <div className="form-group">
                <label>Address Line 2</label>
                <input
                  type="text"
                  name="addressLine2"
                  value={addr.addressLine2 || ""}
                  onChange={(e) => handleAddressChange(i, e)}
                  className="form-control"
                />
              </div>

              <div className="form-row">
                <div className="form-group col-md-6">
                  <label>City</label>
                  <input
                    type="text"
                    name="city"
                    value={addr.city || ""}
                    onChange={(e) => handleAddressChange(i, e)}
                    className="form-control"
                  />
                  {errors.addresses?.[i]?.city && (
                    <p className="error">{errors.addresses[i].city}</p>
                  )}
                </div>

                <div className="form-group col-md-6">
                  <label>State</label>
                  <input
                    type="text"
                    name="state"
                    value={addr.state || ""}
                    onChange={(e) => handleAddressChange(i, e)}
                    className="form-control"
                  />
                  {errors.addresses?.[i]?.state && (
                    <p className="error">{errors.addresses[i].state}</p>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group col-md-6">
                  <label>Postal Code</label>
                  <input
                    type="text"
                    name="postalCode"
                    value={addr.postalCode || ""}
                    onChange={(e) => handleAddressChange(i, e)}
                    className="form-control"
                  />
                  {errors.addresses?.[i]?.postalCode && (
                    <p className="error">{errors.addresses[i].postalCode}</p>
                  )}
                </div>

                <div className="form-group col-md-6">
                  <label>Country</label>
                  <input
                    type="text"
                    name="country"
                    value={addr.country || ""}
                    onChange={(e) => handleAddressChange(i, e)}
                    className="form-control"
                  />
                  {errors.addresses?.[i]?.country && (
                    <p className="error">{errors.addresses[i].country}</p>
                  )}
                </div>
              </div>

              <div className="form-check">
                <input
                  type="checkbox"
                  id={`defaultCheck${i}`}
                  checked={!!addr.isDefault}
                  onChange={(e) => handleAddressChange(i, e)}
                  className="form-check-input"
                />
                <label className="form-check-label" htmlFor={`defaultCheck${i}`}>
                  Is Default
                </label>
              </div>
            </div>
          ))}

          <div className="d-flex justify-content-between align-items-center mt-4 mb-2">
            <button type="button" className="btn btn-primary btn-small" onClick={addNewAddress}>
              Add New Address
            </button>
          </div>

          <div className="form-footer mt-4">
            <button type="submit" className="btn btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default UserEdit;
