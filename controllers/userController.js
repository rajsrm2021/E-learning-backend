import { CatchAsyncError } from "../middlewares/CatchAsyncError.js";
import ErrorHandler from "../utils/errorHandler.js";
import { User } from "../models/User.js";
import { sendToken } from "../utils/sendToken.js";
import { sendEmail } from "../utils/sendEmail.js";
import crypto from "crypto";
import { Course } from "../models/Course.js";
import cloudinary from "cloudinary";
import getDataUri from "../utils/datauri.js";
import { Stats } from "../models/Stats.js";


export const register = CatchAsyncError(async (req, res, next) => {
  const { name, email, password } = req.body;
  const file = req.file;

  if (!name || !email || !password || !file)
    return next(new ErrorHandler("please enter all field", 400));

  let user = await User.findOne({ email });

  if (user)
    return next(new ErrorHandler("already registed with this email id", 409));

  // upload file on cloudnary

  const fileUri = getDataUri(file);
  const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);

  user = await User.create({
    name,
    email,
    password,
    avtar: {
      public_id: mycloud.public_id,
      url: mycloud.secure_url,
    },
  });

  sendToken(res, user, "Registed Sucessfully", 201);
});

export const login = CatchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;

  // const file = req.file;

  if (!email || !password)
    return next(new ErrorHandler("please enter all field", 400));

  const user = await User.findOne({ email }).select("+password");

  if (!user) return next(new ErrorHandler("Incorrect email and password", 401));

  const isMatch = await user.comparePassword(password);
  if (!isMatch)
    return next(new ErrorHandler("Incorrect email and password", 401));

  sendToken(res, user, `Welcome Back, ${user.name}`, 200);
});

export const logout = CatchAsyncError(async (req, res, next) => {
  res
    .status(200)
    .cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
      secure: true,
      sameSite: "none",
    })
    .json({
      success: true,
      message: "Logout successful",
    });
});

export const getMyProfile = CatchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  res.status(200).json({
    success: true,
    user,
  });
});

export const changepassword = CatchAsyncError(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword)
    return next(new ErrorHandler("please enter all field", 400));

  const user = await User.findById(req.user._id).select("+password");

  const isMatch = await user.comparePassword(oldPassword);

  if (!isMatch) return next(new ErrorHandler("Incorrect Old Password", 400));

  user.password = newPassword;

  await user.save();

  res.status(200).json({
    success: true,
    messgae: "password change sucessfully",
  });
});

export const updateProfile = CatchAsyncError(async (req, res, next) => {
  const { name, email } = req.body;

  const user = await User.findById(req.user._id);

  if (name) user.name = name;
  if (email) user.email = email;

  await user.save();

  res.status(200).json({
    success: true,
    messgae: "profile updated sucessfully",
  });
});

export const updateProfilePicture = CatchAsyncError(async (req, res, next) => {
  // cloudnary todo

  const file = req.file;
  const user = await User.findById(req.user._id);
  const fileUri = getDataUri(file);
  const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);

  await cloudinary.v2.uploader.destroy(user.avtar.public_id);

  user.avtar = {
    public_id: mycloud.public_id,
    url: mycloud.secure_url,
  };
  res.status(200).json({
    success: true,
    messgae: "profile photo updated sucessfully",
  });
});

export const forgetPassword = CatchAsyncError(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) return next(new ErrorHandler("User not found", 400));

  const resetToken = await user.getResetToken();
  // http://localhost:3000/resetpassword/iguyegsiueg

  await user.save();

  const url = `${process.env.FONTEND_URL}/resetpassword/${resetToken}`;

  const message = `Click on the link to reset your password. ${url}. If you have requested please ignore this mail `;

  // send token via email
  await sendEmail(user.email, "your reset password token ", message); // function call

  res.status(200).json({
    success: true,
    messgae: `Reset token has send to ${user.email}`,
  });
});

export const resetPassword = CatchAsyncError(async (req, res, next) => {
  const { token } = req.params;

  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: {
      $gt: Date.now(),
    },
  });
  if (!user)
    return next(new ErrorHandler("Token is invalid or has been expired", 401));

  user.password = req.body.password;

  user.resetPasswordExpire = undefined;
  user.resetPasswordToken = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    messgae: "password change sucessfully",
  });
});

export const addToPlaylist = CatchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  const course = await Course.findById(req.body.id);

  if (!course) return next(new ErrorHandler("Invalid Course Id", 404));

  const itemExist = user.playlist.find((item) => {
    if (item.course.toString() === course._id.toString()) return true;
  });
  if (itemExist) return next(new ErrorHandler("Item already exist", 409));
  user.playlist.push({
    course: course._id,
    poster: course.poster.url,
  });

  await user.save();

  res.status(200).json({
    success: true,
    messgae: "Added to playlist sucessfully",
  });
});

export const removeFromPlaylist = CatchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  const course = await Course.findById(req.query.id);

  if (!course) return next(new ErrorHandler("Invalid Course Id", 404));

  const newPlaylist = user.playlist.filter((item) => {
    if (item.course.toString() !== course._id.toString()) return item;
  });

  user.playlist = newPlaylist;

  await user.save();

  res.status(200).json({
    success: true,
    messgae: "Sucessfully removed from playlist ",
  });
});

// Admin controllers
export const getAllUsers = CatchAsyncError(async (req, res, next) => {
  const users = await User.find({});

  res.status(200).json({
    success: true,
    users,
  });
});

export const updateUserRole = CatchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) return next(new ErrorHandler("user not found", 404));

  if (user.role === "user") user.role = "admin";
  else user.role = "user";

  await user.save();

  res.status(200).json({
    success: true,
    message: "role updated sucessfully",
  });
});

export const deleteUser = CatchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) return next(new ErrorHandler("user not found", 404));

  await cloudinary.v2.uploader.destroy(user.avtar.public_id);

  // Cancle Subscription
  await user.deleteOne();

  res.status(200).json({
    success: true,
    message: "user deleted sucessfully",
  });
});

export const deleteMyProfile = CatchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  await cloudinary.v2.uploader.destroy(user.avtar.public_id);

  // Cancel Subscription

  await user.deleteOne();

  res
    .status(200)
    .cookie("token", null, {
      expires: new Date(Date.now()),
    })
    .json({
      success: true,
      message: "User Deleted Successfully",
    });
});

User.watch().on("change", async () => {
  const stats = await Stats.find({}).sort({ createdAt: "desc" }).limit(1);

  const subscription = await User.find({ "subscription.status": "active" });
  stats[0].users = await User.countDocuments();
  stats[0].subscription = subscription.length;
  stats[0].createdAt = new Date(Date.now());

  await stats[0].save();
});
