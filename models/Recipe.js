const mongoose = require("mongoose");
const recipeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  ingredients: { type: [String], required: true },
  instructions: { type: String, required: true },
  prepTime: { type: String },
  price: { type: String },
  imageUrl: { type: String },
  category: { type: String, default: "South Indian" }, 
});
module.exports = mongoose.model("Recipe", recipeSchema);
