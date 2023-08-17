import { CatchAsyncError } from "../middlewares/CatchAsyncError.js";
import { Course } from "../models/Course.js";
import { Stats } from "../models/Stats.js";
import getDataUri from "../utils/datauri.js";
import ErrorHandler from "../utils/errorHandler.js";
import cloudinary from "cloudinary";

export const getAllCourses = CatchAsyncError(async (req, res, next) => {
  const keyword = req.query.keyword || "";
  const category = req.query.category || "";

  const courses = await Course.find({
    title: {
      $regex: keyword,
      $options: "i",
    },
    category: {
      $regex: category,
      $options: "i",
    },
  }).select("-lectures");
  res.status(200).json({
    success: true,
    courses,
  });
});
export const createCourse = CatchAsyncError(async (req, res, next) => {
  const { title, description, category, createdBy } = req.body;

  if (!title || !description || !category || !createdBy)
    return next(new ErrorHandler("please add all field", 400));

  const file = req.file;
  const fileUri = getDataUri(file);

  const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);

  await Course.create({
    title,
    description,
    category,
    createdBy,
    poster: {
      public_id: mycloud.public_id,
      url: mycloud.secure_url,
    },
  });

  res.status(201).json({
    sucess: true,
    message: "course created sucessfully. you can add lecture now",
  });
});

// module to get the course lectures

export const getCourseLectures = CatchAsyncError(async (req, res, next) => {
  const course = await Course.findById(req.params.id);

  if (!course) return next(new ErrorHandler("Course not found", 404));

  course.views += 1;

  await course.save();

  res.status(200).json({
    sucess: true,
    lectures: course.lectures,
  });
});

// module to add the lectures
// max viedo size 100mb becz of free cloudnary

export const addLecture = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { title, description } = req.body;

  // const file = req.file;

  const course = await Course.findById(id);

  if (!course) return next(new ErrorHandler("Course not found", 404));

  // upload file here
  const file = req.file;
  const fileUri = getDataUri(file);

  const mycloud = await cloudinary.v2.uploader.upload(fileUri.content, {
    resource_type: "video",
  });

  course.lectures.push({
    title,
    description,
    video: {
      public_id: mycloud.public_id,
      url: mycloud.secure_url,
    },
  });

  course.numOfViedos = course.lectures.length;

  await course.save();

  res.status(200).json({
    sucess: true,
    message: "Lectures added to the course",
  });
});

//module to delete the lectures

export const deleteCourse = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const course = await Course.findById(id);

  if (!course) return next(new ErrorHandler("Course not found", 404));
  await cloudinary.v2.uploader.destroy(course.poster.public_id);
  // console.log(course.poster.public_id)

  for (let i = 0; i < course.lectures.length; i++) {
    const singleLecture = course.lectures[i];

    await cloudinary.v2.uploader.destroy(singleLecture.video.public_id, {
      resource_type: "video",
    });
  }

  await course.deleteOne(); // bug course.remove is not a function error aah raha hai , fixed on 25/07 deleteone is used insted of .remove

  res.status(200).json({
    sucess: true,
    message: "course deleted sucessfully.",
  });
});

// delete lectures

export const deleteLecture = CatchAsyncError(async (req, res, next) => {
  const { courseId, lectureId } = req.query;

  const course = await Course.findById(courseId);
  if (!course) return next(new ErrorHandler("Course not found", 404));

  const lecture = course.lectures.find((item) => {
    if (item._id.toString() === lectureId.toString()) return item;
  });
  await cloudinary.v2.uploader.destroy(lecture.video.public_id, {
    resource_type: "video",
  });

  course.lectures = course.lectures.filter((item) => {
    if (item._id.toString() !== lectureId.toString()) return item;
  });

  course.numOfViedos = course.lectures.length;

  await course.save();

  res.status(200).json({
    success: true,
    message: "Lecture Deleted Successfully",
  });
});

Course.watch().on("change", async () => {
  const stats = await Stats.find({}).sort({ createdAt: "desc" }).limit(1);

  const courses = await Course.find({});

  let totalViews = 0;

  for (let i = 0; i < courses.length; i++) {
    totalViews += courses[i].views;
  }
  stats[0].views = totalViews;
  stats[0].createdAt = new Date(Date.now());

  await stats[0].save();
});
