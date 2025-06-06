import { put } from "@vercel/blob";
import { resizeImage } from "./resizeImage.server";

export async function uploadFile(file: File) {
  // Convert to buffer for upload
  const resizedBuffer = await resizeImage(file);

  // Upload resized image
  const { url } = await put(file.name, resizedBuffer, {
    access: "public",
    addRandomSuffix: true,
  });

  return url;
}
