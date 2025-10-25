import axios from "axios";
import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {
  const [cartItems, setCartItems] = useState({});
  const apiBaseUrl =
    import.meta.env.VITE_API_URL || "https://food-delivery-backend-5b6g.onrender.com";
  const [token, setToken] = useState("");
  const [food_list, setFoodList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [branches, setBranches] = useState([]);
  const [variantMap, setVariantMap] = useState({});
  const [selectedBranchId, setSelectedBranchId] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

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
        setSelectedBranchId((prev) => {
          if (prev === "all") return "all";
          const stillExists = branches.some((branch) => branch._id === prev);
          return stillExists ? prev : "all";
        });
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
  };

  return (
    <StoreContext.Provider value={contextValue}>
      {props.children}
    </StoreContext.Provider>
  );
};
export default StoreContextProvider;
