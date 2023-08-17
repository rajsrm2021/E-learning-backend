import mongoose from "mongoose";
import validator from "validator";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";

const schema = new mongoose.Schema({
  // Name type, required
  name: {
    type: String,
    required: [true, "Please enter your name"],
  },
  // Email type, required, unique, validate
  email: {
    type: String,
    required: [true, "Please enter your email"],
    unique: true,
    validate: validator.isEmail,
  },
  // Password type, required, minLength, select
  password: {
    type: String,
    required: [true, "Please enter your password"],
    minLength: [8, "password must be 8 character"],
    select: false,
  },
  // Role type, enum, default
  role: {
    type: String,
    enum: ["admin", "user"], // enum means only two options are allowed
    default: "admin",
  },

  // Subscription id, status
  subscription: {
    id: String,
    status: String,
  },

  // Avatar public_id, url
  avtar: {
    public_id: {
      required: true,
      type: String,
    },
    url: {
      required: true,
      type: String,
    },
  },
  // Playlist [ courseId,poster ]
  playlist: [
    {
      course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
      poster: String,
    },
  ],
  // CreatedAt type, default
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // ResetPasswordToken type
  resetPasswordToken: {
    type: String,
  },
  // ResetPasswordExpire type
  resetPasswordExpire: {
    type: String,
  },
});

// function ho hash the password before saving in database
schema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const hashPassword = await bcrypt.hash(this.password, 10); //10 is the optimal round for hashing password

  this.password = hashPassword;

  next();
});

// generate JWTToken
schema.methods.getJWTToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.JWT_SECRET,
    { expiresIn: "15d" }
  );
};

// function to compare password
schema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// function to generate and send forget password token via email
schema.methods.getResetToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");

  // algorithm to hash the token
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  
  // expire token
  this.resetPasswordExpire = Date.now() + 15*60*1000; // 15 min is expire time

  return resetToken;
};

export const User = mongoose.model("User", schema);
