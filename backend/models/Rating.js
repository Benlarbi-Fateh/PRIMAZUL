const mongoose = require("mongoose");
const ratingSchema = new mongoose.Schema({
  userId: { type: String, 
    required: true },
  stars: { type: Number, 
    required: true, 
    min: 1,
    max: 5 }
}, { timestamps: true });
module.exports = mongoose.models.Rating || mongoose.model("Rating", ratingSchema);
