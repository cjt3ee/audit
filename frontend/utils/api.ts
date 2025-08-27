import axios from 'axios';
import { ApiResponse, CustomerQuestionnaireRequest, AuditStatusResponse } from '../types/api';

// 使用相对路径，通过Next.js代理转发到后端
const apiClient = axios.create({
  baseURL: '', // 使用相对路径，由Next.js rewrites代理
  headers: {
    'Content-Type': 'application/json',
  },
});

// 提交客户问卷
export const submitQuestionnaire = async (
  request: CustomerQuestionnaireRequest
): Promise<ApiResponse<number>> => {
  try {
    const response = await apiClient.post('/api/proxy?path=customer/questionnaire', request);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return error.response.data;
    }
    throw error;
  }
};

// 查询审核状态
export const getAuditStatus = async (
  customerId: number
): Promise<ApiResponse<AuditStatusResponse>> => {
  try {
    const response = await apiClient.get(`/api/proxy?path=customer/audit-status/${customerId}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return error.response.data;
    }
    throw error;
  }
};