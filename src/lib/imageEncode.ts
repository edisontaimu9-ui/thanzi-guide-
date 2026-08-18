// Ported from Oasis CNST's packaged-foods label scanner
// (_pkgResizeAndEncodeImage). Downscales a photo to a reasonable max
// dimension and re-encodes as JPEG before it goes over the wire — keeps
// label-scan uploads small and fast on typical Malawian mobile data.

export function resizeAndEncodeImage(file: File, maxDim = 1600, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      let { width, height } = img;
      if (width > height && width > maxDim) {
        height = Math.round(height * (maxDim / width));
        width = maxDim;
      } else if (height > maxDim) {
        width = Math.round(width * (maxDim / height));
        height = maxDim;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Could not process that image.'));
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(new Error('Could not read that image file.'));
    img.src = URL.createObjectURL(file);
  });
}
