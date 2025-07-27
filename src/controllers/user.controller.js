import jwt from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import User from "../models/user.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "generateAccessAndRefreshTokens: Something went wrong while generating tokens"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, username, email, password } = req.body;
  // Check for empty field
  if ([fullName, username, email, password].some((e) => e.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  // Check is user exists
  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (existingUser) {
    throw new ApiError(409, "User already exists with this email or username");
  }

  // check if multer uploaded files
  const avatarLocalPath = req.files?.avatar[0].path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image is required");
  }

  // upload files and again check for avatar because it is required
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatar?.secure_url) {
    throw new ApiError(400, "Failed to upload avatar");
  }

  // Done with all checks, create user
  const user = await User.create({
    fullName,
    username: username.toLowerCase(),
    email,
    password,
    avatar: {
      url: avatar.secure_url,
      id: avatar.public_id,
    },
    coverImage: {
      url: coverImage?.secure_url || "",
      id: coverImage?.public_id || "",
    },
  });

  if (!user) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  const userObject = user.toObject();
  // remove sensitive data
  delete userObject.password;
  delete userObject.refreshToken;

  return res
    .status(201)
    .json(new ApiResponse(201, userObject, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // access username or email and password
  const { username, email, password } = req.body;
  if (!username && !email) {
    throw new ApiError(400, "Username or email is required");
  }

  // verify if user exists
  const user = await User.findOne({
    $or: [{ email }, { username }],
  }).select("+password");

  if (!user) {
    throw new ApiError(401, "User with this username or email does not exist");
  }

  // verify password
  const isPasswordValid = await user.isPasswordValid(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

  // generate access and refresh tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  // find user again to remove sensitive data
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const cookieOptions = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .cookie("accessToken", accessToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    $set: { refreshToken: undefined },
  });

  const cookieOptions = {
    httpOnly: true,
    secure: true,
    expires: new Date(Date.now() - 1000),
  };

  return res
    .status(200)
    .clearCookie("refreshToken", "", cookieOptions)
    .clearCookie("accessToken", "", cookieOptions)
    .json(new ApiResponse(200, null, "User logged out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incommingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;
  if (!incommingRefreshToken) {
    throw new ApiError(401, "Unauthorized Request");
  }
  try {
    const decodedToken = jwt.verify(
      incommingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "Unauthorized: Invalid Token");
    }

    if (user?.refreshToken !== incommingRefreshToken) {
      throw new ApiError(401, "Refresh token is expired");
    }

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    const cookiesOptions = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("refreshToken", newRefreshToken, cookiesOptions)
      .cookie("accessToken", accessToken, cookiesOptions)
      .json(
        new ApiResponse(
          200,
          { user, accessToken, refreshToken: newRefreshToken },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(
      401,
      error?.message || "Unauthorized: Invalid or expired refresh token"
    );
  }
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

const changeFullName = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?._id);

  if (!newFullName || newFullName.trim() === "") {
    throw new ApiError(400, "Full name is required");
  }

  user.fullName = newFullName;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Full name changed successfully"));
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);
  const isPasswordValid = await user.isPasswordValid(currentPassword);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid Current Password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Password changed successfully"));
});

const updateAvatar = asyncHandler(async (req, res) => {
  const localAvatarPath = req.file?.path;

  if (!localAvatarPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.findById(req.user._id);
  const avatarPublicId = user.avatar?.id;

  // delete old avatar from cloudinary if exists

  const avatar = await uploadOnCloudinary(localAvatarPath);
  if (!avatar?.secure_url) {
    throw new ApiError(400, "Failed to upload avatar on cloud");
  }

  user.avatar = {
    url: avatar.secure_url,
    id: avatar.public_id,
  };
  await user.save({ validateBeforeSave: false });

  const userObj = user.toObject();
  // remove sensitive data
  delete userObj.password;
  delete userObj.refreshToken;

  return res
    .status(200)
    .json(new ApiResponse(200, userObj, "Avatar updated successfully"));
});

const updateCoverImage = asyncHandler(async (req, res) => {
  const localCoverImagePath = req.file?.path;

  if (!localCoverImagePath) {
    throw new ApiError(400, "cover file is required");
  }

  const user = await User.findById(req.user._id);
  const coverImagePublicId = user.coverImage?.id;

  // delete old cover image from cloudinary if exists

  const coverImage = await uploadOnCloudinary(localCoverImagePath);
  if (!coverImage?.secure_url) {
    throw new ApiError(400, "Failed to upload cover image on cloud");
  }

  user.coverImage = {
    url: coverImage.secure_url,
    id: coverImage.public_id,
  };
  await user.save({ validateBeforeSave: false });

  const userObj = user.toObject();
  // remove sensitive data
  delete userObj.password;
  delete userObj.refreshToken;

  return res
    .status(200)
    .json(new ApiResponse(200, userObj, "Cover image updated successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  changeFullName,
  getCurrentUser,
  updateAvatar,
  updateCoverImage,
};
