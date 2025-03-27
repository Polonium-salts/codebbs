export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

// 生成QR码URL
export function generateQRCodeURL(url, size = 150) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}`;
} 