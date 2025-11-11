import supabase from "../lib/supabase.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// 🔹 REGISTER
export const register = async (req, res) => {
  try {
    const { username, name, email, password } = req.body;

    const usernameRegex = /^[a-zA-Z0-9._-]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        error:
          "Username može sadržavati samo slova, brojeve, tačku, donju crtu i crticu, te mora imati najmanje 3 karaktera.",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Neispravan format email adrese." });
    }

    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .or(`username.eq.${username},email.eq.${email}`);

    if (existingUser && existingUser.length > 0)
      return res.status(400).json({ error: "Username ili email već postoji." });

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from("users")
      .insert([{ username, name, email, password: hashedPassword }])
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    // ✅ GENERISANJE TOKENA
    const token = jwt.sign({ userId: data.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });

    // ✅ POSTAVI COOKIE
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" ? true : false,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ message: "Register successful", data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 🔹 LOGIN (postavlja JWT cookie)
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user)
      return res.status(400).json({ error: "Invalid email or password" });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({ error: "Invalid email or password" });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ message: "Login successful", user });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
};


// 🔹 GET CURRENT USER (iz tokena)
export const getCurrentUser = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { data, error } = await supabase
      .from("users")
      .select("id, username, name, email, posts, created_at")
      .eq("id", decoded.userId)
      .single();

    if (error) return res.status(404).json({ error: "User not found" });
    res.status(200).json(data);
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

// 🔹 GET USER BY ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("users")
      .select("id, username, name, email, posts, created_at")
      .eq("id", id)
      .single();

    if (error || !data)
      return res.status(404).json({ error: "User not found" });
    res.status(200).json(data);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
};

// 🔹 UPDATE USER (koristi token ako postoji)
export const updateUserById = async (req, res) => {
  try {
    let userId = req.params.id;

    const token = req.cookies.token;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.userId;
    }

    const updates = req.body;

    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(200).json(data);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
};

// 🔹 DELETE USER (koristi token ako postoji)
export const deleteUserById = async (req, res) => {
  try {
    let userId = req.params.id;

    const token = req.cookies.token;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.userId;
    }

    const { error } = await supabase.from("users").delete().eq("id", userId);

    if (error) return res.status(400).json({ error: error.message });
    res.clearCookie("token");
    res.status(200).json({ message: "User deleted successfully" });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
};

// 🔹 SEARCH USER
export const searchUser = async (req, res) => {
  try {
    const { q } = req.query;

    const { data, error } = await supabase
      .from("users")
      .select("id, username, name, email, posts, created_at")
      .ilike("username", `%${q}%`);

    if (error) return res.status(400).json({ error: error.message });
    res.status(200).json(data);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
};

// 🔹 LOGOUT
export const logout = (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logged out successfully" });
};
