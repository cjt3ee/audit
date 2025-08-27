// API 响应类型定义
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// 客户基本信息
export interface CustomerInfo {
  name: string;
  phone: string;
  idCard: string;
  email?: string;
  occupation?: string;
  investAmount: number;
}

// 风险评估信息
export interface RiskAssessment {
  annualIncome: number;
  investmentAmount: number;
  investmentExperience?: string;
  maxLoss: number;
  investmentTarget?: string;
  investmentExpire?: string;
  score: number;
}

// 问卷提交请求
export interface CustomerQuestionnaireRequest {
  customerInfo: CustomerInfo;
  riskAssessment: RiskAssessment;
}

// 审核状态响应
export interface AuditStatusResponse {
  customerId: number;
  status: 'not_found' | 'in_progress' | 'completed';
  message: string;
  results?: number[]; // 风险类型代码数组
}

// 表单数据类型
export interface FormData {
  name: string;
  phone: string;
  idCard: string;
  email: string;
  occupation: string;
  investAmount: string;
  age: string;
  income: string;
  experience: string;
  riskTolerance: string;
  goal: string;
  period: string;
}

// 风险评分相关
export interface RiskScoreConfig {
  score: number;
  level: '保守型投资者' | '稳健型投资者' | '激进型投资者';
  badgeClass: 'badge-conservative' | 'badge-moderate' | 'badge-aggressive';
  description: string;
}

// 选择答案记录
export interface SelectedAnswers {
  age?: string;
  income?: string;
  experience?: string;
  'risk-tolerance'?: string;
  goal?: string;
  period?: string;
}