import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";

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
    avatar: avatar.secure_url,
    coverImage: coverImage?.secure_url || null,
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

export { registerUser };
