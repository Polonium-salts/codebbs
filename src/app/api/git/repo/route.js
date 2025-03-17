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

// 处理GET请求 - 获取仓库信息
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const platform = url.searchParams.get('platform');
    const owner = url.searchParams.get('owner');
    const repo = url.searchParams.get('repo');

    if (!platform || !owner || !repo) {
      return NextResponse.json(
        { message: '缺少必需参数: platform, owner, repo' },
        { status: 400 }
      );
    }

    const client = getPlatformClient(platform);

    // 获取仓库信息
    const repoResponse = await client.request(`GET /repos/${owner}/${repo}`);
    const repoData = repoResponse.data;

    // 获取分支列表
    const branchesResponse = await client.request(`GET /repos/${owner}/${repo}/branches`);
    const branches = branchesResponse.data.map(branch => branch.name);

    return NextResponse.json({
      repository: {
        name: repoData.name,
        description: repoData.description,
        default_branch: repoData.default_branch,
        private: repoData.private,
        html_url: repoData.html_url,
        clone_url: repoData.clone_url,
        stargazers_count: repoData.stargazers_count,
        watchers_count: repoData.watchers_count,
        forks_count: repoData.forks_count
      },
      branches,
      hasToken: !!process.env[`${platform.toUpperCase()}_TOKEN`]
    });
  } catch (error) {
    console.error('Git API 错误:', error);

    // 处理常见的API错误
    if (error.status === 404) {
      return NextResponse.json(
        { message: '找不到指定的仓库' },
        { status: 404 }
      );
    } else if (error.status === 403) {
      return NextResponse.json(
        { message: 'API速率限制已达到或权限不足，请考虑添加平台Token' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { message: error.message || '获取仓库信息失败' },
      { status: error.status || 500 }
    );
  }
} 