import supabase from "../lib/supabase.js";
import jwt from "jsonwebtoken";

// 🔹 CREATE POST
export const createPost = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user_id = decoded.userId;

    const { content } = req.body;
    if (!content) return res.status(400).json({ error: "Content is required" });

    const { data, error } = await supabase
      .from("posts")
      .insert([{ user_id, content }])
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 🔹 GET POST BY ID (s komentarima i likes)
export const getPostById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: post, error } = await supabase
      .from("posts")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !post)
      return res.status(404).json({ error: "Post not found" });

    const { data: comments } = await supabase
      .from("comments")
      .select("id, user_id, content, created_at")
      .eq("post_id", id)
      .order("created_at", { ascending: true });

    res.status(200).json({ ...post, comments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 🔹 UPDATE POST (autentifikacija + samo autor može editovati)
export const updatePostById = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user_id = decoded.userId;
    const { id } = req.params;
    const { content } = req.body;

    const { data: post } = await supabase
      .from("posts")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.user_id !== user_id)
      return res.status(403).json({ error: "Not authorized" });

    const { data, error } = await supabase
      .from("posts")
      .update({ content, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 🔹 DELETE POST (autentifikacija + samo autor može obrisati)
export const deletePostById = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user_id = decoded.userId;
    const { id } = req.params;

    const { data: post } = await supabase
      .from("posts")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.user_id !== user_id)
      return res.status(403).json({ error: "Not authorized" });

    await supabase.from("comments").delete().eq("post_id", id);

    const { error } = await supabase.from("posts").delete().eq("id", id);

    if (error) return res.status(400).json({ error: error.message });
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 🔹 ADD COMMENT
export const addComment = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user_id = decoded.userId;

    const { post_id, content } = req.body;

    if (!content) return res.status(400).json({ error: "Content is required" });

    const { data, error } = await supabase
      .from("comments")
      .insert([{ post_id, user_id, content }])
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 🔹 LIKE POST (jedan like po useru)
export const likePost = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user_id = decoded.userId;
    const { id } = req.params;

    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("likes")
      .eq("id", id)
      .single();

    if (postError || !post)
      return res.status(404).json({ error: "Post not found" });

    const likes = post.likes || [];
    if (likes.includes(user_id))
      return res.status(400).json({ error: "Already liked" });

    const updatedLikes = [...likes, user_id];

    const { data, error } = await supabase
      .from("posts")
      .update({ likes: updatedLikes })
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 🔹 UNLIKE POST
export const unlikePost = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user_id = decoded.userId;
    const { id } = req.params;

    const { data: post } = await supabase
      .from("posts")
      .select("likes")
      .eq("id", id)
      .single();

    if (!post) return res.status(404).json({ error: "Post not found" });

    const likes = post.likes || [];
    if (!likes.includes(user_id))
      return res.status(400).json({ error: "You haven't liked this post" });

    const updatedLikes = likes.filter((uid) => uid !== user_id);

    const { data, error } = await supabase
      .from("posts")
      .update({ likes: updatedLikes })
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};
