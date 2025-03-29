export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

// 生成QR码URL
export function generateQRCodeURL(url, size = 150) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}`;
}

// Performance utilities
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// 内存缓存实现
export const memoryCache = {
  cache: new Map(),
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    const now = Date.now();
    if (item.expiry && item.expiry < now) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  },
  set(key, value, ttl = 60000) { // Default TTL: 1 minute
    const expiry = ttl ? Date.now() + ttl : null;
    this.cache.set(key, { value, expiry });
  },
  delete(key) {
    this.cache.delete(key);
  },
  clear() {
    this.cache.clear();
  }
};

// 懒加载图片检测
export function setupLazyLoading() {
  if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
    const lazyImageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const lazyImage = entry.target;
          lazyImage.src = lazyImage.dataset.src;
          lazyImage.classList.remove('lazy');
          lazyImageObserver.unobserve(lazyImage);
        }
      });
    });

    const lazyImages = document.querySelectorAll('img.lazy');
    lazyImages.forEach((lazyImage) => {
      lazyImageObserver.observe(lazyImage);
    });
    
    return lazyImageObserver;
  }
  return null;
} 