import { put } from "@vercel/blob";

export async function uploadFile(file: File) {
  const { url } = await put(file.name, file, {
    access: "public",
    addRandomSuffix: true,
  });
  return url;
}
