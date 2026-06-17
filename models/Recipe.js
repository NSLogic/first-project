const mongoose = require("mongoose");

// Define the structure of your recipe
const recipeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  ingredients: { type: [String], required: true },
  instructions: { type: String, required: true },
  prepTime: { type: String },
  price: { type: String },
  imageUrl: { type: String },
  category: { type: String, default: "South Indian" }, // Add this line
});
// Create and export the model
module.exports = mongoose.model("Recipe", recipeSchema);
