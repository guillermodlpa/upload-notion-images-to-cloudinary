import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  secure: true,
});

export async function uploadImage(
  image: string,
  options = {}
): Promise<{ url: string }> {
  return cloudinary.uploader
    .upload(image, options)
    .then((result) => ({
      url: result.secure_url,
    }))
    .catch((error) => {
      console.error(error);
      return { url: "" };
    });
}
