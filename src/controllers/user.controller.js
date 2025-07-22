import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import User from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";

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
  await User.findOneAndUpdate(
    req.user._id,
    {
      $set: { refreshToken: undefined },
    },
    { new: true }
  );
  const cookieOptions = {
    httpOnly: true,
    secure: true,
    expires: new Date(Date.now() - 1000),
  };

  res
    .status(200)
    .clearCookie("refreshToken", "", cookieOptions)
    .clearCookie("accessToken", "", cookieOptions)
    .json(new ApiResponse(200, null, "User logged out"));
});

export { registerUser, loginUser, logoutUser };
