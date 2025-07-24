import { Router } from "express";
import {
  changeAvatar,
  changeFullName,
  changePassword,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
// import uploadOnCloudinary from "../utils/cloudinary.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

// Secured routes

router.route("/logout").post(verifyJwt, logoutUser);

router.route("/refresh-token").post(refreshAccessToken);

// Under progress
// router.route("/change-avatar").post(verifyJwt, upload.single("avatar"), changeAvatar);

router.route("/change-password").post(verifyJwt, changePassword);

router.route("/change-fullname").post(verifyJwt, changeFullName);

export default router;
