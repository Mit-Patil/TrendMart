// validation.js (Reusable for all forms)

// 1. Required field
export const validateRequired = (value) => {
  if (!value || value.trim() === "") return "This field is required";
  return "";
};

// 2. Name validation (letters + spaces only)
export const validateName = (value) => {
  if (!value.trim()) return "This field is required";
  const regex = /^[A-Za-z\s]+$/;
  return regex.test(value) ? "" : "Only alphabets allowed";
};

// 3. Email validation
export const validateEmail = (value) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(value) ? "" : "Invalid email format";
};

// 4. Password validation
export const validatePassword = (value) => {
  if (value.length < 6)
    return "Password must be at least 6 characters long";
  return "";
};

// 5. Phone validation (10 digits)
export const validatePhone = (value) => {
  if (!value.trim()) return "This field is required";
  const regex = /^[0-9]{10}$/;
  return regex.test(value) ? "" : "Phone must be 10 digits";
};


// ================================
// NEW VALIDATIONS FOR ADDRESS FORM
// ================================

// 6. City / State (letters + spaces)
export const validateCityState = (value) => {
  if (!value.trim()) return "This field is required";
  const regex = /^[A-Za-z\s]+$/;
  return regex.test(value) ? "" : "Only alphabets allowed";
};

// 7. Address Line (min 3 chars)
export const validateAddressLine = (value) => {
  if (!value.trim()) return "This field is required";
  if (value.length < 3) return "Address must be at least 3 characters";
  return "";
};

// 8. Postal Code Validation (6 digits India)
export const validatePostalCode = (value) => {
  if (!value.trim()) return "This field is required";
  const regex = /^[1-9][0-9]{5}$/;  
  return regex.test(value) ? "" : "Invalid postal code";
};

// 9. Country (letters only)
export const validateCountry = (value) => {
  if (!value.trim()) return "This field is required";
  const regex = /^[A-Za-z\s]+$/;
  return regex.test(value) ? "" : "Invalid country name";
};


// 10. Date of Birth (required, must be past)
export const validateDOB = (value) => {
  if (!value) return "Date of Birth is required";
  const today = new Date();
  const dob = new Date(value);
  return dob >= today ? "Date of Birth must be in the past" : "";
};

// 11. Gender validation
export const validateGender = (value) => {
  return ["Male", "Female", "Other"].includes(value) ? "" : "Invalid gender";
};

// 12. Bio validation (optional, max 250 chars)
export const validateBio = (value) => {
  return value.length > 250 ? "Bio cannot exceed 250 characters" : "";
};

// 13. Social Links validation (optional, comma-separated URLs)
export const validateSocialLinks = (value) => {
  if (!value.trim()) return "";
  return "";
};

// 14. Profile Image Validation
export const validateProfileImage = (file) => {
  if (!file) return "Please Select Profile Image";

  const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
  if (!allowedTypes.includes(file.type)) return "Only JPG, JPEG, PNG files allowed";

  const maxSize = 2 * 1024 * 1024; // 2 MB
  if (file.size > maxSize) return "Image size must be less than 2 MB";

  return "";
};

// ================================
// PRODUCT VALIDATIONS
// ================================

// 15. Product Name (letters + spaces, required)
export const validateProductName = (value) => {
  if (!value.trim()) return "Product name is required";
  const regex = /^[A-Za-z0-9\s]+$/; // allow letters, numbers, spaces
  return regex.test(value) ? "" : "Invalid product name";
};

// 16. Product Description (min 3 chars, required)
export const validateProductDescription = (value) => {
  if (!value.trim()) return "Description is required";
  return value.length >= 3 ? "" : "Description must be at least 3 characters";
};

// 17. Price (required, positive number)
export const validateProductPrice = (value) => {
  if (!value.toString().trim()) return "Price is required";
  return Number(value) > 0 ? "" : "Price must be a positive number";
};

// 18. Brand (letters + spaces, required)
export const validateProductBrand = (value) => {
  if (!value.trim()) return "Brand is required";
  const regex = /^[A-Za-z\s]+$/;
  return regex.test(value) ? "" : "Invalid brand name";
};

// 19. Category (required)
export const validateProductCategory = (value) => {
  return value ? "" : "Category is required";
};


// Product variant validations

// 20. Validate Size (required, letters/numbers, max 5 chars, numeric > 0)
export const validateSize = (value) => {
  if (!value.trim()) return "Size is required";
  if (value.length > 5) return "Size must be 5 characters or less";

  const regex = /^[A-Za-z0-9]+$/;
  if (!regex.test(value)) return "Invalid size format";

  // If numeric, must be > 0
  if (!isNaN(value)) {
    const num = Number(value);
    if (num <= 0) return "Numeric size must be greater than 0";
  }

  return "";
};


// 21. Validate Color (required, letters only)
export const validateColor = (value) => {
  if (!value.trim()) return "Color is required";
  const regex = /^[A-Za-z\s]+$/;
  return regex.test(value) ? "" : "Only letters allowed";
};

// 22. Validate Stock (required, positive integer)
export const validateStock = (value) => {
  if (value === "" || value === null) return "Stock is required";
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) return "Stock must be a positive integer";
  return "";
};


// 23. Category Name Validation (letters, numbers, spaces, & - . , ')
export const validateCategoryName = (value) => {
  if (!value.trim()) return "Category name is required";
  const regex = /^[A-Za-z\s&\-\.,']+$/;
  return regex.test(value) ? "" : "Invalid characters in category name";
};
