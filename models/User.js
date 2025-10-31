import mongoose, { model, models } from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
    },
    surname: {
      type: String,
      required: [true, "Please provide a surname"],
    },
    email: {
      type: String,
      required: [true, "Please provide email"],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
    },
    role: {
      type: String,
      enum: ["client", "admin", "courier"], // roles for the user
      default: "client",
    },
    // Fields for forgot password functionality
    resetToken: String,
    resetTokenExpiry: Date,
    // Fields for email verification functionality
    verifyToken: String,
    verifyTokenExpiry: Date,
    isVerified: {
      type: Boolean,
      default: false, // Default value is false until email is verified
    },
  },
  {
    timestamps: true, // Correct placement of the timestamps option
  }
);

userSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.password;
    delete ret.forgotPasswordToken;
    delete ret.forgotPasswordTokenExpiry;
    delete ret.verifyToken;
    delete ret.verifyTokenExpiry;
    return ret;
  },
});

const User = models.User || model("User", userSchema, "book_users");

export default User;