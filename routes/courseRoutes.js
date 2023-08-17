import express from "express";
import {
  addLecture,
  createCourse,
  deleteCourse,
  deleteLecture,
  getAllCourses,
  getCourseLectures,
} from "../controllers/courseController.js";
import singleUpload from "../middlewares/multer.js";
import { authorizeAdmin, authorizeSubscribers, isAuthenticated } from "../middlewares/auth.js";

const router = express();

// Get all courses without lectures
router.route("/courses").get(getAllCourses);

// create new course - only admin
router
  .route("/createcourse")
  .post(isAuthenticated, authorizeAdmin, singleUpload, createCourse);

// Add lecture , delete course , get course details
router
  .route("/courses/:id")
  .get(isAuthenticated,authorizeSubscribers,getCourseLectures)
  .post(isAuthenticated,authorizeAdmin,singleUpload, addLecture)// authorizeAdmin bug , fixed on 23/07/2023
  .delete(isAuthenticated,authorizeAdmin,deleteCourse); 

// delete lecture
router
  .route("/lecture")
  .delete(isAuthenticated, authorizeAdmin, deleteLecture);


export default router;
