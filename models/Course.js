import mongoose from "mongoose";

const schema = new mongoose.Schema({
  // Title type, required, minLength, maxLength
  title: {
    type: String,
    required: ["true", "enter the title"],
    minLength: [5, "title must be more than 5 words"],
    maxLength: [20, "title must be less than 20 words"],
  },
  // Description type, required, minLength
  description: {
    type: String,
    required: ["true", "enter the description"],
    minLength: [10, "title must be more than 10 words"],
  },
  // Lectures title,description,videos { public_id,url }
  lectures: [
    {
      title: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
      video: {
        public_id: {
          required: true,
          type: String,
        },
        url: {
          required: true,
          type: String,
        },
      },
    },
  ],
  // Poster public_id, url
  poster: {
    public_id: {
      required: true,
      type: String,
    },
    url: {
      required: true,
      type: String,
    },
  },
  // Views type, default
  views: {
    type: Number,
    default: 0,
  },
  // NumOfVideos type, default
  numOfViedos: {
    type: Number,
    default: 0,
  },
  // Category type, required
  category: {
    type: String,
    required: true,
  },
  // CreatedBy type, required
  createdBy: {
    type: String,
    required: [true, "Enter course creator name"],
  },
  // CreatedAt type, default
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Course = mongoose.model("Course", schema);
