import axios from "axios";
import { createContext, useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { findNearestBranch } from "../utils/location";

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {
  const [cartItems, setCartItems] = useState({});
  const apiBaseUrl =
    import.meta.env.VITE_API_URL || "http://localhost:4000";
  const [token, setToken] = useState("");
  const [food_list, setFoodList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [branches, setBranches] = useState([]);
  const [variantMap, setVariantMap] = useState({});
  const [selectedBranchId, setSelectedBranchIdState] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [userLocation, setUserLocation] = useState(null);

  const setSelectedBranchId = useCallback((branchId) => {
    setSelectedBranchIdState((prev) => {
      const next = branchId || "";
      if (typeof window !== "undefined") {
        if (next) {
          localStorage.setItem("preferredBranchId", next);
        } else {
          localStorage.removeItem("preferredBranchId");
        }
      }
      if (prev === next) {
        return prev;
      }
      return next;
    });
  }, []);

  const ensureBranchSelection = useCallback(
    (branchList = []) => {
      if (!branchList.length) {
        setSelectedBranchId("");
        return;
      }
      const branchExists = (id) =>
        !!id &&
        branchList.some((branch) => String(branch._id) === String(id));
      if (branchExists(selectedBranchId)) {
        return;
      }
      let storedId = "";
      if (typeof window !== "undefined") {
        storedId = localStorage.getItem("preferredBranchId") || "";
      }
      if (branchExists(storedId)) {
        setSelectedBranchId(storedId);
      } else {
        setSelectedBranchId("");
      }
    },
    [selectedBranchId, setSelectedBranchId]
  );

  const addToCart = async (variantId) => {
    if (!variantMap[variantId]) {
      toast.error("Food variant does not exist");
      return;
    }
    setCartItems((prev) => ({
      ...prev,
      [variantId]: (prev[variantId] || 0) + 1,
    }));
    if (token) {
      try {
        const response = await axios.post(
          `${apiBaseUrl}/api/cart/add`,
          { itemId: variantId },
          { headers: { token } }
        );
        if (!response.data.success) {
          toast.error(response.data.message || "Unable to add to cart");
        }
      } catch (error) {
        toast.error("Unable to reach server");
      }
    }
  };

  const removeFromCart = async (variantId) => {
    setCartItems((prev) => {
      const next = { ...prev };
      if (next[variantId] > 1) {
        next[variantId] -= 1;
      } else {
        delete next[variantId];
      }
      return next;
    });
    if (token) {
      try {
        const response = await axios.post(
          `${apiBaseUrl}/api/cart/remove`,
          { itemId: variantId },
          { headers: { token } }
        );
        if (!response.data.success) {
          toast.error(response.data.message || "Unable to update cart");
        }
      } catch (error) {
        toast.error("Unable to reach server");
      }
    }
  };

  const getTotalCartAmount = () => {
    let total = 0;
    Object.entries(cartItems).forEach(([variantId, qty]) => {
      if (qty > 0) {
        const variant = variantMap[variantId];
        if (variant) {
          total += variant.price * qty;
        }
      }
    });
    return total;
  };

  const fetchFoodList = async () => {
    try {
      const response = await axios.get(`${apiBaseUrl}/api/v2/menu/default`);
      if (response.data.success) {
        const { foods = [], categories = [], branches = [] } = response.data.data;
        setFoodList(foods);
        setCategories(categories);
        setBranches(branches);
        ensureBranchSelection(branches);
        const map = {};
        foods.forEach((food) => {
          (food.variants || []).forEach((variant) => {
            map[variant._id] = {
              ...variant,
              foodId: food._id,
              foodName: food.name,
              foodDescription: food.description,
              foodImage: food.imageUrl,
              categoryId: food.categoryId,
              categoryName: food.categoryName,
            };
          });
        });
        setVariantMap(map);
      } else {
        toast.error("Could not load menu data");
      }
    } catch (error) {
      toast.error("Unable to reach server");
    }
  };

  const loadCardData = async (authToken) => {
    const response = await axios.post(
      `${apiBaseUrl}/api/cart/get`,
      {},
      { headers: { token: authToken } }
    );
    setCartItems(response.data.cartData || {});
  };

  useEffect(() => {
    setCartItems((prev) => {
      if (!Object.keys(variantMap).length) return prev;
      const next = {};
      Object.entries(prev).forEach(([variantId, qty]) => {
        if (variantMap[variantId]) {
          next[variantId] = qty;
        }
      });
      return next;
    });
  }, [variantMap]);

  useEffect(() => {
    if (!branches.length) return;
    if (selectedBranchId) return;
    let cancelled = false;
    const firstBranch = branches[0];
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      if (firstBranch) {
        setSelectedBranchId(firstBranch._id);
      }
      return () => {};
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (cancelled) return;
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setUserLocation(coords);
        const nearest = findNearestBranch(branches, coords);
        if (nearest?.branch?._id) {
          setSelectedBranchId(nearest.branch._id);
        } else if (firstBranch) {
          setSelectedBranchId(firstBranch._id);
        }
      },
      () => {
        if (!cancelled && firstBranch) {
          setSelectedBranchId(firstBranch._id);
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
    );
    return () => {
      cancelled = true;
    };
  }, [branches, selectedBranchId, setSelectedBranchId]);

  useEffect(() => {
    async function loadData() {
      await fetchFoodList();
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        setToken(storedToken);
        await loadCardData(storedToken);
      }
    }
    loadData();
  }, []);

  const locateNearestBranch = useCallback(() => {
    if (!branches.length) {
      toast.error("Hiện chưa có cửa hàng nào khả dụng");
      return Promise.reject(new Error("No branches available"));
    }
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("Thiết bị của bạn không hỗ trợ định vị");
      return Promise.reject(new Error("Geolocation unsupported"));
    }
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setUserLocation(coords);
          const nearest = findNearestBranch(branches, coords);
          if (nearest?.branch?._id) {
            setSelectedBranchId(nearest.branch._id);
            resolve(nearest);
          } else {
            toast.error("Không tìm thấy cửa hàng phù hợp");
            reject(new Error("No nearest branch"));
          }
        },
        (error) => {
          toast.error("Không thể xác định vị trí của bạn");
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 15000 }
      );
    });
  }, [branches, setSelectedBranchId]);

  const contextValue = {
    food_list,
    categories,
    branches,
    cartItems,
    setCartItems,
    addToCart,
    removeFromCart,
    getTotalCartAmount,
    url: apiBaseUrl,
    token,
    setToken,
    variantMap,
    selectedBranchId,
    setSelectedBranchId,
    searchTerm,
    setSearchTerm,
    userLocation,
    locateNearestBranch,
  };

  return (
    <StoreContext.Provider value={contextValue}>
      {props.children}
    </StoreContext.Provider>
  );
};
export default StoreContextProvider;
