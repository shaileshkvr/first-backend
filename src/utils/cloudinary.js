import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(
      localFilePath,
      { resource_type: "auto" },
      (error, result) => {}
    );
    console.log("File is uploaded on cloudinary", response.url);
    console.log(response);
  } catch (error) {
    // Removing locally saved file if upload fails
    fs.unlinkSync(localFilePath);
    return null;
  }
};
