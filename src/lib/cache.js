import { LRUCache } from 'lru-cache';

// 创建LRU缓存实例，用于文章缓存
// 最多缓存100个文章，每个缓存有效期10分钟
const postCache = new LRUCache({
  max: 100,
  ttl: 1000 * 60 * 10, // 10分钟
  allowStale: false,
});

// 创建通用数据缓存实例，用于其他API请求
const dataCache = new LRUCache({
  max: 200,
  ttl: 1000 * 60 * 5, // 5分钟
  allowStale: false,
});

// 使用缓存获取文章详情
export async function getCachedPost(id, fetchFunction, skipCache = false) {
  const cacheKey = `post:${id}`;
  
  // 如果请求要求跳过缓存或者是开发环境，直接获取最新数据
  if (skipCache || process.env.NODE_ENV === 'development') {
    const data = await fetchFunction();
    
    // 仍然更新缓存以便后续使用
    if (data) {
      postCache.set(cacheKey, data);
    }
    
    return data;
  }
  
  // 尝试从缓存获取
  let cachedData = postCache.get(cacheKey);
  
  // 如果缓存中没有数据，则获取最新数据并缓存
  if (!cachedData) {
    cachedData = await fetchFunction();
    
    if (cachedData) {
      postCache.set(cacheKey, cachedData);
    }
  }
  
  return cachedData;
}

// 清除特定文章的缓存
export function clearPostCache(id) {
  const cacheKey = `post:${id}`;
  postCache.delete(cacheKey);
}

// 清除所有文章缓存
export function clearAllPostCache() {
  postCache.clear();
}

// 通用缓存获取数据函数
export async function getCachedData(key, fetchFunction, options = {}) {
  const { 
    ttl = 1000 * 60 * 5, // 默认5分钟
    skipCache = false,
    namespace = '' 
  } = options;
  
  const cacheKey = namespace ? `${namespace}:${key}` : key;
  
  // 如果请求要求跳过缓存或者是开发环境，直接获取最新数据
  if (skipCache || process.env.NODE_ENV === 'development') {
    const data = await fetchFunction();
    
    // 仍然更新缓存以便后续使用
    if (data) {
      dataCache.set(cacheKey, data, { ttl });
    }
    
    return data;
  }
  
  // 尝试从缓存获取
  let cachedData = dataCache.get(cacheKey);
  
  // 如果缓存中没有数据，则获取最新数据并缓存
  if (!cachedData) {
    cachedData = await fetchFunction();
    
    if (cachedData) {
      dataCache.set(cacheKey, cachedData, { ttl });
    }
  }
  
  return cachedData;
}

// 客户端缓存
const clientCache = typeof window !== 'undefined' ? new Map() : null;

// 客户端缓存获取数据
export async function clientCachedFetch(url, options = {}) {
  const { 
    maxAge = 60000, // 默认1分钟
    revalidate = false,
    dedupingInterval = 2000
  } = options;
  
  // 如果无法使用客户端缓存，直接返回fetch结果
  if (!clientCache) {
    return fetch(url).then(res => res.json());
  }
  
  const now = Date.now();
  const cacheKey = url;
  
  // 获取缓存数据
  const cachedData = clientCache.get(cacheKey);
  
  // 如果有缓存并且没有过期，直接返回缓存数据
  if (cachedData && (now - cachedData.timestamp < maxAge) && !revalidate) {
    return cachedData.data;
  }
  
  // 如果有请求正在进行中且在去重时间间隔内，复用该请求
  if (cachedData && cachedData.promise && (now - cachedData.requestTime < dedupingInterval)) {
    return cachedData.promise;
  }
  
  // 创建新请求
  const promise = fetch(url)
    .then(res => res.json())
    .then(data => {
      // 更新缓存
      clientCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        requestTime: now,
        promise: null
      });
      return data;
    });
  
  // 存储请求Promise以便去重
  clientCache.set(cacheKey, {
    ...cachedData,
    requestTime: now,
    promise
  });
  
  return promise;
} 