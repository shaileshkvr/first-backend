import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import connectDB from "./db/index.js";
import app from "./app.js";

const PORT = process.env.PORT || 5000;

// connectDB();
(async () => {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${process.env.PORT}`);
      console.log("MongoDB is disconnected, pls uncomment code");
    });
    server.on("error", (error) => {
      console.error("Server error:", error.message || error);
      process.exit(1);
    });
  } catch (error) {
    console.error("Failed to start server !!", error.message || error);
    process.exit(1);
  }
})();
