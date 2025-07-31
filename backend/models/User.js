import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
  },
  name: {
    type: String,
  },
  calendarAccessToken: {
    type: String,
  },
  calendarRefreshToken: {
    type: String,
  },
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

export default User;