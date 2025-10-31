// models/Author.js
import mongoose from "mongoose";

const authorSchema = new mongoose.Schema({
  name: { type: String, required: true },
});

export default mongoose.models.Author || mongoose.model("Author", authorSchema, "authors");
