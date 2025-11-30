// import mongoose from "mongoose";

// const StorySchema = new mongoose.Schema({
//   user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

//   mediaUrl: { type: String, required: true }, // image ou vidéo
//   mediaType: { type: String, enum: ["image", "video"], required: true },

//   text: { type: String, default: "" },

//   createdAt: { type: Date, default: Date.now },
//   expiresAt: { type: Date, default: () => Date.now() + 24 * 60 * 60 * 1000 },

//   viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
// });

// export default mongoose.model("Story", StorySchema);
