import mongoose from "mongoose";

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  authorIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Author" }], // many-to-many
  genreIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Genre" }],   // many-to-many
  coverImage: { type: String },
  price: { type: Number },
  year: { type: String },
  isFeatured: { type: Boolean, default: false },
  isBestseller: { type: Boolean, default: false },
  isNewArrival: { type: Boolean, default: false },
  isStaffPick: { type: Boolean, default: false },
  salePercentage: { type: Number, default: 0 },
  salePrice: { type: Number, default: 0 },
  isOnSale: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  description: { type: String },
  stock: { type: Number, default: 0 },
});

export default mongoose.models.Book || mongoose.model("Book", bookSchema);
