import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import userService from "./userService";
import "../../styles/forms.css";
import {
  validateDOB,
  validateGender,
  validateBio,
  validateSocialLinks,
  validateProfileImage
} from "../../validation";

const ProfileCreate = () => {
  const navigate = useNavigate();
  const { userId } = useParams();

  const [profile, setProfile] = useState({
    profileId: null,
    profileImage: null,
    dateOfBirth: "",
    gender: "Male",
    bio: "",
    socialLinks: "",
  });

  const [errors, setErrors] = useState({
    profileImage: "",
    dateOfBirth: "",
    gender: "",
    bio: "",
    socialLinks: "",
  });

  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await userService.getProfileByUserId(userId);
        if (res.data) {
          const data = res.data;

          setProfile({
            profileId: data.profileId,
            profileImage: null,
            dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split("T")[0] : "",
            gender: data.gender || "Male",
            bio: data.bio || "",
            socialLinks: data.socialLinks || "",
          });

          if (data.profilePictureUrl) setPreviewImage(data.profilePictureUrl);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching profile:", error);
        setLoading(false);
      }
    };

    if (userId) fetchProfile();
  }, [userId]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    let fieldValue = value;

    if (name === "profileImage") {
      const file = files[0];
      fieldValue = file;
      setProfile({ ...profile, profileImage: file });
      if (file) setPreviewImage(URL.createObjectURL(file));
    } else {
      setProfile({ ...profile, [name]: value });
    }

    // Validate field
    let error = "";
    if (name === "profileImage") error = validateProfileImage(fieldValue);
    if (name === "dateOfBirth") error = validateDOB(fieldValue);
    if (name === "gender") error = validateGender(fieldValue);
    if (name === "bio") error = validateBio(fieldValue);
    if (name === "socialLinks") error = validateSocialLinks(fieldValue);

    setErrors({ ...errors, [name]: error });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields
    const validationResults = {
      profileImage: validateProfileImage(profile.profileImage),
      dateOfBirth: validateDOB(profile.dateOfBirth),
      gender: validateGender(profile.gender),
      bio: validateBio(profile.bio),
      socialLinks: validateSocialLinks(profile.socialLinks),
    };

    setErrors(validationResults);

    // Check for errors
    const formHasError = Object.values(validationResults).some(msg => msg !== "");
    if (formHasError) {
      alert("Please fix the errors before submitting");
      return;
    }

    // Submit form
    const formData = new FormData();
    if (profile.profileImage) formData.append("profileImage", profile.profileImage);
    formData.append("dateOfBirth", profile.dateOfBirth);
    formData.append("gender", profile.gender);
    formData.append("bio", profile.bio);
    formData.append("socialLinks", profile.socialLinks);
    formData.append("userId", userId);

    try {
      if (profile.profileId) {
        await userService.updateOrCreateProfileByUserId(userId, formData);
        alert("Profile updated successfully!");
      } else {
        await userService.updateOrCreateProfileByUserId(userId, formData);
        alert("Profile created successfully!");
      }
      navigate(`/login`);
    } catch (error) {
      console.error("Profile save error:", error);
      alert(error.response?.data || "Failed to save profile");
    }
  };

  if (loading) return <div className="container mt-5 text-center">Loading...</div>;

  return (
    <div className="container form-container">
      <h2 className="form-title">Your Profile</h2>
      <form onSubmit={handleSubmit} className="form-card" encType="multipart/form-data">
        {/* Profile Image */}
        <div className="form-group">
          <label>Profile Image:</label>
          {previewImage && (
            <div className="mb-2">
              <img src={previewImage} alt="Profile" className="profile-preview" />
            </div>
          )}
          <input
            type="file"
            className="form-control"
            name="profileImage"
            onChange={handleChange}
            onInput={handleChange}
          />
          {errors.profileImage && <p className="error">{errors.profileImage}</p>}
        </div>

        {/* Date of Birth */}
        <div className="form-group">
          <label className="required">Date of Birth:</label>
          <input
            type="date"
            className="form-control"
            name="dateOfBirth"
            value={profile.dateOfBirth}
            onChange={handleChange}
            onInput={handleChange}
          />
          {errors.dateOfBirth && <p className="error">{errors.dateOfBirth}</p>}
        </div>

        {/* Gender */}
        <div className="form-group">
          <label className="required">Gender:</label>
          <select
            className="form-control"
            name="gender"
            value={profile.gender}
            onChange={handleChange}
            onInput={handleChange}
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          {errors.gender && <p className="error">{errors.gender}</p>}
        </div>

        {/* Bio */}
        <div className="form-group">
          <label>Bio:</label>
          <textarea
            className="form-control"
            name="bio"
            rows="3"
            value={profile.bio}
            onChange={handleChange}
            onInput={handleChange}
            placeholder="Write something about yourself"
          />
          {errors.bio && <p className="error">{errors.bio}</p>}
        </div>

        {/* Social Links */}
        <div className="form-group">
          <label>Social Links:</label>
          <textarea
            className="form-control"
            name="socialLinks"
            rows="2"
            value={profile.socialLinks}
            onChange={handleChange}
            onInput={handleChange}
            placeholder="Add your social links (comma separated)"
          />
          {errors.socialLinks && <p className="error">{errors.socialLinks}</p>}
        </div>

        <div className="form-footer">
          <button type="submit" className="btn btn-primary">
            {profile.profileId ? "Update Profile" : "Create Profile"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileCreate;
