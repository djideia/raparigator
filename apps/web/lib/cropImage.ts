export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
): Promise<string> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
  });

  const safeX = Math.max(0, Math.floor(pixelCrop.x));
  const safeY = Math.max(0, Math.floor(pixelCrop.y));
  const safeWidth = Math.min(
    Math.max(1, Math.floor(pixelCrop.width)),
    Math.max(1, image.naturalWidth - safeX),
  );
  const safeHeight = Math.min(
    Math.max(1, Math.floor(pixelCrop.height)),
    Math.max(1, image.naturalHeight - safeY),
  );

  const canvas = document.createElement("canvas");
  canvas.width = safeWidth;
  canvas.height = safeHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return "";
  }

  ctx.drawImage(image, safeX, safeY, safeWidth, safeHeight, 0, 0, safeWidth, safeHeight);

  return canvas.toDataURL("image/jpeg", 0.92);
}
