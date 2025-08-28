import axios from 'axios';
import { ApiResponse } from '../types/api';
import { 
  AuditTaskResponse, 
  AuditResultSubmissionRequest, 
  AuditResultSubmissionResponse 
} from '../types/auditor';

// 使用相对路径，通过Next.js代理转发到后端
const apiClient = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 获取审核任务 - 将敏感参数移至请求体
export const getAuditTasks = async (
  auditorLevel: number
): Promise<ApiResponse<AuditTaskResponse>> => {
  try {
    const response = await apiClient.post('/api/proxy', {
      path: '/api/auditor/tasks',
      method: 'POST',
      data: { level: auditorLevel }
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return error.response.data;
    }
    throw error;
  }
};

// 提交审核结果
export const submitAuditResult = async (
  request: AuditResultSubmissionRequest
): Promise<ApiResponse<AuditResultSubmissionResponse>> => {
  try {
    const response = await apiClient.post('/api/proxy', {
      path: '/api/auditor/result',
      method: 'POST',
      data: request
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return error.response.data;
    }
    throw error;
  }
};

// 格式化手机号显示
export const formatPhone = (phone: string): string => {
  if (!phone || phone.length !== 11) return phone;
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
};

// 格式化时间显示
export const formatDateTime = (dateTime: string): string => {
  const date = new Date(dateTime);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 获取风险类型对应的样式类
export const getRiskTypeBadgeClass = (riskType: string): string => {
  switch (riskType) {
    case '保守型':
      return 'badge-conservative';
    case '稳健型':
      return 'badge-moderate';
    case '激进型':
      return 'badge-aggressive';
    default:
      return 'badge-moderate';
  }
};

// 获取审核阶段显示文本
export const getStageText = (stage: number): string => {
  const stageMap: { [key: number]: string } = {
    0: '初审',
    1: '中审',
    2: '高审',
    3: '委员会审核'
  };
  return stageMap[stage] || '未知阶段';
};

// 验证审核表单
export const validateAuditForm = (
  approved: boolean,
  riskScore: number,
  opinion: string
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (riskScore < 0 || riskScore > 100) {
    errors.push('风险评分必须在0-100之间');
  }

  if (!opinion.trim()) {
    errors.push('请输入审核意见');
  } else if (opinion.trim().length < 5) {
    errors.push('审核意见至少需要5个字符');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};