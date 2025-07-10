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

export default app;
