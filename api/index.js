require("dotenv").config();
const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Recipe = require("../models/Recipe");
const Razorpay = require("razorpay");
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
const { GoogleGenerativeAI } = require("@google/generative-ai");
const app = express();
const PORT = 3000;
app.use(
  cors({
    origin: [
      "https://first-project-pb58.vercel.app",
      /https:\/\/first-project-pb58-.*\.vercel\.app$/,
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());
const dbURI = process.env.dbURI;
mongoose
  .connect(dbURI)
  .then(() => console.log("Connected to MongoDB!"))
  .catch((err) => console.error("Database connection error:", err));
app.post("/api/bookmark", async (req, res) => {
  const { userId, recipeId } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const index = user.bookmarks.indexOf(recipeId);
    if (index > -1) {
      user.bookmarks.splice(index, 1);
    } else {
      user.bookmarks.push(recipeId);
    }

    await user.save();
    res.json({ bookmarks: user.bookmarks });
  } catch (error) {
    res.status(500).json({ message: "Error updating bookmark" });
  }
});
app.get("/", (req, res) => {
  res.send("<h1>TastyTreats is connected to the Database!</h1>");
});

app.get("/api/add-test", async (req, res) => {
  try {
    const testRecipe = new Recipe({
      title: "Pizza",
      ingredients: "Flour, Tomato, Cheese",
      instructions: "Bake at 200 degrees",
      prepTime: "30 mins",
      price: "$10",
    });
    await testRecipe.save();
    res.send("Added a test Pizza recipe! Go back to your home page.");
  } catch (err) {
    res.status(500).send("Error adding recipe: " + err.message);
  }
});

app.get("/api/recipes", async (req, res) => {
  try {
    const recipes = await Recipe.find();
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
app.get("/api/user-bookmarks/:userId", async (req, res) => {
  const user = await User.findById(req.params.userId);
  res.json({ bookmarks: user.bookmarks });
});

app.delete("/api/recipes/:id", async (req, res) => {
  try {
    const deletedRecipe = await Recipe.findByIdAndDelete(req.params.id);
    if (!deletedRecipe)
      return res.status(404).json({ message: "Recipe not found" });
    res.json({ message: "Recipe deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error registering user" });
  }
});
app.put("/api/recipes/:id", async (req, res) => {
  try {
    const updatedRecipe = await Recipe.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    if (!updatedRecipe)
      return res.status(404).json({ message: "Recipe not found" });
    res.json(updatedRecipe);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });
    const token = jwt.sign({ userId: user._id }, "your_secret_key", {
      expiresIn: "1h",
    });

    res.json({ token, username: user.username, userId: user._id });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});
app.post("/api/create-order", async (req, res) => {
  const { amount } = req.body;
  try {
    const options = {
      amount: Math.round(amount * 100), //
      currency: "INR",
      receipt: "order_rcptid_" + Date.now(),
    };
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/ai/recommend", async (req, res) => {
  const { prompt } = req.body;
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "API Key missing in environment" });
    }
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const models = await genAI.listModels();
    console.log("AVAILABLE MODELS:", models);

    const result = await model.generateContent(
      prompt || "Give me a cooking tip.",
    );
    res.json({ response: result.response.text() });
  } catch (error) {
    console.error("DEBUG AI ERROR:", error);
    res.status(500).json({
      error: "AI Service Failed",
      details: error.message,
    });
  }
});
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
