import basket_icon from "./basket_icon.png";
import logo from "./logo.png";
import header_img from "./head_img.png";
import search_icon from "./search_icon.png";
import search_dark_icon from "./search_dark.png";
import menu_1 from "./menu_1.png";
import menu_2 from "./menu_2.png";
import menu_3 from "./menu_3.png";
import menu_4 from "./menu_4.png";
import menu_5 from "./menu_5.png";
import menu_6 from "./menu_6.png";
import menu_7 from "./menu_7.png";
import menu_8 from "./menu_8.png";

import add_icon_green from "./add_icon_green.png";
import remove_icon_red from "./remove_icon_red.png";
import add_icon_white from "./add_icon_white.png";
import add_to_cart_icon from "./Icon/add-to-cart.png";
import app_store from "./app_store.png";
import play_store from "./play_store.png";
import bocongthuong from "./bocongthuong.png";
import linkedin_icon from "./linkedin_icon.png";
import facebook_icon from "./facebook_icon.png";
import twitter_icon from "./twitter_icon.png";
import cross_icon from "./cross_icon.png";
import selector_icon from "./selector_icon.png";
import rating_starts from "./rating_starts.png";
import profile_icon from "./profile_icon.png";
import bag_icon from "./bag_icon.png";
import logout_icon from "./logout_icon.png";
import parcel_icon from "./parcel_icon.png";

// Updated food imagery
import food_image_1 from "./FoodImage/Salad_platter.jpg";
import food_image_2 from "./FoodImage/Pepperoni.webp";
import food_image_3 from "./FoodImage/PestoE1A3iE1A3n.webp";
import food_image_4 from "./FoodImage/pizza_ca_hoi_40877bb913ae49c4b9e08975b7ad1680_1024x1024.jpg";
import food_image_5 from "./FoodImage/ac9491b2bee2bff0142684fcd51f84e1.jpg";
import food_image_6 from "./FoodImage/bo_nuong_259388242df242dfa49817c9cdd1da9b_master.jpg";
import food_image_7 from "./FoodImage/burger_2_43d436faf77d4ba198bc1d3fe0b4f74a_master.png";
import food_image_8 from "./FoodImage/cach-lam-khoai-tay-chien-gion-5.jpg";
import food_image_9 from "./FoodImage/Cheese20with%20honey.webp";
import food_image_10 from "./FoodImage/hieuunganh.com_62dfa0f96afcd_fd8206bbf97f496086daf37735a4db3f.png";
import food_image_11 from "./FoodImage/images.jpg";
import food_image_12 from "./FoodImage/sandwich_bo_pho_mai_1_ca0f07e79f29453c9b33e0725c0e219d.png";
import food_image_13 from "./FoodImage/ShrimpBurger.webp";
import food_image_14 from "./FoodImage/budweiser5percent.jpeg";
import food_image_15 from "./FoodImage/nuoc-tinh-khiet-aquafina-350ml.jpg";

const foodImages = [
  food_image_1,
  food_image_2,
  food_image_3,
  food_image_4,
  food_image_5,
  food_image_6,
  food_image_7,
  food_image_8,
  food_image_9,
  food_image_10,
  food_image_11,
  food_image_12,
  food_image_13,
  food_image_14,
  food_image_15,
];

export const assets = {
  logo,
  basket_icon,
  header_img,
  search_icon,
  search_dark_icon,
  rating_starts,
  add_icon_green,
  add_icon_white,
  add_to_cart_icon,
  remove_icon_red,
  app_store,
  play_store,
  bocongthuong,
  linkedin_icon,
  facebook_icon,
  twitter_icon,
  cross_icon,
  selector_icon,
  profile_icon,
  logout_icon,
  bag_icon,
  parcel_icon,
  placeholder_image: foodImages[0],
};

export const menu_list = [
  {
    menu_name: "Salad",
    menu_image: menu_1,
  },
  {
    menu_name: "Rolls",
    menu_image: menu_2,
  },
  {
    menu_name: "Deserts",
    menu_image: menu_3,
  },
  {
    menu_name: "Sandwich",
    menu_image: menu_4,
  },
  {
    menu_name: "Cake",
    menu_image: menu_5,
  },
  {
    menu_name: "Pure Veg",
    menu_image: menu_6,
  },
  {
    menu_name: "Pasta",
    menu_image: menu_7,
  },
  {
    menu_name: "Noodles",
    menu_image: menu_8,
  },
];

const baseFoodList = [
  {
    _id: "1",
    name: "Greek salad",
    price: 12,
    description: "Food provides essential nutrients for overall health and well-being",
    category: "Salad",
  },
  {
    _id: "2",
    name: "Veg salad",
    price: 18,
    description: "Food provides essential nutrients for overall health and well-being",
    category: "Salad",
  },
  {
    _id: "3",
    name: "Clover Salad",
    price: 16,
    description: "Food provides essential nutrients for overall health and well-being",
    category: "Salad",
  },
  {
    _id: "4",
    name: "Chicken Salad",
    price: 24,
    description: "Food provides essential nutrients for overall health and well-being",
    category: "Salad",
  },
  {
    _id: "5",
    name: "Lasagna Rolls",
    price: 14,
    description: "Food provides essential nutrients for overall health and well-being",
    category: "Rolls",
  },
  {
    _id: "6",
    name: "Peri Peri Rolls",
    price: 12,
    description: "Food provides essential nutrients for overall health and well-being",
    category: "Rolls",
  },
  {
    _id: "7",
    name: "Chicken Rolls",
    price: 20,
    description: "Food provides essential nutrients for overall health and well-being",
    category: "Rolls",
  },
  {
    _id: "8",
    name: "Veg Rolls",
    price: 15,
    description: "Food provides essential nutrients for overall health and well-being",
    category: "Rolls",
  },
  {
    _id: "9",
    name: "Ripple Ice Cream",
    price: 14,
    description: "Food provides essential nutrients for overall health and well-being",
    category: "Deserts",
  },
  {
    _id: "10",
    name: "Fruit Ice Cream",
    price: 22,
    description: "Food provides essential nutrients for overall health and well-being",
    category: "Deserts",
  },
  {
    _id: "11",
    name: "Jar Ice Cream",
    price: 10,
    description: "Food provides essential nutrients for overall health and well-being",
    category: "Deserts",
  },
  {
    _id: "12",
    name: "Vanilla Ice Cream",
    price: 12,
    description: "Food provides essential nutrients for overall health and well-being",
    category: "Deserts",
  },
  {
    _id: "13",
    name: "Chicken Sandwich",
    price: 12,
    description: "Food provides essential nutrients for overall health and well-being",
    category: "Sandwich",
  },
  {
    _id: "14",
    name: "Vegan Sandwich",
    price: 18,
    description: "Food provides essential nutrients for overall health and well-being",
    category: "Sandwich",
  },
  {
    _id: "15",
    name: "Grilled Sandwich",
    price: 16,
    description: "Food provides essential nutrients for overall health and well-being",
    category: "Sandwich",
  },
  {
    _id: "16",
    name: "Bread Sandwich",
    price: 24,
    description: "Food provides essential nutrients for overall health and well-being",
    category: "Sandwich",
  },
  {
    _id: "17",
    name: "Cup Cake",
    price: 14,
    description: "Food provides essential nutrients for overall health and well-being",
    category: "Cake",
  },
  {
    _id: "18",
    name: "Vegan Cake",
    price: 12,
    description: "Food provides essential nutrients for overall health and well-being",
    category: "Cake",
  },
  {
    _id: "19",
    name: "Butterscotch Cake",
    price: 20,
    description: "Food provides essential nutrients for overall health and well-being",
    category: "Cake",
  },
  {
    _id: "20",
    name: "Sliced Cake",
    price: 15,
    description: "Food provides essential nutrients for overall health and well-being",
    category: "Cake",
  },
  {
    _id: "21",
    name: "Garlic Mushroom",
    price: 14,
    description: "Food provides essential nutrients for overall health and well-being",
    category: "Pure Veg",
  },
  {
    _id: "22",
    name: "Fried Cauliflower",
    price: 22,
    description: "Food provides essential nutrients for overall health and well-being",
    category: "Pure Veg",
  },
  {
    _id: "23",
    name: "Mix Veg Pulao",
    price: 10,
    description: "Food provides essential nutrients for overall health and well-being",
    category: "Pure Veg",
  },
  {
    _id: "24",
    name: "Rice Zucchini",
    price: 12,
    description: "Food provides essential nutrients for overall health and well-being",
    category: "Pure Veg",
  },
  {
    _id: "25",
    name: "Cheese Pasta",
    price: 12,
    description: "Food provides essential nutrients for overall health and well-being",
    category: "Pasta",
  },
  {
    _id: "26",
    name: "Tomato Pasta",
    price: 18,
    description: "Food provides essential nutrients for overall health and well-being",
    category: "Pasta",
  },
  {
    _id: "27",
    name: "Creamy Pasta",
    price: 16,
    description: "Food provides essential nutrients for overall health and well-being",
    category: "Pasta",
  },
  {
    _id: "28",
    name: "Chicken Pasta",
    price: 24,
    description: "Food provides essential nutrients for overall health and well-being",
    category: "Pasta",
  },
  {
    _id: "29",
    name: "Buttter Noodles",
    price: 14,
    description: "Food provides essential nutrients for overall health and well-being",
    category: "Noodles",
  },
  {
    _id: "30",
    name: "Veg Noodles",
    price: 12,
    description: "Food provides essential nutrients for overall health and well-being",
    category: "Noodles",
  },
  {
    _id: "31",
    name: "Somen Noodles",
    price: 20,
    description: "Food provides essential nutrients for overall health and well-being",
    category: "Noodles",
  },
  {
    _id: "32",
    name: "Cooked Noodles",
    price: 15,
    description: "Food provides essential nutrients for overall health and well-being",
    category: "Noodles",
  },
];

export const food_list = baseFoodList.map((item, index) => ({
  ...item,
  image: foodImages[index % foodImages.length],
}));
