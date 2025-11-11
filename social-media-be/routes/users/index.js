import express from "express";
import {
  register,
  login,
  getCurrentUser,
  getUserById,
  updateUserById,
  deleteUserById,
  searchUser,
  logout,
} from "../../controllers/users.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", getCurrentUser); // 🔹 dobija usera iz tokena
router.get("/search", searchUser);
router.get("/:id", getUserById);
router.put("/:id", updateUserById);
router.delete("/:id", deleteUserById);

export default router;
