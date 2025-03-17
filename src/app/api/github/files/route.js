import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/core';

// 获取GitHub API认证token
const getGitHubToken = () => {
  return process.env.GITHUB_TOKEN || null;
};

// 创建Octokit实例
const createOctokit = () => {
  const token = getGitHubToken();
  if (token) {
    return new Octokit({ auth: token });
  }
  return new Octokit();
};

// 处理GET请求 - 获取仓库文件/文件夹列表
export async function GET(request) {
  try {
    // 从URL参数获取仓库信息
    const url = new URL(request.url);
    const owner = url.searchParams.get('owner');
    const repo = url.searchParams.get('repo');
    const path = url.searchParams.get('path') || '';
    const ref = url.searchParams.get('ref') || 'main';
    
    if (!owner || !repo) {
      return NextResponse.json(
        { message: '缺少必需参数: owner, repo' },
        { status: 400 }
      );
    }
    
    const octokit = createOctokit();
    
    // 获取仓库内容
    const response = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
      owner,
      repo,
      path,
      ref,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
    
    if (Array.isArray(response.data)) {
      // 返回目录内容
      const contents = response.data.map(item => ({
        name: item.name,
        path: item.path,
        type: item.type,
        size: item.size,
        sha: item.sha,
        url: item.html_url
      }));
      
      return NextResponse.json({
        contents,
        path,
        hasToken: !!getGitHubToken()
      });
    } else {
      // 返回单个文件信息
      return NextResponse.json({
        name: response.data.name,
        path: response.data.path,
        type: response.data.type,
        size: response.data.size,
        sha: response.data.sha,
        url: response.data.html_url,
        content: Buffer.from(response.data.content, 'base64').toString('utf-8'),
        hasToken: !!getGitHubToken()
      });
    }
  } catch (error) {
    console.error('GitHub API 错误:', error);
    
    // 处理常见的GitHub API错误
    if (error.status === 404) {
      return NextResponse.json(
        { message: '找不到指定的仓库或路径' },
        { status: 404 }
      );
    } else if (error.status === 403) {
      return NextResponse.json(
        { message: 'API速率限制已达到或权限不足，请考虑添加GITHUB_TOKEN环境变量' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { message: error.message || '获取GitHub仓库内容失败' },
      { status: error.status || 500 }
    );
  }
}

// 处理POST请求 - 获取特定文件内容
export async function POST(request) {
  try {
    // 从请求体获取仓库信息
    const { owner, repo, path, ref = 'main' } = await request.json();
    
    if (!owner || !repo || !path) {
      return NextResponse.json(
        { message: '缺少必需参数: owner, repo, path' },
        { status: 400 }
      );
    }
    
    const octokit = createOctokit();
    
    // 获取文件内容
    const response = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
      owner,
      repo,
      path,
      ref,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
    
    // 确保是文件而不是目录
    if (Array.isArray(response.data)) {
      return NextResponse.json(
        { message: '提供的路径是目录，不是文件' },
        { status: 400 }
      );
    }
    
    // 解码文件内容（Base64 -> UTF-8）
    const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
    
    return NextResponse.json({
      name: response.data.name,
      path: response.data.path,
      content,
      size: response.data.size,
      sha: response.data.sha,
      hasToken: !!getGitHubToken()
    });
  } catch (error) {
    console.error('GitHub API 错误:', error);
    
    // 处理常见的GitHub API错误
    if (error.status === 404) {
      return NextResponse.json(
        { message: '找不到指定的文件' },
        { status: 404 }
      );
    } else if (error.status === 403) {
      return NextResponse.json(
        { message: 'API速率限制已达到或权限不足，请考虑添加GITHUB_TOKEN环境变量' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { message: error.message || '获取文件内容失败' },
      { status: error.status || 500 }
    );
  }
}

// 处理PUT请求 - 搜索仓库文件
export async function PUT(request) {
  try {
    // 从请求体获取搜索参数
    const { owner, repo, query, ref = 'main' } = await request.json();
    
    if (!owner || !repo || !query) {
      return NextResponse.json(
        { message: '缺少必需参数: owner, repo, query' },
        { status: 400 }
      );
    }
    
    const octokit = createOctokit();
    
    // 使用GitHub搜索API
    const response = await octokit.request('GET /search/code', {
      q: `repo:${owner}/${repo} ${query}`,
      per_page: 30,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
    
    // 格式化搜索结果
    const results = response.data.items.map(item => ({
      name: item.name,
      path: item.path,
      url: item.html_url,
      repository: {
        name: item.repository.name,
        url: item.repository.html_url
      }
    }));
    
    return NextResponse.json({
      total_count: response.data.total_count,
      results,
      hasToken: !!getGitHubToken()
    });
  } catch (error) {
    console.error('GitHub API 搜索错误:', error);
    
    // 处理常见的GitHub API错误
    if (error.status === 403) {
      return NextResponse.json(
        { message: 'API速率限制已达到或权限不足，搜索功能需要GITHUB_TOKEN环境变量' },
        { status: 403 }
      );
    } else if (error.status === 422) {
      return NextResponse.json(
        { message: '搜索查询无效或超出限制' },
        { status: 422 }
      );
    }
    
    return NextResponse.json(
      { message: error.message || '搜索仓库文件失败' },
      { status: error.status || 500 }
    );
  }
} 