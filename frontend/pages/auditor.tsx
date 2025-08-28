import React, { useState, useEffect } from 'react';
import { getAuditTasks, submitAuditResult, getAuditHistory, releaseAuditTask, formatPhone, formatDateTime, getRiskTypeBadgeClass, getStageText, validateAuditForm } from '../utils/auditorApi';
import { AuditTaskDto, AuditForm, AuditResultDto, AUDITOR_LEVELS } from '../types/auditor';
import { ApiResponse } from '../types/api';

interface AuditorPageProps {
  // 预留给未来审核员认证系统使用
  auditorLevel?: number;
}

const AuditorPage: React.FC<AuditorPageProps> = ({ auditorLevel = 0 }) => {
  const [tasks, setTasks] = useState<AuditTaskDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    needReview: 0,
    totalAmount: '0'
  });
  const [selectedTask, setSelectedTask] = useState<AuditTaskDto | null>(null);
  const [auditForm, setAuditForm] = useState<AuditForm>({
    auditId: 0,
    approved: true,
    riskScore: 50,
    opinion: ''
  });
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [auditHistory, setAuditHistory] = useState<AuditResultDto[]>([]);
  const [showDetailedInfo, setShowDetailedInfo] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  // 获取审核任务
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await getAuditTasks(auditorLevel);
      if (response.success && response.data) {
        setTasks(response.data.tasks);
        // 计算统计数据
        calculateStats(response.data.tasks);
      }
    } catch (error) {
      console.error('获取任务失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 计算统计数据
  const calculateStats = (taskList: AuditTaskDto[]) => {
    const pending = taskList.length;
    const totalAmount = taskList.reduce((sum, task) => sum + (task.investAmount || 0), 0);
    
    setStats({
      pending,
      approved: 35, // 模拟数据
      needReview: 5, // 模拟数据
      totalAmount: (totalAmount / 10000).toFixed(1) + '万'
    });
  };

  // 获取审核历史
  const fetchAuditHistory = async (auditId: number) => {
    setHistoryLoading(true);
    try {
      const response = await getAuditHistory(auditId);
      if (response.success && response.data) {
        setAuditHistory(response.data);
      }
    } catch (error) {
      console.error('获取审核历史失败:', error);
      setAuditHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // 开始审核任务
  const startAudit = (task: AuditTaskDto) => {
    setSelectedTask(task);
    setAuditForm({
      auditId: task.auditId,
      approved: true,
      riskScore: task.riskScore,
      opinion: ''
    });
    setFormErrors([]);
    // 获取审核历史
    fetchAuditHistory(task.auditId);
  };

  // 取消审核
  const cancelAudit = async () => {
    // 如果有选中的任务，释放该任务
    if (selectedTask) {
      try {
        await releaseAuditTask(selectedTask.auditId);
      } catch (error) {
        console.error('释放任务失败:', error);
      }
    }
    
    setSelectedTask(null);
    setAuditForm({
      auditId: 0,
      approved: true,
      riskScore: 50,
      opinion: ''
    });
    setFormErrors([]);
    setAuditHistory([]);
  };

  // 提交审核结果
  const handleSubmitAudit = async () => {
    // 清除之前的错误
    setFormErrors([]);
    
    const validation = validateAuditForm(auditForm.approved, auditForm.riskScore, auditForm.opinion);
    
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    // 确认提交
    const confirmMessage = auditForm.approved 
      ? `确认通过该审核吗？\n风险评分：${auditForm.riskScore}分\n审核意见：${auditForm.opinion}`
      : `确认拒绝该审核吗？\n风险评分：${auditForm.riskScore}分\n审核意见：${auditForm.opinion}`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    setSubmitLoading(true);
    try {
      const request = {
        auditId: auditForm.auditId,
        auditorLevel: auditorLevel,
        approved: auditForm.approved,
        riskScore: auditForm.riskScore,
        opinion: auditForm.opinion
      };

      const response = await submitAuditResult(request);
      
      if (response.success) {
        alert(`审核结果提交成功！\n状态：${response.data?.workflowStatus || '已处理'}\n${response.data?.message || ''}`);
        cancelAudit();
        fetchTasks(); // 刷新任务列表
      } else {
        alert('提交失败：' + response.message);
        setFormErrors([response.message || '提交失败']);
      }
    } catch (error) {
      console.error('提交审核结果失败:', error);
      const errorMessage = '提交失败，请稍后重试';
      alert(errorMessage);
      setFormErrors([errorMessage]);
    } finally {
      setSubmitLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [auditorLevel]);

  return (
    <div style={{ fontFamily: 'Microsoft YaHei, Arial, sans-serif', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* 头部 */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '20px 0',
        textAlign: 'center',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>银行投资风险审核系统</h1>
        <p style={{ fontSize: '16px', opacity: 0.9 }}>
          当前身份：{AUDITOR_LEVELS[auditorLevel as keyof typeof AUDITOR_LEVELS]}
        </p>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        {/* 选项卡 */}
        <div style={{
          display: 'flex',
          background: 'white',
          borderRadius: '8px',
          marginBottom: '20px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <div style={{
            flex: 1,
            padding: '15px 20px',
            textAlign: 'center',
            background: '#667eea',
            color: 'white',
            fontSize: '16px'
          }}>
            审核工作台
          </div>
        </div>

        {/* 主要内容 */}
        <div style={{
          background: 'white',
          borderRadius: '8px',
          padding: '30px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          {!selectedTask ? (
            // 任务列表视图
            <>
              <h2 style={{
                fontSize: '24px',
                marginBottom: '20px',
                color: '#333',
                borderBottom: '2px solid #667eea',
                paddingBottom: '10px'
              }}>
                审核工作台
              </h2>
              <p style={{ marginBottom: '20px', color: '#666' }}>管理和审核客户投资风险评估申请</p>

              {/* 统计卡片 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px',
                marginBottom: '30px'
              }}>
                <div style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  borderLeft: '4px solid #667eea'
                }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#667eea', marginBottom: '5px' }}>
                    {stats.pending}
                  </div>
                  <div style={{ color: '#666', fontSize: '14px' }}>待审核</div>
                </div>
                <div style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  borderLeft: '4px solid #667eea'
                }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#667eea', marginBottom: '5px' }}>
                    {stats.approved}
                  </div>
                  <div style={{ color: '#666', fontSize: '14px' }}>已通过</div>
                </div>
                <div style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  borderLeft: '4px solid #667eea'
                }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#667eea', marginBottom: '5px' }}>
                    {stats.needReview}
                  </div>
                  <div style={{ color: '#666', fontSize: '14px' }}>需复审</div>
                </div>
                <div style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  borderLeft: '4px solid #667eea'
                }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#667eea', marginBottom: '5px' }}>
                    {stats.totalAmount}
                  </div>
                  <div style={{ color: '#666', fontSize: '14px' }}>本批投资额</div>
                </div>
              </div>

              {/* 任务列表 */}
              <div style={{
                background: '#f9f9f9',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '20px',
                borderLeft: '4px solid #667eea'
              }}>
                <h3 style={{ marginBottom: '20px' }}>待审核申请</h3>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>加载中...</div>
                ) : tasks.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                    暂无待审核任务
                  </div>
                ) : (
                  <div style={{ background: 'white', borderRadius: '8px' }}>
                    {tasks.map((task, index) => (
                      <div key={task.auditId} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '20px',
                        borderBottom: index < tasks.length - 1 ? '1px solid #f0f0f0' : 'none'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                            {task.customerName}
                          </div>
                          <div style={{ color: '#666', fontSize: '14px', marginBottom: '2px' }}>
                            审核ID：{task.auditId} | 投资金额：{task.investAmount ? (task.investAmount / 10000).toFixed(1) + '万' : '未知'} | 风险等级：{task.riskType}
                          </div>
                          <div style={{ color: '#666', fontSize: '14px' }}>
                            提交时间：{formatDateTime(task.createdAt)} | 手机：{formatPhone(task.customerPhone)}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '5px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }} className={getRiskTypeBadgeClass(task.riskType)}>
                            {getStageText(task.stage)}
                          </span>
                          <button
                            onClick={() => startAudit(task)}
                            style={{
                              padding: '8px 16px',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              background: '#667eea',
                              color: 'white',
                              transition: 'all 0.3s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = '#5a6fd8'}
                            onMouseOut={(e) => e.currentTarget.style.background = '#667eea'}
                          >
                            开始审核
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                  <button
                    onClick={fetchTasks}
                    disabled={loading}
                    style={{
                      padding: '10px 20px',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      background: loading ? '#ccc' : '#f0f0f0',
                      color: '#333',
                      transition: 'all 0.3s'
                    }}
                  >
                    {loading ? '刷新中...' : '刷新任务'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            // 审核表单视图
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{
                  fontSize: '24px',
                  color: '#333',
                  borderBottom: '2px solid #667eea',
                  paddingBottom: '10px'
                }}>
                  审核详情
                </h2>
                <button
                  onClick={cancelAudit}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    background: '#f0f0f0',
                    color: '#333',
                    transition: 'all 0.3s'
                  }}
                >
                  返回列表
                </button>
              </div>

              {/* 历史审核意见 - 调试信息 */}
              {selectedTask && (
                <div style={{ background: '#fffbeb', padding: '10px', marginBottom: '10px', fontSize: '12px' }}>
                  调试信息: auditHistory.length={auditHistory.length}, selectedTask.stage={selectedTask.stage}, auditorLevel={auditorLevel}, historyLoading={historyLoading}
                </div>
              )}
              
              {/* 历史审核意见 */}
              {selectedTask && auditorLevel > 0 && (
                <div style={{
                  background: '#f0f9ff',
                  borderRadius: '8px',
                  padding: '20px',
                  marginBottom: '20px',
                  borderLeft: '4px solid #0ea5e9'
                }}>
                  <h3 style={{ marginBottom: '15px', color: '#0369a1' }}>历史审核意见</h3>
                  {historyLoading ? (
                    <div style={{ textAlign: 'center', padding: '10px' }}>加载中...</div>
                  ) : auditHistory.length === 0 ? (
                    <div style={{ 
                      textAlign: 'center', 
                      color: '#64748b', 
                      fontStyle: 'italic',
                      padding: '10px'
                    }}>
                      暂无历史审核意见数据
                    </div>
                  ) : (
                    <>
                      <div style={{ marginBottom: '10px', fontSize: '12px', color: '#64748b' }}>
                        全部历史记录({auditHistory.length}条)：
                        {auditHistory.map(h => `阶段${h.stage}`).join(', ')}
                      </div>
                      {auditHistory
                        .filter(history => {
                          // 根据当前审核员级别显示对应的历史审核意见
                          // 中级审核员(1)可以看初级(0)的意见
                          // 高级审核员(2)可以看初级(0)和中级(1)的意见  
                          // 投资委员会(3)可以看初级(0)、中级(1)、高级(2)的意见
                          return history.stage < auditorLevel;
                        })
                        .map((history, index) => (
                          <div key={index} style={{
                            background: 'white',
                            borderRadius: '6px',
                            padding: '15px',
                            marginBottom: '10px',
                            border: '1px solid #e0f2fe'
                          }}>
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center', 
                              marginBottom: '10px' 
                            }}>
                              <span style={{ 
                                fontWeight: 'bold', 
                                color: '#0369a1',
                                fontSize: '14px'
                              }}>
                                {getStageText(history.stage)} - 评分：{history.riskScore}分
                              </span>
                              <span style={{ 
                                fontSize: '12px', 
                                color: '#64748b'
                              }}>
                                {formatDateTime(history.createdAt)}
                              </span>
                            </div>
                            <div style={{ 
                              color: '#334155', 
                              lineHeight: '1.5',
                              fontSize: '14px'
                            }}>
                              {history.opinion}
                            </div>
                          </div>
                        ))}
                      {auditHistory.filter(h => h.stage < auditorLevel).length === 0 && (
                        <div style={{ 
                          textAlign: 'center', 
                          color: '#64748b', 
                          fontStyle: 'italic',
                          padding: '10px'
                        }}>
                          当前审核员级别({auditorLevel})暂无可查看的历史审核意见
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* 客户信息 */}
              <div style={{
                background: '#f9f9f9',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '20px',
                borderLeft: '4px solid #667eea'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0 }}>客户信息</h3>
                  <button
                    onClick={() => setShowDetailedInfo(!showDetailedInfo)}
                    style={{
                      background: 'none',
                      border: '1px solid #667eea',
                      color: '#667eea',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      transition: 'all 0.3s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#667eea';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'none';
                      e.currentTarget.style.color = '#667eea';
                    }}
                  >
                    <span>{showDetailedInfo ? '收起详情' : '展开详情'}</span>
                    <span style={{ 
                      transform: showDetailedInfo ? 'rotate(180deg)' : 'rotate(0deg)', 
                      transition: 'transform 0.3s' 
                    }}>
                      ▼
                    </span>
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginBottom: '15px' }}>
                  <div>
                    <strong>客户姓名：</strong>{selectedTask.customerName}
                  </div>
                  <div>
                    <strong>联系电话：</strong>{formatPhone(selectedTask.customerPhone)}
                  </div>
                  <div>
                    <strong>风险类型：</strong>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      marginLeft: '8px'
                    }} className={getRiskTypeBadgeClass(selectedTask.riskType)}>
                      {selectedTask.riskType}
                    </span>
                  </div>
                  <div>
                    <strong>当前评分：</strong>{selectedTask.riskScore}分
                  </div>
                  {!showDetailedInfo && (
                    <>
                      <div>
                        <strong>审核阶段：</strong>{getStageText(selectedTask.stage)}
                      </div>
                      <div>
                        <strong>提交时间：</strong>{formatDateTime(selectedTask.createdAt)}
                      </div>
                    </>
                  )}
                </div>
                
                {/* 详细信息展开区域 */}
                {showDetailedInfo && (
                  <div style={{
                    marginTop: '15px',
                    padding: '15px',
                    background: 'white',
                    borderRadius: '6px',
                    border: '1px solid #e0e0e0',
                    animation: 'slideDown 0.3s ease-out'
                  }}>
                    <h4 style={{ marginTop: '0', marginBottom: '12px', color: '#667eea' }}>详细表单信息</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '14px' }}>
                      <div>
                        <strong>审核ID：</strong>
                        <span style={{ color: '#666' }}>#{selectedTask.auditId}</span>
                      </div>
                      <div>
                        <strong>客户ID：</strong>
                        <span style={{ color: '#666' }}>{selectedTask.customerId}</span>
                      </div>
                      <div>
                        <strong>审核阶段：</strong>
                        <span style={{ color: '#667eea', fontWeight: 'bold' }}>{getStageText(selectedTask.stage)}</span>
                      </div>
                      <div>
                        <strong>投资金额：</strong>
                        <span style={{ color: '#f44336', fontWeight: 'bold' }}>
                          {selectedTask.investAmount ? `¥${(selectedTask.investAmount / 10000).toFixed(1)}万` : '未填写'}
                        </span>
                      </div>
                      <div>
                        <strong>申请时间：</strong>
                        <span style={{ color: '#666' }}>{formatDateTime(selectedTask.createdAt)}</span>
                      </div>
                      <div>
                        <strong>风险承受等级：</strong>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '10px',
                          fontSize: '11px',
                          fontWeight: 'bold'
                        }} className={getRiskTypeBadgeClass(selectedTask.riskType)}>
                          {selectedTask.riskType}
                        </span>
                      </div>
                    </div>
                    
                    <div style={{
                      marginTop: '15px',
                      padding: '12px',
                      background: '#f8f9fa',
                      borderRadius: '4px',
                      borderLeft: '3px solid #667eea'
                    }}>
                      <div style={{ fontSize: '13px', color: '#666' }}>
                        <strong style={{ color: '#667eea' }}>审核说明：</strong>
                        请根据客户提交的表单信息，综合评估其投资风险承受能力，并给出专业的审核意见和建议。
                      </div>
                    </div>
                  </div>
                )}
                
                {/* 审核信息提示 */}
                <div style={{
                  background: '#e3f2fd',
                  border: '1px solid #2196f3',
                  borderRadius: '4px',
                  padding: '12px',
                  marginTop: '15px'
                }}>
                  <div style={{ color: '#1976d2', fontWeight: 'bold', marginBottom: '5px' }}>
                    审核要求：
                  </div>
                  <div style={{ color: '#1976d2', fontSize: '14px' }}>
                    • 请仔细评估客户的风险承受能力<br/>
                    • 风险评分范围：0-100分（分数越高风险承受能力越强）<br/>
                    • 审核意见必须详细说明评估理由（至少5个字符）<br/>
                    • {selectedTask.stage === 3 ? '投资委员会审核为最终审核' : 
                       auditForm.approved ? '通过后将流转到下一审核阶段' : '拒绝后将直接结束审核流程'}
                  </div>
                </div>
              </div>

              {/* 审核表单 */}
              <div style={{
                background: 'white',
                border: '1px solid #eee',
                borderRadius: '8px',
                padding: '20px'
              }}>
                <h3 style={{ marginBottom: '20px' }}>审核意见</h3>
                
                {formErrors.length > 0 && (
                  <div style={{
                    background: '#ffebee',
                    color: '#c62828',
                    padding: '10px',
                    borderRadius: '4px',
                    marginBottom: '20px',
                    border: '1px solid #ffcdd2'
                  }}>
                    {formErrors.map((error, index) => (
                      <div key={index}>{error}</div>
                    ))}
                  </div>
                )}

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                    审核结果 <span style={{ color: '#f44336' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: '20px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        checked={auditForm.approved}
                        onChange={() => setAuditForm(prev => ({ ...prev, approved: true }))}
                        style={{ marginRight: '8px' }}
                      />
                      通过
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        checked={!auditForm.approved}
                        onChange={() => setAuditForm(prev => ({ ...prev, approved: false }))}
                        style={{ marginRight: '8px' }}
                      />
                      拒绝
                    </label>
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                    风险评分 (0-100) <span style={{ color: '#f44336' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={auditForm.riskScore}
                    onChange={(e) => setAuditForm(prev => ({ ...prev, riskScore: parseInt(e.target.value) || 0 }))}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                    审核意见 <span style={{ color: '#f44336' }}>*</span>
                  </label>
                  <textarea
                    value={auditForm.opinion}
                    onChange={(e) => setAuditForm(prev => ({ ...prev, opinion: e.target.value }))}
                    placeholder="请详细说明审核理由，包括：1）客户风险承受能力评估；2）风险评分调整原因；3）通过/拒绝的具体依据"
                    rows={6}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: auditForm.opinion.trim().length === 0 ? '2px solid #f44336' : '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                  />
                  <div style={{ 
                    fontSize: '12px', 
                    color: auditForm.opinion.trim().length < 5 ? '#f44336' : '#666',
                    marginTop: '5px' 
                  }}>
                    已输入 {auditForm.opinion.length} 个字符，至少需要 5 个字符
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <button
                    onClick={handleSubmitAudit}
                    disabled={submitLoading}
                    style={{
                      padding: '12px 30px',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: submitLoading ? 'not-allowed' : 'pointer',
                      fontSize: '16px',
                      background: submitLoading ? '#ccc' : '#667eea',
                      color: 'white',
                      transition: 'all 0.3s'
                    }}
                    onMouseOver={(e) => {
                      if (!submitLoading) e.currentTarget.style.background = '#5a6fd8';
                    }}
                    onMouseOut={(e) => {
                      if (!submitLoading) e.currentTarget.style.background = '#667eea';
                    }}
                  >
                    {submitLoading ? '提交中...' : '提交审核结果'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* CSS 样式 */}
      <style jsx>{`
        .badge-conservative {
          background: #e8f5e8 !important;
          color: #4CAF50 !important;
        }
        .badge-moderate {
          background: #fff3e0 !important;
          color: #FF9800 !important;
        }
        .badge-aggressive {
          background: #ffebee !important;
          color: #F44336 !important;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            max-height: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            max-height: 500px;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .review-item {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 15px;
          }
          .review-actions {
            width: 100%;
            justify-content: flex-end;
          }
        }
      `}</style>
    </div>
  );
};

export default AuditorPage;