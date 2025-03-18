import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/core';
import https from 'https';

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
      },
      agent: new https.Agent({
        rejectUnauthorized: false // 忽略证书验证
      })
    }
  });
};

// 处理GET请求 - 获取仓库内容
export async function GET(request) {
  try {
    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform') || 'github';
    const owner = searchParams.get('owner');
    const repo = searchParams.get('repo');
    const path = searchParams.get('path') || '';
    const branch = searchParams.get('branch') || 'main';
    
    // 必要参数验证
    if (!owner || !repo) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }
    
    // 从环境变量获取GitHub token
    const githubToken = process.env.GITHUB_TOKEN;
    
    // 创建Octokit实例，配置忽略证书验证
    const octokit = new Octokit({
      auth: githubToken,
      request: {
        agent: new https.Agent({
          rejectUnauthorized: false // 忽略证书验证
        })
      }
    });
    
    // 根据平台和请求的路径决定请求方式
    if (platform === 'github') {
      try {
        // 请求GitHub API获取仓库内容
        const response = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
          owner,
          repo,
          path,
          ref: branch
        });
        
        // 处理目录和文件的不同响应
        if (Array.isArray(response.data)) {
          // 如果是目录，返回文件列表
          const contents = response.data.map(item => ({
            name: item.name,
            path: item.path,
            type: item.type,
            size: item.size,
            url: item.html_url
          }));
          
          return NextResponse.json(contents);
        } else {
          // 如果是文件，返回文件内容
          const fileContent = Buffer.from(response.data.content, 'base64').toString('utf-8');
          
          return NextResponse.json({
            name: response.data.name,
            path: response.data.path,
            type: response.data.type,
            size: response.data.size,
            url: response.data.html_url,
            content: fileContent
          });
        }
      } catch (error) {
        console.error('GitHub API 请求错误:', error);
        return NextResponse.json(
          { error: error.message || 'GitHub API 请求失败' },
          { status: error.status || 500 }
        );
      }
    } else {
      // 其他Git平台的处理逻辑
      return NextResponse.json(
        { error: `暂不支持 ${platform} 平台` },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Git内容获取错误:', error);
    return NextResponse.json(
      { error: '获取Git内容时发生错误' },
      { status: 500 }
    );
  }
} 