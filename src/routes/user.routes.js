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
  getUserChannelProfile,
  getWatchHistory,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

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

router.route("/change-fullname").patch(verifyJwt, changeFullName);

router
  .route("/update-avatar")
  .patch(verifyJwt, upload.single("avatar"), updateAvatar);

router
  .route("/update-cover-image")
  .patch(verifyJwt, upload.single("coverImage"), updateCoverImage);

router.route("/channel/:username").get(verifyJwt, getUserChannelProfile);

router.route("/history").get(verifyJwt, getWatchHistory);

export default router;
