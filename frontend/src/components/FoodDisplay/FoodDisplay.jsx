import React, { useContext, useMemo } from "react";
import "./FoodDisplay.css";
import { StoreContext } from "../../context/StoreContext";
import FoodItem from "../FoodItem/FoodItem";
import { formatCurrency } from "../../utils/currency";
import { calculateDistanceKm, formatDistanceLabel } from "../../utils/location";

const DEFAULT_EMPTY_MESSAGE =
  "Không tìm thấy món ăn phù hợp. Hãy thử từ khóa khác hoặc chọn chi nhánh khác.";

const FoodDisplay = ({
  category,
  heading = "Top dishes near you",
  anchorId = "food-display",
  supportingText,
  emptyMessage = DEFAULT_EMPTY_MESSAGE,
  variant = "full",
  limit,
  ctaSlot = null,
}) => {
  const {
    food_list,
    selectedBranchId,
    searchTerm,
    branches,
    setSelectedBranchId,
    userLocation,
  } = useContext(StoreContext);
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const hasBranchSelection = Boolean(selectedBranchId);
  const branchLookup = useMemo(() => {
    const map = new Map();
    branches.forEach((branch) => {
      map.set(String(branch._id), branch);
    });
    return map;
  }, [branches]);
  const selectedBranch = selectedBranchId
    ? branchLookup.get(selectedBranchId)
    : null;
  const subtitle =
    supportingText ||
    (selectedBranch
      ? `Chỉ hiển thị các món đang phục vụ tại ${selectedBranch.name}.`
      : "Hãy chọn cửa hàng gần bạn nhất để xem menu.");
  const resolvedEmptyMessage = selectedBranch
    ? emptyMessage
    : "Vui lòng chọn cửa hàng gần bạn để xem thực đơn.";

  const { filteredFoods, suggestionEntries } = useMemo(() => {
    if (!hasBranchSelection) {
      return { filteredFoods: [], suggestionEntries: [] };
    }
    const filtered = [];
    const suggestions = [];
    food_list.forEach((item) => {
      const matchesCategory = category === "all" || item.categoryId === category;
      if (!matchesCategory) return;

      const variants = item.variants || [];
      const branchVariants = variants.filter(
        (variant) => variant.branchId === selectedBranchId
      );
      const matchesSearch =
        !normalizedSearch ||
        item.name.toLowerCase().includes(normalizedSearch);

      if (branchVariants.length > 0 && matchesSearch) {
        filtered.push({ ...item, variants: branchVariants });
        return;
      }

      if (
        !branchVariants.length &&
        normalizedSearch &&
        matchesSearch &&
        variants.length > 0
      ) {
        const otherVariants = variants.filter(
          (variant) => variant.branchId && variant.branchId !== selectedBranchId
        );
        if (otherVariants.length) {
          suggestions.push({ ...item, variants: otherVariants });
        }
      }
    });
    return { filteredFoods: filtered, suggestionEntries: suggestions };
  }, [food_list, category, selectedBranchId, normalizedSearch, hasBranchSelection]);

  const summaryLimit = variant === "summary" && limit ? limit : null;
  const displayedFoods = summaryLimit
    ? filteredFoods.slice(0, summaryLimit)
    : filteredFoods;

  const suggestionsWithBranch = useMemo(() => {
    if (!normalizedSearch || suggestionEntries.length === 0) return [];
    return suggestionEntries
      .map((item) => {
        let bestVariant = null;
        let bestDistance = Infinity;
        item.variants.forEach((variant) => {
          const branch = branchLookup.get(variant.branchId);
          if (!branch) return;
          const branchCoords = {
            latitude: branch.latitude,
            longitude: branch.longitude,
          };
          const distance = calculateDistanceKm(userLocation, branchCoords);
          if (distance < bestDistance) {
            bestDistance = distance;
            bestVariant = { ...variant, branch };
          }
        });
        if (!bestVariant && item.variants.length > 0) {
          const fallbackBranch = branchLookup.get(item.variants[0].branchId);
          bestVariant = { ...item.variants[0], branch: fallbackBranch };
        }
        return {
          ...item,
          bestVariant,
          bestDistance,
        };
      })
      .filter((entry) => entry.bestVariant)
      .sort((a, b) => a.bestDistance - b.bestDistance);
  }, [branchLookup, suggestionEntries, userLocation, normalizedSearch]);

  const shouldShowSuggestions =
    hasBranchSelection &&
    variant === "full" &&
    normalizedSearch &&
    displayedFoods.length === 0 &&
    suggestionsWithBranch.length > 0;

  const handleSwitchBranch = (branchId) => {
    if (branchId) {
      setSelectedBranchId(branchId);
    }
  };

  return (
    <div className={`food-display food-display-${variant}`} id={anchorId}>
      <div className="food-display-header">
        <h2>{heading}</h2>
        {subtitle && <p className="food-display-subtitle">{subtitle}</p>}
      </div>

      {displayedFoods.length === 0 && !shouldShowSuggestions ? (
        <p className="food-display-empty">{resolvedEmptyMessage}</p>
      ) : (
        <>
          {displayedFoods.length > 0 && (
            <div className="food-display-list">
              {displayedFoods.map((item) => (
                <FoodItem key={item._id} food={item} />
              ))}
            </div>
          )}
          {ctaSlot}
        </>
      )}

      {shouldShowSuggestions && (
        <div className="food-display-suggestions">
          <h3>Gợi ý ở chi nhánh khác</h3>
          <p className="food-display-suggestions-text">
            Món ăn bạn tìm hiện chưa có tại chi nhánh này. Dưới đây là các cửa
            hàng khác đang có món tương tự (ưu tiên nơi gần bạn).
          </p>
          <div className="food-suggestion-list">
            {suggestionsWithBranch.map((entry) => {
              const variant = entry.bestVariant;
              const distanceLabel = formatDistanceLabel(entry.bestDistance);
              return (
                <div
                  key={`${entry._id}-${variant.branch?._id || variant.branchId}`}
                  className="food-suggestion-card"
                >
                  <div>
                    <p className="food-suggestion-name">{entry.name}</p>
                    <p className="food-suggestion-branch">
                      {variant.branch?.name || "Chi nhánh khác"}
                      {distanceLabel ? ` • ${distanceLabel}` : ""}
                    </p>
                    {variant.size && (
                      <p className="food-suggestion-size">{variant.size}</p>
                    )}
                  </div>
                  <div className="food-suggestion-action">
                    <span>{formatCurrency(variant.price || 0)}</span>
                    <button
                      type="button"
                      onClick={() => handleSwitchBranch(variant.branchId)}
                    >
                      Chọn chi nhánh này
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodDisplay;
