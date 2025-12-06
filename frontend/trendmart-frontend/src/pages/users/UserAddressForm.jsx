import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import userService from "./userService";
import "../../styles/forms.css";
import api from "../../services/api";

import {
  validateName,
  validatePhone,
  validateAddressLine,
  validateCityState,
  validatePostalCode,
  validateCountry
} from "../../validation"; 


const emptyAddress = {
  addressId: null,
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
  isDefault: false,
};

const normalizeAddress = (addr) => ({
  addressId: addr.addressId ?? null,
  fullName: addr.fullName ?? "",
  phone: addr.phone ?? "",
  addressLine1: addr.addressLine1 ?? "",
  addressLine2: addr.addressLine2 ?? "",
  city: addr.city ?? "",
  state: addr.state ?? "",
  postalCode: addr.postalCode ?? "",
  country: addr.country ?? "India",
  isDefault: addr.isDefault ?? false,
});

const UserAddressForm = () => {
  const navigate = useNavigate();
  const { userId } = useParams();

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);

  // Fetch addresses
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const res = await userService.getAddressesByUserId(userId);

        if (res.data.length > 0) {
          setAddresses(res.data.map((a) => normalizeAddress(a)));
        } else {
          setAddresses([emptyAddress]);
        }
      } catch (error) {
        console.error("Error fetching addresses:", error);
        setAddresses([emptyAddress]);
      } finally {
        setLoading(false);
      }
    };

    fetchAddresses();
  }, [userId]);

  // Handle Change
  const handleChange = (index, e) => {
    const { name, value, type, checked } = e.target;
    const newAddresses = [...addresses];
    if (!newAddresses[index]) return;

    if (type === "checkbox") {
      newAddresses.forEach((addr, i) => {
        addr.isDefault = i === index ? checked : false;
      });
    } else {
      newAddresses[index][name] = value;
    }

    setAddresses(newAddresses);

    // Optional: live validate on change
    const newErrors = [...errors];
    if (!newErrors[index]) newErrors[index] = {};
    newErrors[index][name] = validateField(name, value);
    setErrors(newErrors);
  };

  const addNewAddress = () => {
    setAddresses([...addresses, { ...emptyAddress }]);
    setErrors([...errors, {}]);
  };

  // Validate single field
  const validateField = (name, value) => {
    switch(name) {
      case "fullName": return validateName(value);
      case "phone": return validatePhone(value);
      case "addressLine1": return validateAddressLine(value);
      case "city":
      case "state": return validateCityState(value);
      case "postalCode": return validatePostalCode(value);
      case "country": return validateCountry(value);
      default: return "";
    }
  };

  // Validate entire address object
  const validateAddress = (addr) => {
    return {
      fullName: validateName(addr.fullName),
      phone: validatePhone(addr.phone),
      addressLine1: validateAddressLine(addr.addressLine1),
      addressLine2: "", // optional
      city: validateCityState(addr.city),
      state: validateCityState(addr.state),
      postalCode: validatePostalCode(addr.postalCode),
      country: validateCountry(addr.country)
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationResults = addresses.map(a => validateAddress(a));
    setErrors(validationResults);

    const formHasError = validationResults.some(obj =>
      Object.values(obj).some(msg => msg !== "")
    );

    if (formHasError) {
      alert("Please fix the errors before submitting");
      return;
    }

    try {
      const cleanAddresses = addresses.map(addr => ({
        ...addr,
        addressId:
          addr.addressId === "" ||
          addr.addressId === null ||
          addr.addressId === undefined
            ? 0
            : Number(addr.addressId),
        isDefault: Boolean(addr.isDefault)
      }));

      console.log("Final PUT Body:", cleanAddresses);

      const response = await api.put(
        `/api/UserAddresses/user/${userId}`,
        cleanAddresses
      );

      console.log("Saved:", response.data);
      alert("Saved successfully!");
      navigate(`/users/profile/${userId}`);
    } catch (err) {
      console.error("Error saving addresses:", err);
      alert("Error saving address");
    }
  };

  if (loading)
    return <div className="container mt-5 text-center">Loading...</div>;

  return (
    <div className="container form-container">
      <h2 className="form-title">Address Details</h2>

      <form onSubmit={handleSubmit} className="form-card">
        {addresses.map((addr, i) => (
          <div key={i} className="address-card mb-3 p-3 border rounded">
            <h6>
              Address #{i + 1} {addr.isDefault ? "(Default)" : ""}
            </h6>

            <div className="form-group">
              <label className="required">Full Name</label>
              <input
                type="text"
                className="form-control"
                name="fullName"
                value={addr.fullName}
                onChange={(e) => handleChange(i, e)}
              />
              {errors[i]?.fullName && <p className="error">{errors[i].fullName}</p>}
            </div>

            <div className="form-group">
              <label className="required">Phone</label>
              <input
                type="text"
                className="form-control"
                name="phone"
                value={addr.phone}
                onChange={(e) => handleChange(i, e)}
              />
              {errors[i]?.phone && <p className="error">{errors[i].phone}</p>}
            </div>

            <div className="form-group">
              <label className="required">Address Line 1</label>
              <input
                type="text"
                className="form-control"
                name="addressLine1"
                value={addr.addressLine1}
                onChange={(e) => handleChange(i, e)}
              />
              {errors[i]?.addressLine1 && <p className="error">{errors[i].addressLine1}</p>}
            </div>

            <div className="form-group">
              <label>Address Line 2</label>
              <input
                type="text"
                className="form-control"
                name="addressLine2"
                value={addr.addressLine2}
                onChange={(e) => handleChange(i, e)}
              />
            </div>

            <div className="form-row">
              <div className="form-group col-md-6">
                <label className="required">City</label>
                <input
                  type="text"
                  className="form-control"
                  name="city"
                  value={addr.city}
                  onChange={(e) => handleChange(i, e)}
                />
                {errors[i]?.city && <p className="error">{errors[i].city}</p>}
              </div>

              <div className="form-group col-md-6">
                <label className="required">State</label>
                <input
                  type="text"
                  className="form-control"
                  name="state"
                  value={addr.state}
                  onChange={(e) => handleChange(i, e)}
                />
                {errors[i]?.state && <p className="error">{errors[i].state}</p>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group col-md-6">
                <label className="required">Postal Code</label>
                <input
                  type="text"
                  className="form-control"
                  name="postalCode"
                  value={addr.postalCode}
                  onChange={(e) => handleChange(i, e)}
                />
                {errors[i]?.postalCode && <p className="error">{errors[i].postalCode}</p>}
              </div>

              <div className="form-group col-md-6">
                <label>Country</label>
                <input
                  type="text"
                  className="form-control"
                  name="country"
                  value={addr.country}
                  onChange={(e) => handleChange(i, e)}
                />
                {errors[i]?.country && <p className="error">{errors[i].country}</p>}
              </div>
            </div>

            <div className="form-check mb-3">
              <input
                type="checkbox"
                className="form-check-input"
                id={`defaultCheck${i}`}
                checked={addr.isDefault}
                onChange={(e) => handleChange(i, e)}
              />
              <label htmlFor={`defaultCheck${i}`} className="form-check-label">
                Set as default
              </label>
            </div>
          </div>
        ))}

          <div className="mb-3">
            <button
              type="button"
              className="btn btn-primary btn-small"
              onClick={addNewAddress}
            >
              Add New Address
            </button>
          </div>

          <div className="form-footer">
            <button 
              type="submit" 
              className="btn btn-primary"
            >
              Save Addresses
            </button>
          </div>

      </form>
    </div>
  );
};

export default UserAddressForm;
