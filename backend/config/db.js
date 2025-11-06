import mongoose from "mongoose";
const connectDB = async () =>
{
  try 
  {
    //await est un mot-clé JavaScript qui sert à attendre qu’une promesse se termine avant de continuer l’exécution du code.
    await mongoose.connect(process.env.MONGO_URI);
    console.log(" MongoDB connecté avec succès !");
  } 
  // capture et gère l’erreur.
  catch (error) 
  {
    // Code exécuté si une erreur se produit
    console.error("Erreur de connexion MongoDB :", error.message);
    process.exit(1);
  }
};
module.exports = connectDB;
