import mongoose from "mongoose";

const genreSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String
});

export default mongoose.models.Genre || mongoose.model("Genre", genreSchema, "genres");
