import logo from "./logo.png";
import upload_area from "./upload_area.png";
import chevron_right from "./right-arrow.png";

import iconAdd from "./Icon/add.png";
import iconAdmins from "./Icon/admins.png";
import iconCategories from "./Icon/categories.png";
import iconCustomers from "./Icon/customers.png";
import iconInventory from "./Icon/inventory.png";
import iconListItem from "./Icon/list-item.png";
import iconOrders from "./Icon/orders.png";
import iconProfile from "./Icon/profile.png";
import iconRestaurant from "./Icon/restaurant.png";
import iconShippers from "./Icon/shippers.png";
import iconStaffs from "./Icon/staffs.png";

export const assets = {
  logo,
  upload_area,
  chevron_right,
  profile_image: iconProfile,
  navIcons: {
    add: iconAdd,
    admins: iconAdmins,
    categories: iconCategories,
    customers: iconCustomers,
    inventory: iconInventory,
    list: iconListItem,
    orders: iconOrders,
    profile: iconProfile,
    restaurant: iconRestaurant,
    shippers: iconShippers,
    staffs: iconStaffs,
  },
};

export const apiBaseUrl =
  import.meta.env.VITE_API_URL || "http://localhost:4000";
export const url = apiBaseUrl;
