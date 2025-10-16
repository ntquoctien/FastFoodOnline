import * as userService from "../services/userService.js";

// login user

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await userService.login(email, password);
    res.json(result);
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Create token

// Token creation handled in service layer

// register user

const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const result = await userService.register(name, email, password);
    res.json(result);
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

export { loginUser, registerUser };
