import { Router } from "express";
import {
  updateCoverImage,
  updateAvatar,
  changeFullName,
  changePassword,
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

// Test Routes

// Secured routes

router.route("/logout").post(verifyJwt, logoutUser);

router.route("/refresh-token").post(refreshAccessToken);

router.route("/get-current-user").get(verifyJwt, getCurrentUser);

router.route("/change-password").post(verifyJwt, changePassword);

router.route("/change-fullname").post(verifyJwt, changeFullName);

router
  .route("/update-avatar")
  .post(verifyJwt, upload.single("avatar"), updateAvatar);

router
  .route("/update-cover-image")
  .post(verifyJwt, upload.single("coverImage"), updateCoverImage);

export default router;
