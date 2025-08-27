// 审核员相关类型定义
export interface AuditTaskDto {
  auditId: number;
  customerId: number;
  customerName: string;
  customerPhone: string;
  stage: number;
  riskScore: number;
  riskType: string;
  createdAt: string;
  investAmount?: number;
}

export interface AuditTaskResponse {
  auditorLevel: number;
  taskCount: number;
  tasks: AuditTaskDto[];
}

export interface AuditResultSubmissionRequest {
  auditId: number;
  auditorLevel: number;
  approved: boolean;
  riskScore: number;
  opinion: string;
}

export interface AuditResultSubmissionResponse {
  auditId: number;
  customerId: number;
  workflowStatus: string;
  message: string;
  nextStage?: number;
  isCompleted: boolean;
}

// 审核员级别映射
export const AUDITOR_LEVELS = {
  0: '初级审核员',
  1: '中级审核员', 
  2: '高级审核员',
  3: '投资委员会'
} as const;

// 审核阶段映射
export const AUDIT_STAGES = {
  0: '初级审核',
  1: '中级审核',
  2: '高级审核', 
  3: '委员会审核'
} as const;

// 工作流状态映射
export const WORKFLOW_STATUS = {
  forwarded: '已转交',
  completed: '已完成'
} as const;

// 风险类型样式映射
export const RISK_TYPE_STYLES = {
  '保守型': 'badge-conservative',
  '稳健型': 'badge-moderate',
  '激进型': 'badge-aggressive'
} as const;

// 审核统计数据
export interface AuditStats {
  pending: number;
  approved: number;
  needReview: number;
  totalAmount: string;
}

// 审核表单数据
export interface AuditForm {
  auditId: number;
  approved: boolean;
  riskScore: number;
  opinion: string;
}