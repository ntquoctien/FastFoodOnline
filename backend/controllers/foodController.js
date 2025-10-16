import * as foodService from "../services/foodService.js";

// add food items

const addFood = async (req, res) => {
  try {
    const result = await foodService.addFood({ userId: req.body.userId, body: req.body, file: req.file });
    res.json(result);
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// all foods
const listFood = async (req, res) => {
  try {
    const result = await foodService.listFood();
    res.json(result);
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// remove food item
const removeFood = async (req, res) => {
  try {
    const result = await foodService.removeFood({ userId: req.body.userId, id: req.body.id });
    res.json(result);
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

export { addFood, listFood, removeFood };
