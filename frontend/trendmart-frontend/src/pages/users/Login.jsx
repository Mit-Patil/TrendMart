import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";
import "../../styles/forms.css";
import { validateEmail, validatePassword } from "../../validation";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);

  const [user, setUser] = useState(null);

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

  const handleChange = (e) => {
    const { name, value } = e.target;

    let error = "";
    if (name === "email") error = validateEmail(value);
    if (name === "password") error = value.trim() === "" ? "Password is required" : "";

    setErrors({ ...errors, [name]: error });
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    // Validate before submitting
    const newErrors = {
      email: validateEmail(formData.email),
      password: formData.password.trim() === "" ? "Password is required" : "",
    };
    setErrors(newErrors);

    const hasError = Object.values(newErrors).some((err) => err !== "");
    if (hasError) return;

    try {
      const response = await api.post(
        "/api/Auth/login",
        {
          Email: formData.email,
          Password: formData.password,
        },
        { withCredentials: true }
      );

      if (response.status === 200) {
        navigate(`/users/edit/${response.data.userId}`);
        window.location.reload();
      }
    } catch (err) {
      console.error("Login error:", err);
      setMessage({ type: "error", text: "Invalid Email or Password" });
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-title">User Login</h2>

      {message && (
        <div className={`alert ${message.type === "error" ? "alert-danger" : "alert-success"}`}>
          {message.text}
        </div>
      )}

      <form className="login-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="required">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
          />
          {errors.email && <p className="error">{errors.email}</p>}
        </div>

        <div className="form-group">
          <label className="required">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
          />
          {errors.password && <p className="error">{errors.password}</p>}
        </div>

        <button type="submit" className="btn btn-primary">Login</button>

        <div className="login-link">
          <a href="/users/register">Don’t have an account? Register Here</a>
        </div>
      </form>
    </div>
  );
};

export default Login;
