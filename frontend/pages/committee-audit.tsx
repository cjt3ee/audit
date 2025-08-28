import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getAuditTasks, submitAuditResult, formatPhone, formatDateTime, getRiskTypeBadgeClass, getStageText, validateAuditForm } from '../utils/auditorApi';
import { AuditTaskDto, AuditForm } from '../types/auditor';

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
      const response = await getAuditTasks(3); // 投资委员会级别为3
      if (response.success && response.data) {
        setTasks(response.data.tasks);
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
      approved: 12, // 模拟数据
      needReview: 2, // 模拟数据
      totalAmount: (totalAmount / 10000).toFixed(1) + '万'
    });
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
  };

  // 取消审核
  const cancelAudit = () => {
    setSelectedTask(null);
    setAuditForm({
      auditId: 0,
      approved: true,
      riskScore: 50,
      opinion: ''
    });
    setFormErrors([]);
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
        approved: auditForm.approved,
        riskScore: auditForm.riskScore,
        opinion: auditForm.opinion
      };

      const response = await submitAuditResult(request);
      
      if (response.success) {
        alert(`最终审核结果提交成功！\n状态：${response.data?.workflowStatus || '已处理'}\n${response.data?.message || ''}`);
        cancelAudit();
        fetchTasks();
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
      fetchTasks();
    }
  }, [auditorInfo]);

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
            background: '#9C27B0',
            color: 'white',
            fontSize: '16px'
          }}>
            投资委员会审核工作台
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

              {/* 客户信息 */}
              <div style={{
                background: '#f9f9f9',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '20px',
                borderLeft: '4px solid #9C27B0'
              }}>
                <h3 style={{ marginBottom: '15px' }}>客户信息</h3>
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
                  <div>
                    <strong>审核阶段：</strong>{getStageText(selectedTask.stage)}
                  </div>
                  <div>
                    <strong>提交时间：</strong>{formatDateTime(selectedTask.createdAt)}
                  </div>
                </div>
                
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