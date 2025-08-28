import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import https from 'https';

const BACKEND_URL = process.env.NODE_ENV === 'production' 
  ? 'https://localhost:8443' 
  : 'https://localhost:8443'; // 本地测试也使用HTTPS

// 仅在开发环境下忽略SSL证书验证（用于自签名证书）
const httpsAgent = new https.Agent({
  rejectUnauthorized: process.env.NODE_ENV === 'production'
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method, body, query } = req;
  
  let targetPath: string;
  let requestData: any;
  let queryParams: URLSearchParams = new URLSearchParams();
  
  // 检查是否是新的请求格式（通过body传递path和data）
  if (body && typeof body === 'object' && body.path) {
    targetPath = body.path;
    requestData = body.data || {};
  } else {
    // 原有的请求格式（通过query传递path）
    const { path, ...otherParams } = query;
    targetPath = Array.isArray(path) ? path.join('/') : (path as string);
    requestData = body;
    
    // 添加查询参数
    Object.keys(otherParams).forEach(key => {
      const value = otherParams[key];
      if (Array.isArray(value)) {
        value.forEach(v => queryParams.append(key, v));
      } else if (value) {
        queryParams.append(key, value);
      }
    });
  }
  
  // 构建目标URL
  let targetUrl: string;
  
  if (body && typeof body === 'object' && body.path) {
    // 新格式：直接使用完整路径
    targetUrl = `${BACKEND_URL}${targetPath}`;
  } else {
    // 原有格式：在路径前添加 /api
    targetUrl = `${BACKEND_URL}/api/${targetPath}`;
  }
  
  if (queryParams.toString()) {
    targetUrl += `?${queryParams.toString()}`;
  }
  
  try {
    console.log(`Proxy request: ${method} ${targetUrl}`);
    console.log('Request data:', JSON.stringify(requestData, null, 2));
    
    const response = await axios({
      method: method as any,
      url: targetUrl,
      data: requestData,
      headers: {
        'Content-Type': 'application/json',
      },
      httpsAgent,
      timeout: 10000,
    });
    
    console.log(`Proxy response: ${response.status}`);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Proxy error:', error);
    
    if (axios.isAxiosError(error) && error.response) {
      console.error(`Backend error: ${error.response.status} - ${error.response.data}`);
      res.status(error.response.status).json(error.response.data);
    } else if (axios.isAxiosError(error) && error.code === 'ECONNREFUSED') {
      console.error('Backend connection refused - is the backend server running?');
      res.status(503).json({ 
        success: false, 
        message: '后端服务器连接失败，请确保后端服务已启动',
        data: null 
      });
    } else {
      console.error('Unknown error:', error);
      res.status(500).json({ 
        success: false, 
        message: '服务器内部错误',
        data: null 
      });
    }
  }
}