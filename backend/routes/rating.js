const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Rating = require("../models/Rating");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { userId, stars } = req.body;
    if (!stars || stars < 1 || stars > 5)
      return res.status(400).json({ message: "Note invalide" });

    let rating = await Rating.findOne({ userId });
    if (rating) {
      rating.stars = stars;
      await rating.save();
      return res.json({ message: "Note mise à jour", rating });
    }

    rating = await Rating.create({ userId, stars });
    res.json({ message: "Note enregistrée", rating });
  } catch (err) {
    console.error("POST /api/rating error:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

router.get("/average", async (req, res) => {
  try {
    const avg = await Rating.aggregate([
      { $group: { _id: null, avgStars: { $avg: "$stars" }, totalVotes: { $sum: 1 } } },
    ]);
    res.json({
      average: avg[0]?.avgStars || 0,
      votes: avg[0]?.totalVotes || 0,
    });
  } catch (err) {
    console.error("GET /api/rating/average error:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
