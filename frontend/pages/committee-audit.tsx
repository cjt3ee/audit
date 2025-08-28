import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getMergedTasks, submitAuditResult, getAuditHistory, getAuditorHistory, removeCompletedTask, formatPhone, formatDateTime, getRiskTypeBadgeClass, getStageText, validateAuditForm, getMaxLossText, getNewAuditTasks } from '../utils/auditorApi';
import { AuditTaskDto, AuditForm, AuditResultDto } from '../types/auditor';

const CommitteeAuditPage: React.FC = () => {
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
  const [newTaskNotification, setNewTaskNotification] = useState<string | null>(null);
  const [processedAuditIds, setProcessedAuditIds] = useState<Set<number>>(new Set());
  const router = useRouter();

  // 检查登录状态
  useEffect(() => {
    const storedAuditorInfo = localStorage.getItem('auditorInfo');
    if (!storedAuditorInfo) {
      router.push('/auditor-login');
      return;
    }
    
    const info = JSON.parse(storedAuditorInfo);
    if (info.level !== 3) {
      alert('您没有权限访问投资委员会页面');
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
      const response = await getMergedTasks(3, auditorInfo.auditorId); // 传递审核员ID
      if (response.success && response.data) {
        // 对获取的任务进行去重，确保不与当前任务列表重复
        const currentTaskIds = tasks.map(task => task.auditId);
        const uniqueTasks = response.data.tasks.filter((newTask: AuditTaskDto) => 
          !currentTaskIds.includes(newTask.auditId)
        );
        
        // 合并当前任务和新的唯一任务
        const allTasks = [...tasks, ...uniqueTasks];
        setTasks(allTasks);
        calculateStats(allTasks);
        
        // 将新任务的auditId加入历史记录
        const updatedIds = new Set(processedAuditIds);
        uniqueTasks.forEach((task: AuditTaskDto) => updatedIds.add(task.auditId));
        setProcessedAuditIds(updatedIds);
        
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

  // 轮询检查新任务
  const checkForNewTasks = async () => {
    if (!auditorInfo) return;
    
    try {
      const currentTaskIds = tasks.map(task => task.auditId);
      const response = await getNewAuditTasks(3, auditorInfo.auditorId, currentTaskIds);
      
      if (response.success && response.data && response.data.tasks.length > 0) {
        // 先对后端返回的任务进行内部去重，确保同一审核ID只保留一个
        const uniqueNewTasks = response.data.tasks.reduce((acc: AuditTaskDto[], current: AuditTaskDto) => {
          const existingTask = acc.find(task => task.auditId === current.auditId);
          if (!existingTask) {
            acc.push(current);
          }
          return acc;
        }, []);
        
        // 过滤掉前端已存在的任务和历史处理过的任务
        const newTasks = uniqueNewTasks.filter(newTask => 
          !currentTaskIds.includes(newTask.auditId) && !processedAuditIds.has(newTask.auditId)
        );
        
        if (newTasks.length > 0) {
          // 有新任务，显示通知
          setNewTaskNotification("有新的审核任务，请及时处理QAQ");
          
          // 3秒后自动隐藏通知
          setTimeout(() => {
            setNewTaskNotification(null);
          }, 3000);
          
          // 更新历史处理记录
          const newProcessedIds = new Set(processedAuditIds);
          newTasks.forEach(task => newProcessedIds.add(task.auditId));
          setProcessedAuditIds(newProcessedIds);
          
          // 更新任务列表，只添加去重后的新任务
          const updatedTasks = [...tasks, ...newTasks];
          setTasks(updatedTasks);
          calculateStats(updatedTasks);
        }
      }
    } catch (error) {
      console.error('检查新任务失败:', error);
    }
  };

  // 计算统计数据
  const calculateStats = (taskList: AuditTaskDto[]) => {
    const pending = taskList.length;
    const totalAmount = taskList.reduce((sum, task) => sum + (task.investAmount || 0), 0);
    
    setStats({
      pending,
      approved: 12, // 模拟数据
      needReview: 2, // 模拟数据
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
    // 获取审核历史（投资委员会可以看到初级、中级、高级的意见）
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
    console.log('投资委员会审核提交被触发');
    console.log('当前表单数据：', auditForm);
    
    setFormErrors([]);
    
    const validation = validateAuditForm(auditForm.approved, auditForm.riskScore, auditForm.opinion);
    
    if (!validation.isValid) {
      console.log('表单验证失败：', validation.errors);
      setFormErrors(validation.errors);
      return;
    }

    // 增强确认对话框
    const confirmMessage = auditForm.approved 
      ? `⚠️ 投资委员会最终决定 ⚠️\n\n确认【批准】该投资申请吗？\n\n风险评分：${auditForm.riskScore}分\n审核意见：${auditForm.opinion.substring(0, 100)}${auditForm.opinion.length > 100 ? '...' : ''}\n\n❗️ 重要提醒：这是最终审核决定，提交后不可撤销！\n\n请再次确认您要提交此决定。`
      : `⚠️ 投资委员会最终决定 ⚠️\n\n确认【拒绝】该投资申请吗？\n\n风险评分：${auditForm.riskScore}分\n审核意见：${auditForm.opinion.substring(0, 100)}${auditForm.opinion.length > 100 ? '...' : ''}\n\n❗️ 重要提醒：这是最终审核决定，提交后不可撤销！\n\n请再次确认您要提交此决定。`;
    
    console.log('显示确认对话框');
    if (!confirm(confirmMessage)) {
      console.log('用户取消了提交');
      return;
    }
    
    console.log('用户确认提交，开始处理...');

    setSubmitLoading(true);
    try {
      const request = {
        auditId: auditForm.auditId,
        auditorLevel: 3, // 投资委员会
        auditorId: auditorInfo.auditorId, // 添加审核员ID
        approved: auditForm.approved,
        riskScore: auditForm.riskScore,
        opinion: auditForm.opinion
      };

      const response = await submitAuditResult(request);
      
      if (response.success) {
        alert(`最终审核结果提交成功！\n状态：${response.data?.workflowStatus || '已处理'}\n${response.data?.message || ''}`);
        
        // 从缓存中移除已完成的任务
        removeCompletedTask(3, auditForm.auditId);
        
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

  // 设置定时轮询新任务（仅在当前任务标签页且有审核员信息时）
  useEffect(() => {
    if (auditorInfo && activeTab === 'current') {
      const interval = setInterval(checkForNewTasks, 15000); // 15秒轮询一次
      return () => clearInterval(interval);
    }
  }, [auditorInfo, activeTab, tasks]);

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
        background: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)',
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

      {/* 新任务通知 */}
      {newTaskNotification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#4CAF50',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 1000,
          fontSize: '16px',
          fontWeight: 'bold',
          animation: 'slideDown 0.3s ease-out'
        }}>
          {newTaskNotification}
        </div>
      )}

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
              background: activeTab === 'current' ? '#9C27B0' : '#f0f0f0',
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
              background: activeTab === 'history' ? '#9C27B0' : '#f0f0f0',
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
                borderBottom: '2px solid #9C27B0',
                paddingBottom: '10px'
              }}>
                投资委员会审核工作台
              </h2>
              <p style={{ marginBottom: '20px', color: '#666' }}>管理和审核客户投资风险评估申请 - 投资委员会最终审核</p>

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
                  borderLeft: '4px solid #9C27B0'
                }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#9C27B0', marginBottom: '5px' }}>
                    {stats.pending}
                  </div>
                  <div style={{ color: '#666', fontSize: '14px' }}>待终审</div>
                </div>
                <div style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  borderLeft: '4px solid #9C27B0'
                }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#9C27B0', marginBottom: '5px' }}>
                    {stats.approved}
                  </div>
                  <div style={{ color: '#666', fontSize: '14px' }}>已通过</div>
                </div>
                <div style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  borderLeft: '4px solid #9C27B0'
                }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#9C27B0', marginBottom: '5px' }}>
                    {stats.needReview}
                  </div>
                  <div style={{ color: '#666', fontSize: '14px' }}>已拒绝</div>
                </div>
                <div style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  borderLeft: '4px solid #9C27B0'
                }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#9C27B0', marginBottom: '5px' }}>
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
                borderLeft: '4px solid #9C27B0'
              }}>
                <h3 style={{ marginBottom: '20px' }}>待终审申请</h3>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>加载中...</div>
                ) : tasks.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                    暂无待终审任务
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
                              background: '#9C27B0',
                              color: 'white',
                              transition: 'all 0.3s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = '#7B1FA2'}
                            onMouseOut={(e) => e.currentTarget.style.background = '#9C27B0'}
                          >
                            最终审核
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
                borderBottom: '2px solid #9C27B0',
                paddingBottom: '10px'
              }}>
                已审核任务历史
              </h2>
              <p style={{ marginBottom: '20px', color: '#666' }}>查看您已完成的投资委员会审核任务历史记录</p>

              {/* 已审核任务列表 */}
              <div style={{
                background: '#f9f9f9',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '20px',
                borderLeft: '4px solid #9C27B0'
              }}>
                <h3 style={{ marginBottom: '20px' }}>投资委员会审核历史</h3>
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
                            审核流程ID: {record.auditId}
                          </div>
                          <div style={{ color: '#666', fontSize: '14px', marginBottom: '2px' }}>
                            风险评分: {record.riskScore}分
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
                              borderLeft: '3px solid #667eea'
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
                  borderBottom: '2px solid #9C27B0',
                  paddingBottom: '10px'
                }}>
                  投资委员会最终审核
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
                        // 投资委员会(3)可以看初级(0)、中级(1)、高级(2)的意见
                        return history.stage < 3;
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
                    {auditHistory.filter(h => h.stage < 3).length === 0 && (
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
                borderLeft: '4px solid #9C27B0'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0 }}>客户信息</h3>
                  <button
                    onClick={() => setShowDetailedInfo(!showDetailedInfo)}
                    style={{
                      background: 'none',
                      border: '1px solid #9C27B0',
                      color: '#9C27B0',
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
                      e.currentTarget.style.background = '#9C27B0';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'none';
                      e.currentTarget.style.color = '#9C27B0';
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
                    <h4 style={{ marginTop: '0', marginBottom: '12px', color: '#f44336' }}>详细表单信息</h4>
                    
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
                            color: '#f44336',
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
                          <span style={{ color: '#f44336', fontWeight: 'bold' }}>{getStageText(selectedTask.stage)}</span>
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
                      borderLeft: '3px solid #f44336'
                    }}>
                      <div style={{ fontSize: '13px', color: '#666' }}>
                        <strong style={{ color: '#f44336' }}>委员会审核说明：</strong>
                        该客户的风险评估申请已通过所有前序审核阶段，现提交投资委员会进行最终决策。
                        请综合各阶段审核意见，做出最终的投资建议和风险等级确认。
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
                
                {/* 投资委员会审核信息提示 */}
                <div style={{
                  background: '#f3e5f5',
                  border: '1px solid #9C27B0',
                  borderRadius: '4px',
                  padding: '12px',
                  marginTop: '15px'
                }}>
                  <div style={{ color: '#4A148C', fontWeight: 'bold', marginBottom: '5px' }}>
                    投资委员会最终审核要求：
                  </div>
                  <div style={{ color: '#4A148C', fontSize: '14px' }}>
                    • 投资委员会是最高级别审核机构，负责最终投资决策<br/>
                    • 风险评分范围：0-100分（分数越高风险承受能力越强）<br/>
                    • 审核意见必须详细说明评估理由（至少5个字符）<br/>
                    • <strong style={{color: '#F44336'}}>重要：</strong>无论通过或拒绝，此决定为最终决定，直接完成审核流程<br/>
                    • <strong>重点关注：</strong>战略投资价值评估、市场风险综合分析、监管合规最终确认、投资委员会集体决策
                  </div>
                </div>
              </div>

              {/* 审核表单 */}
              <div 
                style={{
                  background: 'white',
                  border: '1px solid #eee',
                  borderRadius: '8px',
                  padding: '20px'
                }}
                onSubmit={(e) => {
                  e.preventDefault();
                  console.log('表单提交被阻止');
                }}
              >
                <h3 style={{ marginBottom: '20px' }}>投资委员会最终意见</h3>
                
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
                    最终决定 <span style={{ color: '#f44336' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: '20px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        checked={auditForm.approved}
                        onChange={() => setAuditForm(prev => ({ ...prev, approved: true }))}
                        style={{ marginRight: '8px' }}
                      />
                      批准投资
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        checked={!auditForm.approved}
                        onChange={() => setAuditForm(prev => ({ ...prev, approved: false }))}
                        style={{ marginRight: '8px' }}
                      />
                      拒绝投资
                    </label>
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                    最终风险评分 (0-100) <span style={{ color: '#f44336' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={auditForm.riskScore}
                    onChange={(e) => setAuditForm(prev => ({ ...prev, riskScore: parseInt(e.target.value) || 0 }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                      }
                    }}
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
                    投资委员会最终决议 <span style={{ color: '#f44336' }}>*</span>
                  </label>
                  <textarea
                    value={auditForm.opinion}
                    onChange={(e) => setAuditForm(prev => ({ ...prev, opinion: e.target.value }))}
                    onKeyDown={(e) => {
                      // 防止Ctrl+Enter或其他快捷键意外提交
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        console.log('防止意外提交：Ctrl+Enter被拦截');
                      }
                    }}
                    placeholder="请详细说明投资委员会最终决议，包括：1）战略投资价值综合评估；2）市场风险全面分析；3）监管合规最终确认；4）委员会集体决策过程和结果；5）批准/拒绝的最终理由"
                    rows={8}
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
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('按钮被点击');
                      handleSubmitAudit();
                    }}
                    disabled={submitLoading || auditForm.opinion.trim().length < 5}
                    style={{
                      padding: '15px 40px',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: (submitLoading || auditForm.opinion.trim().length < 5) ? 'not-allowed' : 'pointer',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      background: (submitLoading || auditForm.opinion.trim().length < 5) ? '#ccc' : '#9C27B0',
                      color: 'white',
                      transition: 'all 0.3s',
                      boxShadow: '0 4px 8px rgba(156, 39, 176, 0.3)',
                      opacity: (auditForm.opinion.trim().length < 5) ? 0.6 : 1
                    }}
                    onMouseOver={(e) => {
                      if (!submitLoading && auditForm.opinion.trim().length >= 5) {
                        e.currentTarget.style.background = '#7B1FA2';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!submitLoading && auditForm.opinion.trim().length >= 5) {
                        e.currentTarget.style.background = '#9C27B0';
                      }
                    }}
                  >
                    {submitLoading ? '提交中...' : 
                     auditForm.opinion.trim().length < 5 ? '请填写完整审核意见' : 
                     '提交最终决议'}
                  </button>
                  <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                    {auditForm.opinion.trim().length < 5 ? (
                      <span style={{ color: '#f44336' }}>
                        ⚠️ 请先输入至少5个字符的审核意见
                      </span>
                    ) : (
                      '注意：此决定为最终决定，提交后不可撤销'
                    )}
                  </div>
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

export default CommitteeAuditPage;