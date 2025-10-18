import React, { useContext, useEffect, useState } from "react";
import "./Add.css";
import { assets } from "../../assets/assets";
import axios from "axios";
import { toast } from "react-toastify";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";

const Add = ({ url }) => {
  const navigate = useNavigate();
  const { token, role } = useContext(StoreContext);
  const [image, setImage] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    categoryId: "",
  });
  const [categories, setCategories] = useState([]);
  const [branches, setBranches] = useState([]);
  const [variants, setVariants] = useState([
    { size: "", price: "", branchId: "", isDefault: true },
  ]);

  const fetchMeta = async () => {
    try {
      const response = await axios.get(`${url}/api/v2/menu/default`);
      if (response.data.success) {
        const { categories = [], branches = [] } = response.data.data;
        setCategories(categories);
        setBranches(branches);
        if (categories.length && !form.categoryId) {
          setForm((prev) => ({ ...prev, categoryId: categories[0]._id }));
        }
        if (branches.length) {
          setVariants((prev) =>
            prev.map((variant, index) => ({
              ...variant,
              branchId: variant.branchId || branches[0]._id,
            }))
          );
        }
      }
    } catch (error) {
      toast.error("Unable to load categories");
    }
  };

  useEffect(() => {
    if (!token || role !== "admin") {
      toast.error("Please login first");
      navigate("/");
      return;
    }
    fetchMeta();
  }, [token, role]);

  const updateForm = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const updateVariant = (index, field, value) => {
    setVariants((prev) =>
      prev.map((variant, i) =>
        i === index
          ? {
              ...variant,
              [field]: field === "price" ? value.replace(/[^0-9.]/g, "") : value,
            }
          : variant
      )
    );
  };

  const addVariantRow = () => {
    setVariants((prev) => [
      ...prev,
      {
        size: "",
        price: "",
        branchId: branches[0]?._id || "",
        isDefault: false,
      },
    ]);
  };

  const setDefaultVariant = (index) => {
    setVariants((prev) => prev.map((variant, i) => ({
      ...variant,
      isDefault: i === index,
    })));
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    const preparedVariants = variants
      .filter((variant) => variant.size && variant.price)
      .map((variant) => ({
        ...variant,
        price: Number(variant.price),
      }));

    if (!preparedVariants.length) {
      toast.error("Please add at least one variant with size and price");
      return;
    }

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("description", form.description);
    formData.append("categoryId", form.categoryId);
    if (image) {
      formData.append("image", image);
    }
    formData.append("variants", JSON.stringify(preparedVariants));

    try {
      const response = await axios.post(`${url}/api/v2/menu/foods`, formData, {
        headers: { token },
      });
      if (response.data.success) {
        toast.success("Food item created");
        setForm({ name: "", description: "", categoryId: categories[0]?._id || "" });
        setVariants([
          { size: "", price: "", branchId: branches[0]?._id || "", isDefault: true },
        ]);
        setImage(null);
      } else {
        toast.error(response.data.message || "Could not create food");
      }
    } catch (error) {
      toast.error("Unable to create food item");
    }
  };

  return (
    <div className="add">
      <form onSubmit={onSubmitHandler} className="flex-col">
        <div className="add-img-upload flex-col">
          <p>Upload image</p>
          <label htmlFor="image">
            <img
              src={image ? URL.createObjectURL(image) : assets.upload_area}
              alt="upload"
            />
          </label>
          <input
            onChange={(e) => setImage(e.target.files[0])}
            type="file"
            id="image"
            hidden
          />
        </div>
        <div className="add-product-name flex-col">
          <p>Product name</p>
          <input
            onChange={updateForm}
            value={form.name}
            type="text"
            name="name"
            placeholder="Type here"
            required
          />
        </div>
        <div className="add-product-description flex-col">
          <p>Product description</p>
          <textarea
            onChange={updateForm}
            value={form.description}
            name="description"
            rows="6"
            placeholder="Write content here"
            required
          ></textarea>
        </div>
        <div className="add-category-price">
          <div className="add-category flex-col">
            <p>Product category</p>
            <select
              name="categoryId"
              required
              onChange={updateForm}
              value={form.categoryId}
            >
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="variant-section">
          <div className="variant-header">
            <p>Variants</p>
            <button type="button" onClick={addVariantRow}>
              + Add Variant
            </button>
          </div>
          {variants.map((variant, index) => (
            <div key={index} className="variant-row">
              <input
                type="text"
                placeholder="Size"
                value={variant.size}
                onChange={(event) => updateVariant(index, "size", event.target.value)}
                required
              />
              <input
                type="number"
                placeholder="Price"
                value={variant.price}
                onChange={(event) => updateVariant(index, "price", event.target.value)}
                required
              />
              <select
                value={variant.branchId}
                onChange={(event) => updateVariant(index, "branchId", event.target.value)}
                required
              >
                {branches.map((branch) => (
                  <option key={branch._id} value={branch._id}>
                    {branch.name}
                  </option>
                ))}
              </select>
              <label className="variant-default">
                <input
                  type="radio"
                  name="defaultVariant"
                  checked={variant.isDefault}
                  onChange={() => setDefaultVariant(index)}
                />
                Default
              </label>
            </div>
          ))}
        </div>
        <button type="submit" className="add-btn">
          ADD
        </button>
      </form>
    </div>
  );
};

export default Add;
