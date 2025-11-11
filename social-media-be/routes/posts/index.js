import express from "express";
import {
  createPost,
  getPostById,
  updatePostById,
  deletePostById,
  addComment,
  likePost,
  unlikePost,
} from "../../controllers/posts.js";

const router = express.Router();

router.post("/", createPost);
router.get("/:id", getPostById);
router.put("/:id", updatePostById);
router.delete("/:id", deletePostById);

router.post("/comment", addComment);
router.post("/:id/like", likePost);
router.post("/:id/unlike", unlikePost);

export default router;
