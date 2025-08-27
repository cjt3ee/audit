import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:8080';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method, body, query } = req;
  const { path, ...otherParams } = query;
  
  // 构建目标URL
  let targetUrl = `${BACKEND_URL}/api/${Array.isArray(path) ? path.join('/') : path}`;
  
  // 添加查询参数
  const queryParams = new URLSearchParams();
  Object.keys(otherParams).forEach(key => {
    const value = otherParams[key];
    if (Array.isArray(value)) {
      value.forEach(v => queryParams.append(key, v));
    } else if (value) {
      queryParams.append(key, value);
    }
  });
  
  if (queryParams.toString()) {
    targetUrl += `?${queryParams.toString()}`;
  }
  
  try {
    const response = await axios({
      method: method as any,
      url: targetUrl,
      data: body,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    res.status(response.status).json(response.data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ 
        success: false, 
        message: '服务器内部错误',
        data: null 
      });
    }
  }
}