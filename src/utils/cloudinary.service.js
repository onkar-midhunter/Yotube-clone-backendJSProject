import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { extractPublicId } from "./extractPublicId.js";
import { ApiError } from "./apiError.js";

const configureCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
};

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    // Configure Cloudinary before uploading
    configureCloudinary();

    //upload the file on Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
   
    // Check if we have a valid response
    if (!response || !response.secure_url) {
      throw new Error("No secure URL received from Cloudinary");
    }
    console.log(`response is: ${response}`);

 

    // Remove the local file after successful upload
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    return response;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    // Clean up local file if it exists
    if (localFilePath && fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    // Return null to indicate upload failure
    return null;
  }
};

const deleteFromCloudinary = async (url, resourceType = "image") => {
  try {
    if (!url) {
      throw new Error("Cloudinary URL is required");
    }

    configureCloudinary();

    // Extract public_id from the Cloudinary URL
    const publicId = extractPublicId(url);

    // Delete from Cloudinary
    const response = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType, // 'image' or 'video'
    });

    return response;
  } catch (error) {
    console.error("Cloudinary deletion error:", error);
    throw new ApiError(400, "Problem while deletion in cloudinary");
    return null;
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
