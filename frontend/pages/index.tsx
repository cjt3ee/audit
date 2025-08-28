import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { FormData, SelectedAnswers } from '../types/api';
import { 
  calculateRiskScore, 
  getRiskConfig, 
  getIncomeCode, 
  getMaxLossCode, 
  getExperienceText,
  getRiskTypeText,
  getRiskTypeBadgeClass
} from '../utils/riskScoring';
import { submitQuestionnaire, getAuditStatus } from '../utils/api';

const CustomerPage = () => {
  // 表单数据状态
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    idCard: '',
    email: '',
    occupation: '',
    investAmount: '',
    age: '',
    income: '',
    experience: '',
    riskTolerance: '',
    goal: '',
    period: ''
  });

  // 其他状态
  const [selectedAnswers, setSelectedAnswers] = useState<SelectedAnswers>({});
  const [riskScore, setRiskScore] = useState(65);
  const [activeTab, setActiveTab] = useState<'risk-assessment' | 'audit-result'>('risk-assessment');
  const [isLoading, setIsLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [auditResult, setAuditResult] = useState<any>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // 计算风险评分
  useEffect(() => {
    const score = calculateRiskScore(selectedAnswers);
    setRiskScore(score);
  }, [selectedAnswers]);

  // 处理表单输入
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // 清除该字段的错误信息
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // 处理选项选择
  const handleOptionSelect = (group: string, value: string) => {
    const updatedAnswers = {
      ...selectedAnswers,
      [group]: value
    };
    setSelectedAnswers(updatedAnswers);

    // 更新表单数据 - 需要映射group名称到formData字段
    const fieldMapping: { [key: string]: keyof FormData } = {
      'age': 'age',
      'income': 'income',
      'experience': 'experience',
      'risk-tolerance': 'riskTolerance',
      'goal': 'goal',
      'period': 'period'
    };

    const formField = fieldMapping[group];
    if (formField) {
      setFormData(prev => ({
        ...prev,
        [formField]: value
      }));
    }
  };

  // 验证表单
  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};
    
    // 必填字段验证
    if (!formData.name.trim()) errors.name = '请输入姓名';
    if (!formData.phone.trim()) errors.phone = '请输入手机号';
    else if (!/^1[0-9]\d{9}$/.test(formData.phone)) errors.phone = '请输入正确的手机号格式';
    
    if (!formData.idCard.trim()) errors.idCard = '请输入身份证号';
    else if (!/^\d{17}[\dX]$/.test(formData.idCard)) errors.idCard = '请输入正确的身份证号格式';
    
    if (!formData.investAmount) errors.investAmount = '请输入投资金额';
    else if (Number(formData.investAmount) <= 0) errors.investAmount = '投资金额必须大于0';

    // 问卷必填项验证
    const requiredQuestions = [
      { key: 'age', field: 'age' },
      { key: 'income', field: 'income' },
      { key: 'experience', field: 'experience' },
      { key: 'risk-tolerance', field: 'riskTolerance' },
      { key: 'goal', field: 'goal' },
      { key: 'period', field: 'period' }
    ];
    requiredQuestions.forEach(({ key, field }) => {
      if (!selectedAnswers[key as keyof SelectedAnswers]) {
        errors[field] = '请选择此项';
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 提交评估
  const handleSubmitAssessment = async () => {
    if (!validateForm()) {
      setSubmitMessage('请填写所有必填信息并完成风险评估问卷！');
      return;
    }

    setIsLoading(true);
    setSubmitMessage('');

    try {
      const requestData = {
        customerInfo: {
          name: formData.name,
          phone: formData.phone,
          idCard: formData.idCard,
          email: formData.email || undefined,
          occupation: formData.occupation || undefined,
          investAmount: Number(formData.investAmount) * 10000 // 转换为元
        },
        riskAssessment: {
          annualIncome: getIncomeCode(formData.income),
          investmentAmount: Number(formData.investAmount) * 10000,
          investmentExperience: getExperienceText(formData.experience),
          maxLoss: getMaxLossCode(formData.riskTolerance),
          investmentTarget: formData.goal,
          investmentExpire: formData.period,
          score: riskScore
        }
      };

      const response = await submitQuestionnaire(requestData);
      
      if (response.success) {
        setCustomerId(response.data);
        setSubmitMessage('风险评估提交成功！系统已为您生成客户ID并进入审核流程。');
        // 自动切换到审核结果页面
        setTimeout(() => {
          setActiveTab('audit-result');
          checkAuditStatus(response.data);
        }, 1500);
      } else {
        setSubmitMessage(`提交失败: ${response.message}`);
      }
    } catch (error) {
      console.error('Submit error:', error);
      setSubmitMessage('提交失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 查询审核状态
  const checkAuditStatus = async (customerIdToCheck?: number) => {
    if (!customerIdToCheck && !customerId) return;
    
    const idToCheck = customerIdToCheck || customerId!;
    setIsLoading(true);

    try {
      const response = await getAuditStatus(idToCheck);
      if (response.success) {
        setAuditResult(response.data);
      }
    } catch (error) {
      console.error('Status check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 获取风险配置
  const riskConfig = getRiskConfig(riskScore);

  return (
    <>
      <Head>
        <title>银行投资风险审核系统</title>
        <meta name="description" content="为客户提供专业的投资风险评估和审核服务" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="header">
        <h1>银行投资风险审核系统</h1>
        <p>为客户提供专业的投资风险评估和审核服务</p>
      </div>

      <div className="container">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'risk-assessment' ? 'active' : ''}`}
            onClick={() => setActiveTab('risk-assessment')}
          >
            客户风险评估
          </button>
          <button 
            className={`tab ${activeTab === 'audit-result' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit-result')}
            disabled={!customerId}
          >
            审核结果查询
          </button>
        </div>

        {/* 客户风险评估 */}
        {activeTab === 'risk-assessment' && (
          <div className="content">
            <h2 className="section-title">客户风险评估</h2>
            
            <div className="info-section">
              <h4>评估说明</h4>
              <p>请如实填写以下信息，我们将根据您的基本情况和风险偏好为您进行专业的投资风险评估，并推荐适合的投资组合。</p>
            </div>

            <div className="card">
              <h3>客户基本信息</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>姓名 <span className="required">*</span></label>
                  <input 
                    type="text" 
                    className={`form-input ${formErrors.name ? 'error' : ''}`}
                    placeholder="请输入您的真实姓名"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                  {formErrors.name && <div className="error-message">{formErrors.name}</div>}
                </div>
                <div className="form-group">
                  <label>手机号 <span className="required">*</span></label>
                  <input 
                    type="tel" 
                    className={`form-input ${formErrors.phone ? 'error' : ''}`}
                    placeholder="请输入您的手机号码"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                  {formErrors.phone && <div className="error-message">{formErrors.phone}</div>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>身份证号 <span className="required">*</span></label>
                  <input 
                    type="text" 
                    className={`form-input ${formErrors.idCard ? 'error' : ''}`}
                    placeholder="请输入您的身份证号码"
                    value={formData.idCard}
                    onChange={(e) => handleInputChange('idCard', e.target.value)}
                  />
                  {formErrors.idCard && <div className="error-message">{formErrors.idCard}</div>}
                </div>
                <div className="form-group">
                  <label>电子邮箱</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="请输入您的邮箱地址"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>职业</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="请输入您的职业"
                    value={formData.occupation}
                    onChange={(e) => handleInputChange('occupation', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>投资金额 <span className="required">*</span></label>
                  <input 
                    type="number" 
                    className={`form-input ${formErrors.investAmount ? 'error' : ''}`}
                    placeholder="请输入计划投资金额（万元）"
                    value={formData.investAmount}
                    onChange={(e) => handleInputChange('investAmount', e.target.value)}
                  />
                  {formErrors.investAmount && <div className="error-message">{formErrors.investAmount}</div>}
                </div>
              </div>
            </div>

            <div className="card">
              <h3>风险评估问卷</h3>
              <p>请根据您的实际情况选择最符合的选项</p>
              
              {/* 问卷题目 */}
              <div className="form-group">
                <label>1. 您的年龄范围？</label>
                <div className="form-options">
                  {['18-30岁', '31-45岁', '46-60岁', '60岁以上'].map(option => (
                    <div 
                      key={option}
                      className={`option-btn ${selectedAnswers.age === option ? 'selected' : ''}`}
                      onClick={() => handleOptionSelect('age', option)}
                    >
                      {option}
                    </div>
                  ))}
                </div>
                {formErrors.age && <div className="error-message">{formErrors.age}</div>}
              </div>

              <div className="form-group">
                <label>2. 您的年收入水平？</label>
                <div className="form-options">
                  {['10万以下', '10-30万', '30-50万', '50万以上'].map(option => (
                    <div 
                      key={option}
                      className={`option-btn ${selectedAnswers.income === option ? 'selected' : ''}`}
                      onClick={() => handleOptionSelect('income', option)}
                    >
                      {option}
                    </div>
                  ))}
                </div>
                {formErrors.income && <div className="error-message">{formErrors.income}</div>}
              </div>

              <div className="form-group">
                <label>3. 您的投资经验？</label>
                <div className="form-options">
                  {['无经验', '1-3年', '3-5年', '5年以上'].map(option => (
                    <div 
                      key={option}
                      className={`option-btn ${selectedAnswers.experience === option ? 'selected' : ''}`}
                      onClick={() => handleOptionSelect('experience', option)}
                    >
                      {option}
                    </div>
                  ))}
                </div>
                {formErrors.experience && <div className="error-message">{formErrors.experience}</div>}
              </div>

              <div className="form-group">
                <label>4. 您能承受的最大亏损？</label>
                <div className="form-options">
                  {['5%以内', '5-15%', '15-30%', '30%以上'].map(option => (
                    <div 
                      key={option}
                      className={`option-btn ${selectedAnswers['risk-tolerance'] === option ? 'selected' : ''}`}
                      onClick={() => handleOptionSelect('risk-tolerance', option)}
                    >
                      {option}
                    </div>
                  ))}
                </div>
                {formErrors.riskTolerance && <div className="error-message">{formErrors.riskTolerance}</div>}
              </div>

              <div className="form-group">
                <label>5. 您的投资目标？</label>
                <div className="form-options">
                  {['资产保值', '稳健增值', '积极增长', '追求高收益'].map(option => (
                    <div 
                      key={option}
                      className={`option-btn ${selectedAnswers.goal === option ? 'selected' : ''}`}
                      onClick={() => handleOptionSelect('goal', option)}
                    >
                      {option}
                    </div>
                  ))}
                </div>
                {formErrors.goal && <div className="error-message">{formErrors.goal}</div>}
              </div>

              <div className="form-group">
                <label>6. 您的投资期限？</label>
                <div className="form-options">
                  {['1年以内', '1-3年', '3-5年', '5年以上'].map(option => (
                    <div 
                      key={option}
                      className={`option-btn ${selectedAnswers.period === option ? 'selected' : ''}`}
                      onClick={() => handleOptionSelect('period', option)}
                    >
                      {option}
                    </div>
                  ))}
                </div>
                {formErrors.period && <div className="error-message">{formErrors.period}</div>}
              </div>

              <div className="form-group">
                <label>风险评分</label>
                <div className="risk-score">
                  <div 
                    className="risk-indicator" 
                    style={{ left: `${riskScore}%` }}
                  ></div>
                </div>
                <div className="risk-level">
                  <span className={`badge ${riskConfig.badgeClass}`}>
                    {riskConfig.level}
                  </span>
                  <span>{riskConfig.description}</span>
                </div>
              </div>

              <button 
                className={`btn btn-primary btn-large ${isLoading ? 'loading' : ''}`}
                onClick={handleSubmitAssessment}
                disabled={isLoading}
              >
                {isLoading ? '提交中...' : '提交风险评估'}
              </button>

              {submitMessage && (
                <div className={submitMessage.includes('成功') ? 'success-message' : 'error-message'}>
                  {submitMessage}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 审核结果查询 */}
        {activeTab === 'audit-result' && (
          <div className="content">
            <h2 className="section-title">审核结果查询</h2>
            
            {customerId && (
              <div className="info-section">
                <h4>客户信息</h4>
                <p>客户ID: {customerId}</p>
                <p>客户姓名: {formData.name}</p>
                <p>手机号: {formData.phone}</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => checkAuditStatus()}
                  disabled={isLoading}
                >
                  {isLoading ? '查询中...' : '刷新审核状态'}
                </button>
              </div>
            )}

            {auditResult && (
              <div className="audit-result">
                <div className="result-title">审核结果</div>
                <div className="result-content">
                  <p><strong>审核状态:</strong> {
                    auditResult.status === 'completed' ? '已完成' :
                    auditResult.status === 'in_progress' ? '审核中' : '未找到记录'
                  }</p>
                  <p><strong>状态说明:</strong> {auditResult.message}</p>
                  
                  {auditResult.results && auditResult.results.length > 0 && (
                    <div>
                      <p><strong>风险类型:</strong></p>
                      {auditResult.results.map((typeCode: number, index: number) => (
                        <span 
                          key={index} 
                          className={`badge risk-type-badge ${getRiskTypeBadgeClass(typeCode)}`}
                        >
                          {getRiskTypeText(typeCode)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {!auditResult && customerId && !isLoading && (
              <div className="info-section">
                <p>暂无审核结果，请点击"刷新审核状态"查询最新状态。</p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default CustomerPage;