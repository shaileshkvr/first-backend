import { v2 as cloudinary } from "cloudinary";
import { promises as fs } from "fs";
import ApiError from "./ApiError.js";

const uploadOnCloudinary = async (localFilePath) => {
  if (!localFilePath) {
    throw new ApiError(400, "Local file path is required for upload");
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  let uploadResponse;

  try {
    uploadResponse = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    return uploadResponse;
  } catch (error) {
    console.error("Cloudinary upload failed:", error.message);
    throw new ApiError(500, "Cloud upload failed");
  } finally {
    // This is for file cleanup
    try {
      await fs.unlink(localFilePath);
    } catch (unlinkErr) {
      // Warns if file deletion fails
      console.warn("Local file deletion failed:", unlinkErr.message);
    }
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
