import sharp from "sharp";

const MAX_WIDTH = 800;
const MAX_HEIGHT = 800;

export async function resizeImage(file: File) {
  // Convert File to Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Load image with sharp
  const image = sharp(buffer);
  const metadata = await image.metadata();

  // Resize if needed while maintaining aspect ratio
  if (
    (metadata.width && metadata.width > MAX_WIDTH) ||
    (metadata.height && metadata.height > MAX_HEIGHT)
  ) {
    image.resize(MAX_WIDTH, MAX_HEIGHT, {
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  // Convert to buffer for upload
  return image.toBuffer();
}
