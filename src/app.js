import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// read and write secure cookies only via server
app.use(cookieParser());
app.use(express.static("public"));
// parse JSON and URL-encoded data with a limit of 20kb
app.use(express.json({ limit: "20kb" }));
// parse URL-encoded data with a limit of 20kb
app.use(express.urlencoded({ extended: true, limit: "20kb" }));
// enable CORS with specific origin and credentials
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));

// Routes imports
import userRouter from "./routes/user.routes.js";

// Routes declarations
app.use("/api/v1/users", userRouter);
// this will create a route like "https://localhost:8000/api/v1/users/register"
// the '/register' is comming from userRouter or 'user.routes.js' when you purposly hit '/register' request
// similarly '/login' can also be created in user.routes.js file that will call its respective controller

app.get("/", (req, res) =>
  res.send({
    user: "Shailesh Verma",
    status: "Connected to database",
  })
);

export default app;
