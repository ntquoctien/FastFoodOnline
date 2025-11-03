import React, { useContext, useEffect, useMemo, useState } from "react";
import "./FoodItem.css";
import { assets } from "../../assets/frontend_assets/assets";
import { StoreContext } from "../../context/StoreContext";

const FoodItem = ({ food }) => {
  const {
    cartItems,
    addToCart,
    removeFromCart,
    url,
    variantMap,
    selectedBranchId,
  } =
    useContext(StoreContext);
  const variants = food?.variants || [];

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

  const imageSrc = food.imageUrl
    ? `${url}/images/${food.imageUrl}`
    : assets.placeholder_image;

  return (
    <div className="food-item">
      <div className="food-item-img-container">
        <img src={imageSrc} alt={food.name} className="food-item-image" />
        {quantity === 0 ? (
          <img
            className="add"
            onClick={handleAdd}
            src={assets.add_icon_white}
            alt="add"
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
        {variants.length > 1 && (
          <select
            className="food-item-variant"
            value={selectedVariantId || ""}
            onChange={(event) => setSelectedVariantId(event.target.value)}
          >
            {variants.map((variant) => {
              const sizeLabel = variant.size || "Regular";
              const priceLabel = `$${variant.price.toFixed(2)}`;
              const branchLabel =
                selectedBranchId === "all" && variant.branchName
                  ? ` (${variant.branchName})`
                  : "";
              return (
                <option key={variant._id} value={variant._id}>
                  {`${sizeLabel} - ${priceLabel}${branchLabel}`}
                </option>
              );
            })}
          </select>
        )}
        <p className="food-item-price">${price.toFixed(2)}</p>
      </div>
    </div>
  );
};

export default FoodItem;
