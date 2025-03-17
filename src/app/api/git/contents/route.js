import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/core';

// 支持的Git平台配置
const GIT_PLATFORMS = {
  github: {
    apiBase: 'https://api.github.com',
    defaultBranch: 'main'
  },
  gitee: {
    apiBase: 'https://gitee.com/api/v5',
    defaultBranch: 'master'
  },
  gitlab: {
    apiBase: 'https://gitlab.com/api/v4',
    defaultBranch: 'main'
  },
  gitea: {
    apiBase: 'https://gitea.com/api/v1',
    defaultBranch: 'main'
  }
};

// 获取平台特定的API客户端
const getPlatformClient = (platform) => {
  const config = GIT_PLATFORMS[platform];
  if (!config) {
    throw new Error('Unsupported Git platform');
  }

  const token = process.env[`${platform.toUpperCase()}_TOKEN`];
  return new Octokit({
    baseUrl: config.apiBase,
    auth: token,
    request: {
      headers: {
        'Accept': 'application/vnd.github.v3+json'
      }
    }
  });
};

// 处理GET请求 - 获取仓库内容
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const platform = url.searchParams.get('platform');
    const owner = url.searchParams.get('owner');
    const repo = url.searchParams.get('repo');
    const path = url.searchParams.get('path') || '';
    const branch = url.searchParams.get('branch') || GIT_PLATFORMS[platform].defaultBranch;

    if (!platform || !owner || !repo) {
      return NextResponse.json(
        { message: '缺少必需参数: platform, owner, repo' },
        { status: 400 }
      );
    }

    const client = getPlatformClient(platform);

    // 获取目录内容
    const response = await client.request(`GET /repos/${owner}/${repo}/contents/${path}`, {
      ref: branch
    });

    // 处理单个文件和目录列表
    if (Array.isArray(response.data)) {
      // 目录内容
      return NextResponse.json(response.data.map(item => ({
        name: item.name,
        path: item.path,
        type: item.type,
        size: item.size,
        url: item.url,
        html_url: item.html_url,
        download_url: item.download_url
      })));
    } else {
      // 单个文件
      return NextResponse.json({
        name: response.data.name,
        path: response.data.path,
        type: 'file',
        size: response.data.size,
        content: Buffer.from(response.data.content, 'base64').toString('utf-8'),
        url: response.data.url,
        html_url: response.data.html_url,
        download_url: response.data.download_url
      });
    }
  } catch (error) {
    console.error('Git API 错误:', error);

    // 处理常见的API错误
    if (error.status === 404) {
      return NextResponse.json(
        { message: '找不到指定的文件或目录' },
        { status: 404 }
      );
    } else if (error.status === 403) {
      return NextResponse.json(
        { message: 'API速率限制已达到或权限不足，请考虑添加平台Token' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { message: error.message || '获取仓库内容失败' },
      { status: error.status || 500 }
    );
  }
} 