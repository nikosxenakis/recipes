/**
 * Resize an image File to a max long-edge of `maxEdge` pixels via canvas.
 * Encodes back as JPEG (smaller than PNG for photos, fine for vision LLM input).
 * Returns the resized Blob and its mime type.
 */
export async function resizeImage(file: File, maxEdge = 2400, quality = 0.9): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const longEdge = Math.max(bitmap.width, bitmap.height);
  const scale = longEdge > maxEdge ? maxEdge / longEdge : 1;
  const targetW = Math.round(bitmap.width * scale);
  const targetH = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context unavailable");
  }
  ctx.drawImage(bitmap, 0, 0, targetW, targetH);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality)
  );
  if (!blob) {
    throw new Error("Failed to encode image");
  }
  return blob;
}
