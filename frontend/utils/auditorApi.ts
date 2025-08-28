import axios from 'axios';
import { ApiResponse } from '../types/api';
import { 
  AuditTaskResponse, 
  AuditTaskDto,
  AuditResultSubmissionRequest, 
  AuditResultSubmissionResponse,
  AuditResultDto
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
  auditorLevel: number,
  auditorId: number
): Promise<ApiResponse<AuditTaskResponse>> => {
  try {
    const response = await apiClient.post('/api/proxy', {
      path: '/api/auditor/tasks',
      method: 'POST',
      data: { level: auditorLevel, auditorId: auditorId }
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return error.response.data;
    }
    throw error;
  }
};

// 获取审核历史
export const getAuditHistory = async (
  auditId: number
): Promise<ApiResponse<AuditResultDto[]>> => {
  try {
    const response = await apiClient.get(`/api/proxy?path=auditor/audit-history/${auditId}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return error.response.data;
    }
    throw error;
  }
};

// 获取审核员历史记录
export const getAuditorHistory = async (
  auditorId: number
): Promise<ApiResponse<AuditResultDto[]>> => {
  try {
    const response = await apiClient.get(`/api/proxy?path=auditor/history/${auditorId}`);
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

// 本地任务缓存管理
const TASK_CACHE_KEY = 'audit_task_cache';

interface TaskCache {
  [auditorLevel: string]: {
    tasks: AuditTaskDto[];
    timestamp: number;
    assignedTaskIds: number[]; // 已分配给当前审核员的任务ID数组
  }
}

// 获取本地缓存的任务
export const getCachedTasks = (auditorLevel: number): AuditTaskDto[] => {
  try {
    const cache = localStorage.getItem(TASK_CACHE_KEY);
    if (!cache) return [];
    
    const taskCache: TaskCache = JSON.parse(cache);
    const levelKey = auditorLevel.toString();
    
    if (taskCache[levelKey]) {
      return taskCache[levelKey].tasks;
    }
    return [];
  } catch (error) {
    console.error('获取缓存任务失败:', error);
    return [];
  }
};

// 保存任务到本地缓存
export const saveTasks = (auditorLevel: number, tasks: AuditTaskDto[]): void => {
  try {
    const cache = localStorage.getItem(TASK_CACHE_KEY);
    const taskCache: TaskCache = cache ? JSON.parse(cache) : {};
    const levelKey = auditorLevel.toString();
    
    if (!taskCache[levelKey]) {
      taskCache[levelKey] = {
        tasks: [],
        timestamp: Date.now(),
        assignedTaskIds: []
      };
    }
    
    // 合并新任务，避免重复
    const existingTaskIds = new Set(taskCache[levelKey].tasks.map(t => t.auditId));
    const newTasks = tasks.filter(task => !existingTaskIds.has(task.auditId));
    
    taskCache[levelKey].tasks = [...taskCache[levelKey].tasks, ...newTasks];
    taskCache[levelKey].timestamp = Date.now();
    
    // 更新已分配任务ID数组
    const assignedIds = new Set(taskCache[levelKey].assignedTaskIds);
    tasks.forEach(task => {
      assignedIds.add(task.auditId);
    });
    taskCache[levelKey].assignedTaskIds = Array.from(assignedIds);
    
    localStorage.setItem(TASK_CACHE_KEY, JSON.stringify(taskCache));
  } catch (error) {
    console.error('保存缓存任务失败:', error);
  }
};

// 从缓存中移除已完成的任务
export const removeCompletedTask = (auditorLevel: number, auditId: number): void => {
  try {
    console.log(`正在移除已完成任务: auditorLevel=${auditorLevel}, auditId=${auditId}`);
    
    const cache = localStorage.getItem(TASK_CACHE_KEY);
    if (!cache) {
      console.log('缓存为空，无需移除');
      return;
    }
    
    const taskCache: TaskCache = JSON.parse(cache);
    const levelKey = auditorLevel.toString();
    
    if (taskCache[levelKey]) {
      const beforeCount = taskCache[levelKey].tasks.length;
      taskCache[levelKey].tasks = taskCache[levelKey].tasks.filter(t => t.auditId !== auditId);
      taskCache[levelKey].assignedTaskIds = taskCache[levelKey].assignedTaskIds.filter(id => id !== auditId);
      const afterCount = taskCache[levelKey].tasks.length;
      
      localStorage.setItem(TASK_CACHE_KEY, JSON.stringify(taskCache));
      console.log(`任务移除完成: ${beforeCount} -> ${afterCount} 个任务`);
      
      if (beforeCount === afterCount) {
        console.warn(`警告: 任务 ${auditId} 未从缓存中找到，可能已经不存在`);
        // 打印当前缓存中的任务ID，帮助调试
        const currentTaskIds = taskCache[levelKey].tasks.map(t => t.auditId);
        console.log(`当前缓存中的任务ID: [${currentTaskIds.join(', ')}]`);
      }
    } else {
      console.log(`审核员等级 ${auditorLevel} 的缓存不存在`);
    }
  } catch (error) {
    console.error('移除完成任务失败:', error);
  }
};

// 清空指定审核员等级的所有缓存任务
export const clearCachedTasks = (auditorLevel: number): void => {
  try {
    const cache = localStorage.getItem(TASK_CACHE_KEY);
    if (!cache) return;
    
    const taskCache: TaskCache = JSON.parse(cache);
    const levelKey = auditorLevel.toString();
    
    if (taskCache[levelKey]) {
      taskCache[levelKey].tasks = [];
      taskCache[levelKey].assignedTaskIds = [];
      taskCache[levelKey].timestamp = Date.now();
      localStorage.setItem(TASK_CACHE_KEY, JSON.stringify(taskCache));
    }
  } catch (error) {
    console.error('清空缓存任务失败:', error);
  }
};

// 检查任务是否已被当前审核员分配
export const isTaskAssigned = (auditorLevel: number, auditId: number): boolean => {
  try {
    const cache = localStorage.getItem(TASK_CACHE_KEY);
    if (!cache) return false;
    
    const taskCache: TaskCache = JSON.parse(cache);
    const levelKey = auditorLevel.toString();
    
    return taskCache[levelKey]?.assignedTaskIds.includes(auditId) || false;
  } catch (error) {
    console.error('检查任务分配状态失败:', error);
    return false;
  }
};

// 获取新的任务（排除已有任务）
export const getNewAuditTasks = async (
  auditorLevel: number,
  auditorId: number,
  excludeIds: number[]
): Promise<ApiResponse<AuditTaskResponse>> => {
  try {
    const excludeIdsStr = excludeIds.join(',');
    const response = await apiClient.get(`/api/proxy?path=auditor/tasks/new&level=${auditorLevel}&auditorId=${auditorId}&excludeIds=${excludeIdsStr}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return error.response.data;
    }
    throw error;
  }
};

// 获取合并的任务列表（缓存 + 新任务），确保所有任务都已正确分配
export const getMergedTasks = async (auditorLevel: number, auditorId: number): Promise<ApiResponse<AuditTaskResponse>> => {
  try {
    // 获取缓存的任务
    const cachedTasks = getCachedTasks(auditorLevel);
    
    // 获取已有任务的ID列表，用于排除
    const existingTaskIds = cachedTasks.map(t => t.auditId);
    
    // 获取新的任务（排除已有任务）
    const response = await getNewAuditTasks(auditorLevel, auditorId, existingTaskIds);
    
    if (response.success && response.data) {
      // 保存新任务到缓存
      saveTasks(auditorLevel, response.data.tasks);
      
      // 合并缓存任务和新任务
      const mergedTasks: AuditTaskDto[] = [...cachedTasks, ...response.data.tasks];
      
      return {
        success: true,
        data: {
          auditorLevel,
          taskCount: mergedTasks.length,
          tasks: mergedTasks
        },
        message: cachedTasks.length > 0 
          ? `获取${response.data.tasks.length}个新任务，合并${cachedTasks.length}个缓存任务` 
          : response.message
      };
    }
    
    // 如果没有新任务但有缓存任务，需要重新分配缓存任务以确保状态正确
    if (cachedTasks.length > 0) {
      // 尝试重新分配缓存中的任务，确保它们在数据库中状态正确
      const reAssignResponse = await getAuditTasks(auditorLevel);
      if (reAssignResponse.success && reAssignResponse.data) {
        // 更新缓存，确保任务状态一致
        const assignedTaskIds = reAssignResponse.data.tasks.map(t => t.auditId);
        const validCachedTasks = cachedTasks.filter(task => assignedTaskIds.includes(task.auditId));
        
        if (validCachedTasks.length > 0) {
          return {
            success: true,
            data: {
              auditorLevel,
              taskCount: validCachedTasks.length,
              tasks: validCachedTasks
            },
            message: '从缓存获取已分配任务'
          };
        }
      }
      
      // 如果重新分配失败，清空缓存并返回空结果
      saveTasks(auditorLevel, []);
    }
    
    return response || {
      success: true,
      data: {
        auditorLevel,
        taskCount: 0,
        tasks: []
      },
      message: '暂无可用任务'
    };
  } catch (error) {
    console.error('获取合并任务失败:', error);
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

// 获取最大亏损承受对应的描述
export const getMaxLossText = (maxLossCode: number | undefined): string => {
  if (maxLossCode === undefined) return '未填写';
  
  switch (maxLossCode) {
    case 1:
    case 2:
      return '5%以内';
    case 3:
      return '5-15%';
    case 4:
      return '30%以上';
    default:
      return `代码${maxLossCode}`;
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