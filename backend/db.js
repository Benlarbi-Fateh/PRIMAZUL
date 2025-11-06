// backend/db.js
// backend/db.js
const mongoose = require("mongoose");

const connectDB = async () =>
{
  try {
    await mongoose.connect(
      "mongodb+srv://mezraguelamia_db_user:Mezrague2025@application.xlzhcrx.mongodb.net/primAzul",
      { useNewUrlParser: true, useUnifiedTopology: true }
    );
    console.log("MongoDB Atlas connecté !");
  } catch (error) {
    console.error("Erreur de connexion MongoDB :", error.message);
  }
};

module.exports = connectDB;
