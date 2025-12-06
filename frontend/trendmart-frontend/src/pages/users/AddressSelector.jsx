import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import userService from '../../pages/users/userService';
import "../../styles/AddressSelector.css";

const AddressSelector = ({ onAddressSelect }) => {
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSelection = useCallback((id) => {
    setSelectedAddressId(id);
    onAddressSelect(id);
  }, [onAddressSelect]);

  useEffect(() => {
  const fetchAddresses = async () => {
    setLoading(true);
    setError('');
    try {
      const authRes = await userService.getUserIdFromSession();
      const userId = authRes.data?.userId;

      if (!userId) {
        setError("User not logged in. Please login first.");
        setLoading(false);
        return;
      }

      const res = await userService.getAddressesByUserId(userId);
      const fetchedAddresses = Array.isArray(res.data) ? res.data : [];
      setAddresses(fetchedAddresses);

      if (fetchedAddresses.length > 0) {
        const defaultAddr = fetchedAddresses.find(a => a.isDefault) || fetchedAddresses[0];
        handleSelection(defaultAddr.addressId);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load addresses. " + err.message);
    } finally {
      setLoading(false);
    }
  };

  fetchAddresses();
}, [handleSelection]);


  if (loading) return <div>Loading addresses...</div>;
  if (error) return <div className="text-danger">{error}</div>;

  if (addresses.length === 0) {
    return (
      <div className="text-center p-3 border rounded bg-light">
        <p>No saved addresses found.</p>
        <button className="btn btn-primary" onClick={() => navigate('/profile/addresses/add')}>
          + Add Address
        </button>
      </div>
    );
  }

  return (
    <div className="address-selector">
      <h5>Select Shipping Address</h5>
      {addresses.map(addr => (
        <div
          key={addr.addressId}
          className={`card mb-2 p-3 ${selectedAddressId === addr.addressId ? 'border-success' : 'border-secondary'}`}
          onClick={() => handleSelection(addr.addressId)}
          style={{cursor: 'pointer'}}
        >
          <p>{addr.fullName}</p>
          <p>{addr.addressLine1}, {addr.addressLine2}</p>
          <p>{addr.city}, {addr.state} - {addr.postalCode}</p>
          <p>{addr.country}</p>
          {addr.isDefault && <span className="badge bg-info">Default</span>}
        </div>
      ))}
    </div>
  );
};

export default AddressSelector;
