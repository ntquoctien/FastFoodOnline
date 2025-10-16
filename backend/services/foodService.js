import fs from "fs";
import * as userRepo from "../repositories/userRepository.js";
import * as foodRepo from "../repositories/foodRepository.js";

export const addFood = async ({ userId, body, file }) => {
  const role = await userRepo.getRole(userId);
  if (role !== "admin") {
    return { success: false, message: "You are not admin" };
  }

  const image = `${file.filename}`;
  await foodRepo.createFood({
    name: body.name,
    description: body.description,
    price: body.price,
    category: body.category,
    image,
  });

  return { success: true, message: "Food Added" };
};

export const listFood = async () => {
  const foods = await foodRepo.findAll();
  return { success: true, data: foods };
};

export const removeFood = async ({ userId, id }) => {
  const role = await userRepo.getRole(userId);
  if (role !== "admin") {
    return { success: false, message: "You are not admin" };
  }
  const food = await foodRepo.findById(id);
  if (food?.image) {
    fs.unlink(`uploads/${food.image}`, () => {});
  }
  await foodRepo.deleteById(id);
  return { success: true, message: "Food Removed" };
};

export default { addFood, listFood, removeFood };

