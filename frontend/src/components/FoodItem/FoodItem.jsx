import React, { useContext, useEffect, useMemo, useState } from "react";
import "./FoodItem.css";
import { assets } from "../../assets/frontend_assets/assets";
import { StoreContext } from "../../context/StoreContext";
import { formatCurrency } from "../../utils/currency";

const FoodItem = ({ food }) => {
  const {
    cartItems,
    addToCart,
    removeFromCart,
    url,
    variantMap,
  } = useContext(StoreContext);
  const variants = food?.variants || [];

  const hasMultipleVariants = variants.length > 1;

  const defaultVariantId = useMemo(() => {
    if (!variants.length) return null;
    const preferred = variants.find((variant) => variant.isDefault);
    return (preferred && preferred._id) || variants[0]._id || null;
  }, [variants]);

  const [selectedVariantId, setSelectedVariantId] = useState(defaultVariantId);

  useEffect(() => {
    setSelectedVariantId(defaultVariantId);
  }, [defaultVariantId, food?._id]);

  const selectedVariant = useMemo(() => {
    if (!selectedVariantId) return null;
    return (
      variantMap[selectedVariantId] ||
      variants.find((variant) => variant._id === selectedVariantId)
    );
  }, [selectedVariantId, variantMap, variants]);

  const quantity = selectedVariantId ? cartItems[selectedVariantId] || 0 : 0;
  const price = selectedVariant?.price || 0;

  const handleAdd = () => {
    if (selectedVariantId) {
      addToCart(selectedVariantId);
    }
  };

  const handleRemove = () => {
    if (selectedVariantId) {
      removeFromCart(selectedVariantId);
    }
  };

  const resolveImage = (value) => {
    if (!value) return assets.placeholder_image;
    if (/^https?:\/\//i.test(value)) return value;
    const cleaned = String(value).replace(/^\/+/, "");
    return `${url}/images/${cleaned}`;
  };

  const imageSrc = resolveImage(food.imageUrl);

  const renderVariantSelector = () => {
    if (!hasMultipleVariants) return null;
    return (
      <select
        className="food-item-variant-select"
        value={selectedVariantId || ""}
        onChange={(event) => setSelectedVariantId(event.target.value)}
      >
        {variants.map((variant) => (
          <option key={variant._id} value={variant._id}>
            {`${variant.size || "Regular"} - ${formatCurrency(variant.price)}`}
          </option>
        ))}
      </select>
    );
  };

  return (
    <div className="food-item">
      <div className="food-item-img-container">
        <img src={imageSrc} alt={food.name} className="food-item-image" />
        {quantity === 0 ? (
          <img
            className="add"
            onClick={handleAdd}
            src={assets.add_to_cart_icon}
            alt="add to cart"
          />
        ) : (
          <div className="food-item-counter">
            <img
              onClick={handleRemove}
              src={assets.remove_icon_red}
              alt="remove"
            />
            <p>{quantity}</p>
            <img
              onClick={handleAdd}
              src={assets.add_icon_green}
              alt="add"
            />
          </div>
        )}
      </div>
      <div className="food-item-info">
        <div className="food-item-name-rating">
          <p>{food.name}</p>
          <img src={assets.rating_starts} alt="rating" />
        </div>
        <p className="food-item-desc">{food.description}</p>
        {selectedVariant?.branchName && (
          <p className="food-item-branch">
            Available at {selectedVariant.branchName}
          </p>
        )}
        {renderVariantSelector()}
        <p className="food-item-price">{formatCurrency(price)}</p>
      </div>
    </div>
  );
};

export default FoodItem;
