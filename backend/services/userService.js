import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import * as userRepo from "../repositories/userRepository.js";

const createToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET);

export const login = async (email, password) => {
  const user = await userRepo.findOneByEmail(email);
  if (!user) {
    return { success: false, message: "User Doesn't exist" };
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return { success: false, message: "Invalid Credentials" };
  }
  const role = user.role;
  const token = createToken(user._id);
    const branchId = user.branchId;
  return { success: true, token, role, branchId };
};

export const register = async (name, email, password) => {
  const exists = await userRepo.findOneByEmail(email);
  if (exists) {
    return { success: false, message: "User already exists" };
  }

  if (!validator.isEmail(email)) {
    return { success: false, message: "Please enter valid email" };
  }
  if (password.length < 8) {
    return { success: false, message: "Please enter strong password" };
  }

  const salt = await bcrypt.genSalt(Number(process.env.SALT));
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await userRepo.createUser({ name, email, password: hashedPassword });
  const role = user.role;
  const token = createToken(user._id);
    const branchId = user.branchId;
  return { success: true, token, role, branchId };
};

export default { login, register };

