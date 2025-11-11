import userRoutes from "./users/index.js";
import postsRoutes from "./posts/index.js";
import { Router } from "express";

const router = Router();

// Mount individual route modules
router.use("/users", userRoutes);
router.use("/posts", postsRoutes);

export default router;
