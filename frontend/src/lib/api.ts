import axios, { AxiosResponse } from 'axios';

// 定义接口数据类型
interface CustomerInfo {
  name: string;
  phone: string;
  idCard: string;
  email?: string;
  occupation?: string;
  investAmount: number;
}

interface RiskAssessment {
  annualIncome: number;
  investmentAmount: number;
  investmentExperience?: string;
  maxLoss: number;
  investmentTarget?: string;
  investmentExpire?: string;
  score: number;
}

interface QuestionnaireRequest {
  customerInfo: CustomerInfo;
  riskAssessment: RiskAssessment;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// 创建 axios 实例
const api = axios.create({
  baseURL: 'http://localhost:8080/api', // 后端服务地址
  timeout: 10000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 在发送请求之前做些什么
    console.log('发送请求:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    // 对请求错误做些什么
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    // 对响应数据做点什么
    console.log('响应数据:', response.status, response.data);
    return response;
  },
  (error) => {
    // 对响应错误做点什么
    console.error('响应错误:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

// API 接口函数
export const customerAPI = {
  // 提交客户问卷
  submitQuestionnaire: (data: QuestionnaireRequest): Promise<AxiosResponse<ApiResponse<number>>> => {
    return api.post('/customer/questionnaire', data);
  },
  
  // 查询审核状态
  getAuditStatus: (customerId: number): Promise<AxiosResponse<ApiResponse<any>>> => {
    return api.get(`/customer/audit-status/${customerId}`);
  },
  
  // 根据审核阶段获取审核列表
  getAuditsByStage: (auditStage: number): Promise<AxiosResponse<ApiResponse<any>>> => {
    return api.get(`/audit/status/stage/${auditStage}`);
  },
};

export default api;
