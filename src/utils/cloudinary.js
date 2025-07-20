import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import ApiError from "./ApiError.js";

const uploadOnCloudinary = async (localFilePath) => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  try {
    if (!localFilePath) {
      throw new Error(400, "Local file path is required for upload");
    }
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // Removing the local file after upload
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    // Removing locally saved file if upload fails
    fs.unlinkSync(localFilePath);
    return new ApiError(500, "Cloudinary upload failed");
  }
};

export default uploadOnCloudinary;
