import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import ApiError from "./ApiError.js";

const uploadOnCloudinary = async (localFilePath) => {
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

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
    return new ApiError(500, "Cloud upload failed");
  }
};

const deleteFromCloudinary = async (publicId) => {
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    if (!publicId) {
      throw new ApiError(400, "Public ID is required to delete resource");
    }
    const res = await cloudinary.uploader.destroy(publicId);
    return res;
  } catch (error) {
    throw new ApiError(500, "Failed to delete resource from Cloudinary");
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
