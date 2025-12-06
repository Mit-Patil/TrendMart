// ProductEdit.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import productService from "./productService";
import categoryService from "../category/categoryService";
import api from "../../services/api";
import "../../styles/forms.css";
import DashboardLayout from "../../components/DashboardLayout";

// ---------------- VALIDATIONS ----------------
import {
  validateProductName,
  validateProductDescription,
  validateProductPrice,
  validateProductBrand,
  validateProductCategory,
  validateSize,
  validateColor,
  validateStock,
  validateProfileImage,
} from "../../validation";

const ProductEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [variants, setVariants] = useState([]);

  const [errors, setErrors] = useState({});
  const [variantErrors, setVariantErrors] = useState([]);
  const [imageErrors, setImageErrors] = useState("");

  // ---------------- NORMALIZE ----------------
  const normalizeProduct = (p) => p ? {
    productId: p.productId ?? p.productID ?? p.ProductID ?? p.ProductId,
    name: p.name ?? p.Name,
    description: p.description ?? p.Description,
    price: p.price ?? p.Price,
    brand: p.brand ?? p.Brand,
    categoryId: p.categoryId ?? p.categoryID ?? p.CategoryID ?? p.CategoryId,
    sellerId: p.sellerId ?? p.sellerID ?? p.SellerID ?? p.SellerId,
    raw: p,
  } : null;

  const normalizeImage = (img) => img ? {
    imageId: img.imageId ?? img.imageID ?? img.ImageID ?? img.ImageId ?? Math.random(),
    imageUrl: img.imageUrl ?? img.imageURL ?? img.ImageURL ?? img.ImageUrl ?? "/default-product.png",
    raw: img,
  } : null;

  const normalizeVariant = (v) => v ? {
    variantId: v.variantId ?? v.variantID ?? v.VariantID ?? v.VariantId,
    productId: v.productId ?? v.productID ?? v.ProductId ?? v.ProductID,
    size: v.size ?? v.Size ?? "",
    color: v.color ?? v.Color ?? "",
    stock: v.stock ?? v.Stock ?? 0,
    gender: v.gender ?? v.Gender ?? "Unisex",
    raw: v,
  } : null;

  // ---------------- LOAD DATA ----------------
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const userRes = await api.get("/api/Auth/me", { withCredentials: true });
        if (!userRes.data?.loggedIn) {
          alert("Please login");
          navigate("/login");
          return;
        }
        if (userRes.data.role !== "Vendor") {
          navigate("/products");
          return;
        }
        setUser(userRes.data);

        const vendorProductsRes = await productService.getVendorProducts(userRes.data.userId);
        const found = (vendorProductsRes.data || []).find(
          (p) => (p.productId ?? p.productID ?? p.ProductID) === parseInt(id, 10)
        );
        if (!found) {
          alert("Product not found or you do not have permission to edit it.");
          navigate("/product/productList");
          return;
        }

        const normalized = normalizeProduct(found);
        setProduct(normalized);

        await productService.setProductIdInSession(normalized.productId);

        const [catRes, imgsRes, varRes] = await Promise.all([
          categoryService.getAllCategory(),
          productService.getImagesByProductId(normalized.productId).catch(() => ({ data: [] })),
          productService.getVariantsByProductId(normalized.productId).catch(() => ({ data: [] })),
        ]);

        setCategories(catRes.data || []);
        setImages((imgsRes.data || []).map(normalizeImage));
        const normVariants = (varRes.data || []).map(normalizeVariant);
        setVariants(normVariants);
        setVariantErrors(normVariants.map(() => ({ size: "", color: "", stock: "" })));

        setLoading(false);
      } catch (err) {
        console.error("Load error:", err);
        alert("Error loading product/edit data");
        setLoading(false);
      }
    };

    load();
  }, [id, navigate]);

  // ---------------- PRODUCT HANDLERS ----------------
  const handleProductFieldChange = (e) => {
    const { name, value } = e.target;
    setProduct(prev => ({ ...prev, [name]: value }));

    let err = "";
    if (name === "name") err = validateProductName(value);
    if (name === "description") err = validateProductDescription(value);
    if (name === "price") err = validateProductPrice(value);
    if (name === "brand") err = validateProductBrand(value);
    if (name === "categoryId") err = validateProductCategory(value);

    setErrors(prev => ({ ...prev, [name]: err }));
  };

  const handleProductSave = async (e) => {
    e.preventDefault();
    const nameErr = validateProductName(product.name);
    const descErr = validateProductDescription(product.description);
    const priceErr = validateProductPrice(product.price);
    const brandErr = validateProductBrand(product.brand);
    const categoryErr = validateProductCategory(product.categoryId);
    setErrors({ name: nameErr, description: descErr, price: priceErr, brand: brandErr, categoryId: categoryErr });

    if ([nameErr, descErr, priceErr, brandErr, categoryErr].some(x => x !== "")) return;

    try {
      const payload = {
        ProductId: product.productId,
        Name: product.name,
        Description: product.description,
        Price: Number(product.price),
        Brand: product.brand,
        CategoryId: Number(product.categoryId),
        SellerId: product.sellerId,
      };
      await productService.updateProduct(product.productId, payload);
      alert("Product info updated successfully!");
    } catch (err) {
      console.error("Update product error:", err);
      alert(`Error updating product: ${err.response?.data?.message || err.message}`);
    }
  };

  // ---------------- IMAGE HANDLERS ----------------
  const handleSelectFiles = (e) => {
    const files = Array.from(e.target.files || []);
    for (let f of files) {
      const msg = validateProfileImage(f);
      if (msg) {
        setImageErrors(msg);
        e.target.value = null;
        setNewFiles([]);
        return;
      }
    }
    setImageErrors("");
    setNewFiles(files);
  };

  const uploadNewImages = async () => {
    if (!newFiles.length) {
      setImageErrors("Please choose images first");
      return;
    }
    if (!product) return;
    try {
      for (const file of newFiles) {
        const fd = new FormData();
        fd.append("ImageFile", file);
        await productService.uploadProductImage(fd);
      }
      const imgsRes = await productService.getImagesByProductId(product.productId);
      setImages((imgsRes.data || []).map(normalizeImage));
      setNewFiles([]);
      setImageErrors("");
      document.getElementById("image-upload-input").value = null;
      alert("Images uploaded successfully!");
    } catch (err) {
      console.error(err);
      setImageErrors("Upload failed");
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm("Delete this image?")) return;
    try {
      await productService.deleteProductImage(imageId);
      setImages(prev => prev.filter(i => i.imageId !== imageId));
      alert("Image deleted successfully!");
    } catch (err) {
      console.error(err);
      alert("Error deleting image");
    }
  };

  // ---------------- VARIANT HANDLERS ----------------
  const handleVariantFieldChange = (idx, e) => {
    const { name, value } = e.target;
    setVariants(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [name]: value };
      return copy;
    });

    setVariantErrors(prev => {
      const copy = [...prev];
      let err = "";
      if (name === "size") err = validateSize(value);
      if (name === "color") err = validateColor(value);
      if (name === "stock") err = validateStock(value);
      copy[idx] = { ...copy[idx], [name]: err };
      return copy;
    });
  };

  const addVariantRow = () => {
    if (!product) return;
    setVariants(prev => [...prev, { variantId: null, productId: product.productId, size: "", color: "", stock: 0, gender: "Unisex" }]);
    setVariantErrors(prev => [...prev, { size: "", color: "", stock: "" }]);
  };

  const removeNewVariant = (idx) => {
    setVariants(prev => prev.filter((_, i) => i !== idx));
    setVariantErrors(prev => prev.filter((_, i) => i !== idx));
  };

  const saveVariants = async () => {
    const newErrors = variants.map(v => ({
      size: validateSize(v.size),
      color: validateColor(v.color),
      stock: validateStock(v.stock),
    }));
    setVariantErrors(newErrors);
    if (newErrors.some(v => v.size || v.color || v.stock)) return;

    try {
      await Promise.all(
        variants.map(v => {
          const payload = {
            ...(v.variantId ? { VariantId: v.variantId } : {}),
            ProductId: Number(product.productId),
            Size: v.size.trim(),
            Color: v.color.trim(),
            Stock: Number(v.stock) || 0,
            Gender: ["Unisex", "Men", "Women"].includes(v.gender) ? v.gender : "Unisex",
          };

          return v.variantId
            ? productService.updateProductVariant(v.variantId, payload)
            : productService.addProductVariant(payload);
        })
      );

      const varRes = await productService.getVariantsByProductId(product.productId);
      setVariants((varRes.data || []).map(normalizeVariant));
      setVariantErrors((varRes.data || []).map(() => ({ size: "", color: "", stock: "" })));
      alert("Variants saved successfully!");
    } catch (err) {
      console.error("Error saving variants:", err.response?.data || err);
      alert("Error saving variants: see console for details");
    }
  };

  const deleteVariant = async (variantId) => {
    if (!window.confirm("Delete this variant?")) return;
    try {
      await productService.deleteProductVariant(variantId);
      setVariants(prev => prev.filter(v => v.variantId !== variantId));
      alert("Variant deleted successfully!");
    } catch (err) {
      console.error(err);
      alert("Error deleting variant");
    }
  };

  // ---------------- RENDER ----------------
  if (loading) return <div className="container mt-5 text-center">Loading...</div>;
  if (!product) return <div className="container mt-5 text-center">Product not found or no permission.</div>;

  return (
    <DashboardLayout>
      <div className="container mt-4 form-container">
        <h2 className="form-title">Edit Product — {product.name}</h2>

        {/* PRODUCT INFO */}
        <form onSubmit={handleProductSave} className="form-card mb-4">
          <div className="form-group">
            <label className="required">Name</label>
            <input name="name" className="form-control" value={product.name || ""} onChange={handleProductFieldChange} />
            {errors.name && <p className="error">{errors.name}</p>}
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea name="description" className="form-control" value={product.description || ""} onChange={handleProductFieldChange} rows={2} />
            {errors.description && <p className="error">{errors.description}</p>}
          </div>

          <div className="form-group">
            <label className="required">Price</label>
            <input type="number" name="price" className="form-control" value={product.price || ""} onChange={handleProductFieldChange} />
            {errors.price && <p className="error">{errors.price}</p>}
          </div>

          <div className="form-group">
            <label>Brand</label>
            <input name="brand" className="form-control" value={product.brand || ""} onChange={handleProductFieldChange} />
            {errors.brand && <p className="error">{errors.brand}</p>}
          </div>

          <div className="form-group">
            <label className="required">Category</label>
            <select name="categoryId" className="form-control" value={product.categoryId || ""} onChange={handleProductFieldChange}>
              <option value="">-- Select --</option>
              {categories.map(c => (
                <option key={c.categoryId ?? c.CategoryID} value={c.categoryId ?? c.CategoryID}>
                  {c.categoryName ?? c.CategoryName}
                </option>
              ))}
            </select>
            {errors.categoryId && <p className="error">{errors.categoryId}</p>}
          </div>

          <button type="submit" className="btn btn-primary">Save Product Info</button>
        </form>

        {/* IMAGES */}
        <div className="form-card mb-4">
          <h5>Images</h5>
          <div className="d-flex flex-wrap gap-3 mb-2">
            {images.length > 0 ? images.map(img => (
              <div key={img.imageId} className="image-preview-card">
                <img src={img.imageUrl} alt="prod" style={{ width: 100, height: 100, objectFit: "cover" }} />
                <button type="button" className="delete-btn" onClick={() => handleDeleteImage(img.imageId)}>Delete</button>
              </div>
            )) : <p>No images uploaded yet.</p>}
          </div>
          <input id="image-upload-input" type="file" multiple onChange={handleSelectFiles} />
          {imageErrors && <p className="error">{imageErrors}</p>}
          <button type="button" className="btn btn-primary" onClick={uploadNewImages} disabled={newFiles.length === 0}>
            Upload {newFiles.length} Selected Images
          </button>
        </div>

        {/* VARIANTS */}
        <div className="form-card mb-4">
          <h5>Variants</h5>
          {variants.length === 0 && <p>No variants yet.</p>}

          {variants.map((v, idx) => (
            <div key={v.variantId ?? `new-${idx}`} className="d-flex align-items-center gap-2 mb-2 p-2 border rounded">
              <input name="size" placeholder="Size" value={v.size || ""} onChange={(e) => handleVariantFieldChange(idx, e)} className="form-control form-control-sm" style={{ width: 100 }} />
              {variantErrors[idx]?.size && <p className="error">{variantErrors[idx].size}</p>}

              <input name="color" placeholder="Color" value={v.color || ""} onChange={(e) => handleVariantFieldChange(idx, e)} className="form-control form-control-sm" style={{ width: 120 }} />
              {variantErrors[idx]?.color && <p className="error">{variantErrors[idx].color}</p>}

              <input type="number" name="stock" placeholder="Stock" value={v.stock ?? 0} onChange={(e) => handleVariantFieldChange(idx, e)} className="form-control form-control-sm" style={{ width: 80 }} />
              {variantErrors[idx]?.stock && <p className="error">{variantErrors[idx].stock}</p>}

              <select name="gender" value={v.gender || "Unisex"} onChange={(e) => handleVariantFieldChange(idx, e)} className="form-select form-select-sm" style={{ width: 100 }}>
                <option value="Unisex">Unisex</option>
                <option value="Men">Men</option>
                <option value="Women">Women</option>
              </select>

              {v.variantId ? (
                <button type="button" className="btn btn-small btn-danger ms-auto" onClick={() => deleteVariant(v.variantId)}>Delete</button>
              ) : (
                <button type="button" className="btn btn-small btn-warning ms-auto" onClick={() => removeNewVariant(idx)}>Delete</button>
              )}
            </div>
          ))}

          <div className="mt-3 d-flex gap-2">
            <button type="button" className="btn btn-small btn-primary" onClick={addVariantRow}>Add Variant</button>
            <button type="button" className="btn btn-small btn-primary" onClick={saveVariants}>Save All Variants</button>
          </div>
        </div>

        <Link to="/product/productList" className="link-button mt-3">Back to Products</Link>
      </div>
    </DashboardLayout>
  );
};

export default ProductEdit;
