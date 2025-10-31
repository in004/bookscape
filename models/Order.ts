
// models/Order.js
/*import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  book: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
  quantity: { type: Number, required: true },
  priceAtPurchase: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [orderItemSchema],
  total: { type: Number, required: true },
  status: { type: String, enum: ["pending", "paid", "shipped", "cancelled"], default: "pending" },
  paypalOrderId: { type: String },
paymentStatus: {
  type: String,
  enum: ["pending", "paid", "failed", "refunded"],
  default: "pending",
},
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Order || mongoose.model("Order", orderSchema);
*/

import { ObjectId } from "mongodb";
export type OrderStatus = "pending" | "in_process" | "completed" | "cancelled";
export interface OrderItem {
  bookId: ObjectId;
  quantity: number;
  price: number;
}

export interface Order {
  _id?: ObjectId;
  userId?: ObjectId;
  items: OrderItem[];
  totalAmount: number;
  isPaid: boolean;
  createdAt: Date;
  updatedAt: Date;
  paymentProvider?: "paypal";
  paypalOrderId?: string;
   status: OrderStatus;
}
