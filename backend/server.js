import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import profileRoutes from "./routes/profile.js";
import authRoutes from "./routes/auth.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

//Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log(" Connecté à MongoDB"))
  .catch(err => console.log(" Erreur MongoDB:", err));

// Routes
app.use("/api/profile", profileRoutes);
app.use("/api/auth", authRoutes); 

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));
