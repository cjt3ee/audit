import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getMergedTasks, submitAuditResult, getAuditHistory, removeCompletedTask, formatPhone, formatDateTime, getRiskTypeBadgeClass, getStageText, validateAuditForm, getMaxLossText } from '../utils/auditorApi';
import { AuditTaskDto, AuditForm, AuditResultDto } from '../types/auditor';

const SeniorAuditPage: React.FC = () => {
  const [auditorInfo, setAuditorInfo] = useState<any>(null);
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
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showDetailedInfo, setShowDetailedInfo] = useState(false);
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [auditorAuditHistory, setAuditorAuditHistory] = useState<AuditResultDto[]>([]);
  const router = useRouter();

  // 检查登录状态
  useEffect(() => {
    const storedAuditorInfo = localStorage.getItem('auditorInfo');
    if (!storedAuditorInfo) {
      router.push('/auditor-login');
      return;
    }
    
    const info = JSON.parse(storedAuditorInfo);
    if (info.level !== 2) {
      alert('您没有权限访问高级审核员页面');
      router.push('/auditor-login');
      return;
    }
    
    setAuditorInfo(info);
  }, []);

  // 登出功能
  const handleLogout = () => {
    if (confirm('确认退出登录吗？')) {
      localStorage.removeItem('auditorInfo');
      router.push('/auditor-login');
    }
  };

  // 获取审核任务
  const fetchTasks = async () => {
    if (!auditorInfo) return;
    
    setLoading(true);
    try {
      const response = await getMergedTasks(2, auditorInfo.auditorId); // 传递审核员ID
      if (response.success && response.data) {
        setTasks(response.data.tasks);
        calculateStats(response.data.tasks);
        
        // 显示获取任务的提示信息
        if (response.message && response.message.includes('新任务')) {
          console.log(response.message);
        }
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
      approved: 18, // 模拟数据
      needReview: 3, // 模拟数据
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

  // 获取已审核任务历史
  const fetchAuditorAuditHistory = async () => {
    if (!auditorInfo) return;
    
    setHistoryLoading(true);
    try {
      const response = await getAuditorHistory(auditorInfo.auditorId);
      if (response.success && response.data) {
        setAuditorAuditHistory(response.data);
      }
    } catch (error) {
      console.error('获取审核历史失败:', error);
      setAuditorAuditHistory([]);
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
    // 获取审核历史（高级审核员可以看到初级、中级的意见）
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
    setFormErrors([]);
    
    const validation = validateAuditForm(auditForm.approved, auditForm.riskScore, auditForm.opinion);
    
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

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
        auditorLevel: 2, // 高级审核员
        auditorId: auditorInfo.auditorId, // 添加审核员ID
        approved: auditForm.approved,
        riskScore: auditForm.riskScore,
        opinion: auditForm.opinion
      };

      const response = await submitAuditResult(request);
      
      if (response.success) {
        alert(`审核结果提交成功！\n状态：${response.data?.workflowStatus || '已处理'}\n${response.data?.message || ''}`);
        
        // 从缓存中移除已完成的任务
        removeCompletedTask(2, auditForm.auditId);
        
        // 从当前任务列表中移除已完成的任务
        setTasks(prevTasks => prevTasks.filter(task => task.auditId !== auditForm.auditId));
        
        // 重置表单和状态
        setSelectedTask(null);
        setAuditForm({
          auditId: 0,
          approved: true,
          riskScore: 50,
          opinion: ''
        });
        setFormErrors([]);
        setAuditHistory([]);
        
        // 重新计算统计数据
        const updatedTasks = tasks.filter(task => task.auditId !== auditForm.auditId);
        calculateStats(updatedTasks);
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
    if (auditorInfo) {
      if (activeTab === 'current') {
        fetchTasks();
      } else {
        fetchAuditorAuditHistory();
      }
    }
  }, [auditorInfo, activeTab]);

  if (!auditorInfo) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'Microsoft YaHei, Arial, sans-serif'
      }}>
        加载中...
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Microsoft YaHei, Arial, sans-serif', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* 头部 */}
      <div style={{
        background: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
        color: 'white',
        padding: '20px 0',
        textAlign: 'center',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>银行投资风险审核系统</h1>
        <p style={{ fontSize: '16px', opacity: 0.9 }}>
          欢迎，{auditorInfo.levelName} - {auditorInfo.account}
        </p>
        <button
          onClick={handleLogout}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          退出登录
        </button>
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
          <div 
            onClick={() => setActiveTab('current')}
            style={{
              flex: 1,
              padding: '15px 20px',
              textAlign: 'center',
              background: activeTab === 'current' ? '#FF9800' : '#f0f0f0',
              color: activeTab === 'current' ? 'white' : '#333',
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
          >
            当前任务
          </div>
          <div 
            onClick={() => setActiveTab('history')}
            style={{
              flex: 1,
              padding: '15px 20px',
              textAlign: 'center',
              background: activeTab === 'history' ? '#FF9800' : '#f0f0f0',
              color: activeTab === 'history' ? 'white' : '#333',
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
          >
            已审核任务
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
            activeTab === 'current' ? (
            // 当前任务列表视图
            <>
              <h2 style={{
                fontSize: '24px',
                marginBottom: '20px',
                color: '#333',
                borderBottom: '2px solid #FF9800',
                paddingBottom: '10px'
              }}>
                高级审核工作台
              </h2>
              <p style={{ marginBottom: '20px', color: '#666' }}>管理和审核客户投资风险评估申请 - 高级审核阶段</p>

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
                  borderLeft: '4px solid #FF9800'
                }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#FF9800', marginBottom: '5px' }}>
                    {stats.pending}
                  </div>
                  <div style={{ color: '#666', fontSize: '14px' }}>待高审</div>
                </div>
                <div style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  borderLeft: '4px solid #FF9800'
                }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#FF9800', marginBottom: '5px' }}>
                    {stats.approved}
                  </div>
                  <div style={{ color: '#666', fontSize: '14px' }}>已通过</div>
                </div>
                <div style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  borderLeft: '4px solid #FF9800'
                }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#FF9800', marginBottom: '5px' }}>
                    {stats.needReview}
                  </div>
                  <div style={{ color: '#666', fontSize: '14px' }}>需复审</div>
                </div>
                <div style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  borderLeft: '4px solid #FF9800'
                }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#FF9800', marginBottom: '5px' }}>
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
                borderLeft: '4px solid #FF9800'
              }}>
                <h3 style={{ marginBottom: '20px' }}>待高审申请</h3>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>加载中...</div>
                ) : tasks.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                    暂无待高审任务
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
                              background: '#FF9800',
                              color: 'white',
                              transition: 'all 0.3s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = '#F57C00'}
                            onMouseOut={(e) => e.currentTarget.style.background = '#FF9800'}
                          >
                            开始高审
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
            // 已审核任务历史视图
            <>
              <h2 style={{
                fontSize: '24px',
                marginBottom: '20px',
                color: '#333',
                borderBottom: '2px solid #FF9800',
                paddingBottom: '10px'
              }}>
                已审核任务历史
              </h2>
              <p style={{ marginBottom: '20px', color: '#666' }}>查看您已完成的高级审核任务历史记录</p>

              {/* 已审核任务列表 */}
              <div style={{
                background: '#f9f9f9',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '20px',
                borderLeft: '4px solid #FF9800'
              }}>
                <h3 style={{ marginBottom: '20px' }}>高级审核历史</h3>
                {historyLoading ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>加载中...</div>
                ) : auditorAuditHistory.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                    暂无已审核任务历史
                  </div>
                ) : (
                  <div style={{ background: 'white', borderRadius: '8px' }}>
                    {auditorAuditHistory.map((record, index) => (
                      <div key={record.auditId} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '20px',
                        borderBottom: index < auditorAuditHistory.length - 1 ? '1px solid #f0f0f0' : 'none'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                            审核ID: #{record.auditId}
                          </div>
                          <div style={{ color: '#666', fontSize: '14px', marginBottom: '2px' }}>
                            结果: <span style={{ 
                              color: record.approved ? '#4CAF50' : '#F44336',
                              fontWeight: 'bold' 
                            }}>
                              {record.approved ? '通过' : '拒绝'}
                            </span> | 风险评分: {record.riskScore}分
                          </div>
                          <div style={{ color: '#666', fontSize: '14px' }}>
                            审核时间: {formatDateTime(record.createdAt)}
                          </div>
                          {record.opinion && (
                            <div style={{ 
                              color: '#666', 
                              fontSize: '13px', 
                              marginTop: '5px',
                              fontStyle: 'italic',
                              background: '#f8f9fa',
                              padding: '8px',
                              borderRadius: '4px',
                              borderLeft: '3px solid #FF9800'
                            }}>
                              审核意见: {record.opinion}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                  <button
                    onClick={fetchAuditorAuditHistory}
                    disabled={historyLoading}
                    style={{
                      padding: '10px 20px',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: historyLoading ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      background: historyLoading ? '#ccc' : '#f0f0f0',
                      color: '#333',
                      transition: 'all 0.3s'
                    }}
                  >
                    {historyLoading ? '刷新中...' : '刷新历史'}
                  </button>
                </div>
              </div>
            </>
            )
          ) : (
            // 审核表单视图
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{
                  fontSize: '24px',
                  color: '#333',
                  borderBottom: '2px solid #FF9800',
                  paddingBottom: '10px'
                }}>
                  高级审核详情
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

              {/* 历史审核意见 */}
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
                        // 高级审核员(2)可以看初级(0)和中级(1)的意见
                        return history.stage < 2;
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
                    {auditHistory.filter(h => h.stage < 2).length === 0 && (
                      <div style={{ 
                        textAlign: 'center', 
                        color: '#64748b', 
                        fontStyle: 'italic',
                        padding: '10px'
                      }}>
                        暂无可查看的历史审核意见
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* 客户信息 */}
              <div style={{
                background: '#f9f9f9',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '20px',
                borderLeft: '4px solid #FF9800'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0 }}>客户信息</h3>
                  <button
                    onClick={() => setShowDetailedInfo(!showDetailedInfo)}
                    style={{
                      background: 'none',
                      border: '1px solid #FF9800',
                      color: '#FF9800',
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
                      e.currentTarget.style.background = '#FF9800';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'none';
                      e.currentTarget.style.color = '#FF9800';
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
                    <h4 style={{ marginTop: '0', marginBottom: '12px', color: '#FF9800' }}>详细表单信息</h4>
                    
                    {/* 客户基础信息 */}
                    <div style={{ marginBottom: '20px' }}>
                      <h5 style={{ margin: '0 0 10px 0', color: '#333', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>客户基础信息</h5>
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
                          <strong>姓名：</strong>
                          <span style={{ color: '#666' }}>{selectedTask.customerName}</span>
                        </div>
                        <div>
                          <strong>联系电话：</strong>
                          <span style={{ color: '#666' }}>{formatPhone(selectedTask.customerPhone)}</span>
                        </div>
                        <div>
                          <strong>电子邮箱：</strong>
                          <span style={{ color: '#666' }}>{selectedTask.customerEmail || '未填写'}</span>
                        </div>
                        <div>
                          <strong>职业：</strong>
                          <span style={{ color: '#666' }}>{selectedTask.customerOccupation || '未填写'}</span>
                        </div>
                        <div>
                          <strong>身份证号：</strong>
                          <span style={{ color: '#666' }}>
                            {selectedTask.customerIdCard ? selectedTask.customerIdCard.replace(/(.{6})(.*)(.{4})/, '$1****$3') : '未填写'}
                          </span>
                        </div>
                        <div>
                          <strong>计划投资金额：</strong>
                          <span style={{ color: '#f44336', fontWeight: 'bold' }}>
                            {selectedTask.investAmount ? `¥${(selectedTask.investAmount / 10000).toFixed(1)}万` : '未填写'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 风险评估信息 */}
                    <div style={{ marginBottom: '20px' }}>
                      <h5 style={{ margin: '0 0 10px 0', color: '#333', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>风险评估问卷</h5>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '14px' }}>
                        <div>
                          <strong>年收入：</strong>
                          <span style={{ color: '#666' }}>
                            {selectedTask.annualIncome !== undefined ? 
                              `代码${selectedTask.annualIncome}` : '未填写'}
                          </span>
                        </div>
                        <div>
                          <strong>风险评分：</strong>
                          <span style={{
                            color: '#FF9800',
                            fontWeight: 'bold',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: '#f0f0f0'
                          }}>
                            {selectedTask.riskScore}分
                          </span>
                        </div>
                        <div>
                          <strong>投资金额：</strong>
                          <span style={{ color: '#666' }}>
                            {selectedTask.investmentAmount ? 
                              `¥${(selectedTask.investmentAmount / 10000).toFixed(1)}万` : '未填写'}
                          </span>
                        </div>
                        <div>
                          <strong>最大亏损承受：</strong>
                          <span style={{ color: '#666' }}>
                            {getMaxLossText(selectedTask.maxLoss)}
                          </span>
                        </div>
                        <div>
                          <strong>投资经验：</strong>
                          <span style={{ color: '#666' }}>{selectedTask.investmentExperience || '未填写'}</span>
                        </div>
                        <div>
                          <strong>投资目标：</strong>
                          <span style={{ color: '#666' }}>{selectedTask.investmentTarget || '未填写'}</span>
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                          <strong>投资期限：</strong>
                          <span style={{ color: '#666' }}>{selectedTask.investmentExpire || '未填写'}</span>
                        </div>
                        <div>
                          <strong>风险类型：</strong>
                          <span style={{
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
                          <strong>申请时间：</strong>
                          <span style={{ color: '#666' }}>{formatDateTime(selectedTask.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* 审核信息 */}
                    <div>
                      <h5 style={{ margin: '0 0 10px 0', color: '#333', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>审核信息</h5>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '14px' }}>
                        <div>
                          <strong>当前阶段：</strong>
                          <span style={{ color: '#FF9800', fontWeight: 'bold' }}>{getStageText(selectedTask.stage)}</span>
                        </div>
                        <div>
                          <strong>AI建议：</strong>
                          <span style={{ color: selectedTask.aiAudit ? '#666' : '#999' }}>
                            {selectedTask.aiAudit || '暂无AI建议'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div style={{
                      marginTop: '15px',
                      padding: '12px',
                      background: '#f8f9fa',
                      borderRadius: '4px',
                      borderLeft: '3px solid #FF9800'
                    }}>
                      <div style={{ fontSize: '13px', color: '#666' }}>
                        <strong style={{ color: '#FF9800' }}>高级审核说明：</strong>
                        该客户的风险评估申请已通过初级和中级审核，现进入高级审核阶段。请综合前两个阶段的审核意见，
                        进行最终的专业判断，确保风险评估的准确性和投资建议的合理性。
                      </div>
                    </div>
                  </div>
                )}
                
                {/* AI 推荐意见显示区域 */}
                {selectedTask.aiAudit && (
                  <div style={{
                    background: '#fff3e0',
                    border: '1px solid #ff9800',
                    borderRadius: '4px',
                    padding: '15px',
                    marginTop: '15px'
                  }}>
                    <div style={{ color: '#f57c00', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      🤖 AI 审核建议：
                    </div>
                    <div style={{ color: '#ef6c00', fontSize: '14px', lineHeight: '1.5' }}>
                      {selectedTask.aiAudit}
                    </div>
                    <div style={{ fontSize: '12px', color: '#f57c00', marginTop: '8px', fontStyle: 'italic' }}>
                      * 此建议由AI系统生成，仅供参考，最终审核结果请基于您的专业判断
                    </div>
                  </div>
                )}
                
                {/* 高级审核信息提示 */}
                <div style={{
                  background: '#fff3e0',
                  border: '1px solid #FF9800',
                  borderRadius: '4px',
                  padding: '12px',
                  marginTop: '15px'
                }}>
                  <div style={{ color: '#E65100', fontWeight: 'bold', marginBottom: '5px' }}>
                    高级审核要求：
                  </div>
                  <div style={{ color: '#E65100', fontSize: '14px' }}>
                    • 高级审核是第三道关卡，需要最专业的风险评估和投资建议<br/>
                    • 风险评分范围：0-100分（分数越高风险承受能力越强）<br/>
                    • 审核意见必须详细说明评估理由（至少5个字符）<br/>
                    • 稳健型客户：通过后直接完成审核流程<br/>
                    • 激进型客户：通过后流转到投资委员会最终审核<br/>
                    • <strong>重点关注：</strong>复杂金融产品适合性评估、大额投资合理性分析、风险控制方案设计
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
                <h3 style={{ marginBottom: '20px' }}>高级审核意见</h3>
                
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
                    高级审核意见 <span style={{ color: '#f44336' }}>*</span>
                  </label>
                  <textarea
                    value={auditForm.opinion}
                    onChange={(e) => setAuditForm(prev => ({ ...prev, opinion: e.target.value }))}
                    placeholder="请详细说明高级审核理由，包括：1）复杂金融产品适合性专业评估；2）大额投资合理性深度分析；3）风险控制方案专业设计；4）通过/拒绝的具体专业依据"
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
                      background: submitLoading ? '#ccc' : '#FF9800',
                      color: 'white',
                      transition: 'all 0.3s'
                    }}
                    onMouseOver={(e) => {
                      if (!submitLoading) e.currentTarget.style.background = '#F57C00';
                    }}
                    onMouseOut={(e) => {
                      if (!submitLoading) e.currentTarget.style.background = '#FF9800';
                    }}
                  >
                    {submitLoading ? '提交中...' : '提交高级审核结果'}
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
        }
      `}</style>
    </div>
  );
};

export default SeniorAuditPage;