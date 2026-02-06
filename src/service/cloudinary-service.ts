import { v2 as cloudinary } from "cloudinary";
import { ResponseError } from "../error/response-error";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export class CloudinaryService {
  static async uploadImageProduct(
    file: File,
    folder: string = "sinari-cell/products",
    fileName?: string,
  ): Promise<string> {
    if (!file.type.startsWith("image/")) {
      throw new ResponseError(
        400,
        "File must be an image format (jpg, png, webp)",
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new ResponseError(400, "Image size must be less than 5MB");
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: "image",
          public_id: fileName,
          use_filename: true,
          unique_filename: !fileName,
          overwrite: true,

          transformation: [
            { effect: "background_removal" },

            {
              width: 1000,
              height: 1000,
              crop: "pad",
              background: "white",
            },
            {
              quality: "auto:best",
              fetch_format: "webp",
            },
          ],
        },
        (error, result) => {
          if (error) {
            return reject(
              new ResponseError(500, `Image upload failed: ${error.message}`),
            );
          }
          if (!result) {
            return reject(
              new ResponseError(500, "Image upload result is empty"),
            );
          }

          resolve(result.secure_url);
        },
      );

      uploadStream.end(buffer);
    });
  }

  static async uploadImageSignature(
    file: File,
    folder: string = "sinari-cell/technicians",
    fileName?: string,
  ): Promise<string> {
    if (!file.type.startsWith("image/")) {
      throw new ResponseError(
        400,
        "File must be an image format (jpg, png, webp)",
      );
    }

    if (file.size > 2 * 1024 * 1024) {
      throw new ResponseError(400, "Signature size must be less than 2MB");
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: "image",
          public_id: fileName,
          use_filename: true,
          unique_filename: !fileName,
          overwrite: true,
          transformation: [
            {
              width: 400,
              height: 200,
              crop: "limit",
            },
            {
              quality: "auto:good",
              fetch_format: "png",
            },
          ],
        },
        (error, result) => {
          if (error) {
            return reject(
              new ResponseError(
                500,
                `Signature upload failed: ${error.message}`,
              ),
            );
          }
          if (!result) {
            return reject(
              new ResponseError(500, "Signature upload result is empty"),
            );
          }
          resolve(result.secure_url);
        },
      );

      uploadStream.end(buffer);
    });
  }

  static async deleteImage(url: string): Promise<void> {
    try {
      const rootFolder = "sinari-cell";
      const parts = url.split("/");
      const rootIndex = parts.indexOf(rootFolder);

      if (rootIndex === -1) {
        console.warn("Could not find root folder in URL for deletion");
        return;
      }

      const relativePath = parts.slice(rootIndex);
      const publicIdWithExt = relativePath.join("/");
      const publicId = publicIdWithExt.replace(/\.[^/.]+$/, "");
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      throw new ResponseError(500, `Image delete failed`);
    }
  }
}
