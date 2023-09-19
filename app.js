import express from "express";
import { config } from "dotenv";
import ErrorMiddleware from "./middlewares/Error.js";
import cookieParser from "cookie-parser";
import cors from "cors";

config({
  path: "./config/config.env",
});

const app = express();
app.use(
  cors({
    // origin: "http://localhost:3000", // Replace with the origin(s) you want to allow
    origin: "https://e-learning-frontend-virid.vercel.app", // Replace with the origin(s) you want to allow
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true, // Allow cookies and authentication headers
  })
);

// using middlerwares

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

// importing and using routes
import course from "./routes/courseRoutes.js";
import user from "./routes/userRoutes.js";
import payment from "./routes/PaymentRoutes.js";
import other from "./routes/otherRoutes.js";

app.use("/api/v1", course);
app.use("/api/v1", user);
app.use("/api/v1", payment);
app.use("/api/v1", other);

export default app;

// app.get("/", (req, res) =>
//   res.send(
//     `<h1>Site is Working. click <a href=${process.env.FRONTEND_URL}>here</a> to visit frontend.</h1>`
//   )

// );

app.get("/", (req, res) => {
  // const frontendURL = "http://localhost:3000";
  const frontendURL = "https://e-learning-frontend-virid.vercel.app/";

  res.send(
    `<div style="display: flex; align-items: center; justify-content: center; text-align: center;">
    <h1 style="font-size: 24px; color: #333;">
        Hi, Mr. Raj your Backend is Working fine. Click <a href="${frontendURL}" style="text-decoration: underline; color: #007bff;">here</a> to visit frontend.
    </h1>
</div>
`
  );
});

app.use(ErrorMiddleware); // suun lo meri baat isko hamesa last me call krna hai bas !!!!
