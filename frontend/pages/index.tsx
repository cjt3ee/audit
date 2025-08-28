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
        <style jsx>{`
          /* 投资建议主要布局 */
          .investment-advice-section {
            margin-top: 40px;
            background: #fafbfc;
            border-radius: 12px;
            padding: 30px;
            border: 1px solid #e8eef5;
          }
          
          .advice-header {
            margin-bottom: 30px;
          }
          
          .advice-title {
            font-size: 24px;
            color: #2c3e50;
            margin: 0 0 15px 0;
            font-weight: 600;
          }
          
          .risk-summary {
            display: flex;
            align-items: center;
            gap: 15px;
            background: white;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          }
          
          .risk-label {
            font-size: 16px;
            color: #666;
            font-weight: 500;
          }
          
          .risk-score-value {
            font-size: 28px;
            font-weight: bold;
            color: #667eea;
            background: #f0f4ff;
            padding: 8px 16px;
            border-radius: 50px;
            min-width: 60px;
            text-align: center;
          }
          
          .risk-type-text {
            font-size: 16px;
            color: #2c3e50;
            font-weight: 600;
            background: #667eea;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
          }

          /* 推荐组合部分 */
          .recommended-portfolio-section {
            margin-top: 30px;
          }
          
          .recommended-title {
            font-size: 20px;
            color: #2c3e50;
            margin: 0 0 20px 0;
            font-weight: 600;
          }

          /* 特色投资组合 */
          .featured-portfolio {
            background: white;
            border-radius: 12px;
            padding: 0;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            border: 2px solid transparent;
            overflow: hidden;
            transition: all 0.3s ease;
          }

          .featured-portfolio:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 30px rgba(0,0,0,0.12);
          }

          .featured-portfolio.conservative {
            border-color: #4CAF50;
          }

          .featured-portfolio.moderate {
            border-color: #FF9800;
          }

          .featured-portfolio.aggressive {
            border-color: #F44336;
          }

          .portfolio-header-featured {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 25px 30px;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-bottom: 1px solid #e9ecef;
          }

          .portfolio-info h3 {
            font-size: 22px;
            margin: 0 0 10px 0;
            color: #2c3e50;
            font-weight: 600;
          }

          .portfolio-tags {
            display: flex;
            gap: 10px;
            align-items: center;
          }

          .risk-tag, .return-tag {
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
          }

          .risk-tag.conservative {
            background: #e8f5e8;
            color: #2e7d32;
          }

          .risk-tag.moderate {
            background: #fff3e0;
            color: #ef6c00;
          }

          .risk-tag.aggressive {
            background: #ffebee;
            color: #c62828;
          }

          .return-tag {
            background: #e3f2fd;
            color: #1565c0;
            border: 1px solid #bbdefb;
          }

          .recommended-badge {
            background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
          }

          .portfolio-content {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            padding: 30px;
          }

          .allocation-section h5, .portfolio-features h5 {
            font-size: 16px;
            color: #2c3e50;
            margin: 0 0 20px 0;
            font-weight: 600;
            border-bottom: 2px solid #f0f4ff;
            padding-bottom: 8px;
          }

          .allocation-list {
            display: flex;
            flex-direction: column;
            gap: 15px;
          }

          .allocation-item-clean {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 12px;
            transition: all 0.2s ease;
          }

          .allocation-item-clean:hover {
            background: #e9ecef;
            transform: translateX(4px);
          }

          .asset-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
          }

          .asset-name {
            font-size: 14px;
            color: #495057;
            font-weight: 500;
          }

          .asset-percent {
            font-size: 14px;
            font-weight: 600;
            color: #2c3e50;
          }

          .progress-bar {
            height: 6px;
            background: #e9ecef;
            border-radius: 3px;
            overflow: hidden;
          }

          .progress-fill {
            height: 100%;
            border-radius: 3px;
            transition: width 0.8s ease;
          }

          .progress-fill.conservative {
            background: linear-gradient(90deg, #4CAF50 0%, #81C784 100%);
          }

          .progress-fill.moderate {
            background: linear-gradient(90deg, #FF9800 0%, #FFB74D 100%);
          }

          .progress-fill.aggressive {
            background: linear-gradient(90deg, #F44336 0%, #EF5350 100%);
          }

          .portfolio-features ul {
            list-style: none;
            padding: 0;
            margin: 0;
          }

          .portfolio-features li {
            padding: 8px 0;
            font-size: 14px;
            color: #495057;
            border-bottom: 1px solid #f0f0f0;
          }

          .portfolio-features li:last-child {
            border-bottom: none;
          }

          /* 免责声明 */
          .investment-disclaimer {
            margin-top: 30px;
            background: white;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            overflow: hidden;
          }

          .disclaimer-header {
            display: flex;
            align-items: center;
            gap: 10px;
            background: #ffeaa7;
            padding: 15px 20px;
          }

          .disclaimer-header h4 {
            margin: 0;
            color: #2c3e50;
            font-size: 16px;
            font-weight: 600;
          }

          .disclaimer-icon {
            font-size: 18px;
          }

          .disclaimer-content {
            padding: 20px;
          }

          .disclaimer-content p {
            margin: 0 0 8px 0;
            font-size: 14px;
            color: #666;
            line-height: 1.6;
          }

          .disclaimer-content p:last-child {
            margin-bottom: 0;
          }

          /* 响应式设计 */
          @media (max-width: 768px) {
            .investment-advice-section {
              padding: 20px;
              margin-top: 20px;
            }
            
            .risk-summary {
              flex-direction: column;
              align-items: flex-start;
              gap: 10px;
            }

            .portfolio-content {
              grid-template-columns: 1fr;
              gap: 20px;
              padding: 20px;
            }

            .portfolio-header-featured {
              flex-direction: column;
              align-items: flex-start;
              gap: 15px;
              padding: 20px;
            }

            .portfolio-tags {
              align-self: stretch;
              justify-content: space-between;
            }

            .recommended-badge {
              align-self: flex-end;
            }
          }
        `}</style>
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
                      <div className="audit-details">
                        <h4>审核详情:</h4>
                        {auditResult.results.map((result: any, index: number) => (
                          <div key={index} className="audit-stage-result">
                            <p><strong>审核阶段:</strong> {
                              result.stage === 0 ? '初级审核' :
                              result.stage === 1 ? '中级审核' :
                              result.stage === 2 ? '高级审核' :
                              result.stage === 3 ? '委员会审核' : '未知阶段'
                            }</p>
                            <p><strong>风险评分:</strong> {result.riskScore}</p>
                            <p><strong>审核意见:</strong> {result.opinion}</p>
                            <p><strong>审核时间:</strong> {new Date(result.createdAt).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                      <div className="final-risk-type">
                        <p><strong>最终风险分类:</strong></p>
                        {(() => {
                          // 获取最后一个审核结果的风险评分
                          const lastResult = auditResult.results[auditResult.results.length - 1];
                          const finalScore = lastResult.riskScore;
                          
                          // 根据风险分数映射风险类型
                          let riskType: string;
                          let badgeClass: string;
                          
                          if (finalScore >= 0 && finalScore <= 40) {
                            riskType = '保守型';
                            badgeClass = 'badge-conservative';
                          } else if (finalScore >= 41 && finalScore <= 70) {
                            riskType = '稳健型';
                            badgeClass = 'badge-moderate';
                          } else if (finalScore >= 71 && finalScore <= 100) {
                            riskType = '激进型';
                            badgeClass = 'badge-aggressive';
                          } else {
                            riskType = '未知类型';
                            badgeClass = 'badge-moderate';
                          }
                          
                          return (
                            <span className={`badge risk-type-badge ${badgeClass}`}>
                              {riskType} (评分: {finalScore})
                            </span>
                          );
                        })()}
                      </div>
                      
                      {/* 投资建议部分 */}
                      {auditResult.status === 'completed' && (() => {
                        // 获取最后一个审核结果的风险评分
                        const lastResult = auditResult.results[auditResult.results.length - 1];
                        const finalScore = lastResult.riskScore;
                        
                        // 确定推荐的投资类型
                        let recommendedType = '';
                        if (finalScore <= 40) recommendedType = 'conservative';
                        else if (finalScore <= 70) recommendedType = 'moderate';
                        else recommendedType = 'aggressive';
                        
                        return (
                          <div className="investment-advice-section">
                            <div className="advice-header">
                              <h3 className="advice-title">💼 个性化投资建议</h3>
                              <div className="risk-summary">
                                <span className="risk-label">您的风险评分：</span>
                                <span className="risk-score-value">{finalScore}</span>
                                <span className="risk-type-text">
                                  {finalScore <= 40 ? '保守型投资者' : 
                                   finalScore <= 70 ? '稳健型投资者' : '激进型投资者'}
                                </span>
                              </div>
                            </div>

                            {/* 推荐组合突出显示 */}
                            <div className="recommended-portfolio-section">
                              <h4 className="recommended-title">🎯 为您量身定制的投资组合</h4>
                              
                              {recommendedType === 'conservative' && (
                                <div className="featured-portfolio conservative">
                                  <div className="portfolio-header-featured">
                                    <div className="portfolio-info">
                                      <h3>保守型组合</h3>
                                      <div className="portfolio-tags">
                                        <span className="risk-tag conservative">低风险</span>
                                        <span className="return-tag">4-6% 年化收益</span>
                                      </div>
                                    </div>
                                    <div className="recommended-badge">推荐</div>
                                  </div>
                                  <div className="portfolio-content">
                                    <div className="allocation-section">
                                      <h5>资产配置比例</h5>
                                      <div className="allocation-list">
                                        <div className="allocation-item-clean">
                                          <div className="asset-info">
                                            <span className="asset-name">货币基金</span>
                                            <span className="asset-percent">40%</span>
                                          </div>
                                          <div className="progress-bar">
                                            <div className="progress-fill conservative" style={{ width: '40%' }}></div>
                                          </div>
                                        </div>
                                        <div className="allocation-item-clean">
                                          <div className="asset-info">
                                            <span className="asset-name">国债</span>
                                            <span className="asset-percent">30%</span>
                                          </div>
                                          <div className="progress-bar">
                                            <div className="progress-fill conservative" style={{ width: '30%' }}></div>
                                          </div>
                                        </div>
                                        <div className="allocation-item-clean">
                                          <div className="asset-info">
                                            <span className="asset-name">银行理财</span>
                                            <span className="asset-percent">20%</span>
                                          </div>
                                          <div className="progress-bar">
                                            <div className="progress-fill conservative" style={{ width: '20%' }}></div>
                                          </div>
                                        </div>
                                        <div className="allocation-item-clean">
                                          <div className="asset-info">
                                            <span className="asset-name">债券基金</span>
                                            <span className="asset-percent">10%</span>
                                          </div>
                                          <div className="progress-bar">
                                            <div className="progress-fill conservative" style={{ width: '10%' }}></div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="portfolio-features">
                                      <h5>组合特点</h5>
                                      <ul>
                                        <li>✓ 本金安全性高</li>
                                        <li>✓ 收益稳定可预期</li>
                                        <li>✓ 流动性较好</li>
                                        <li>✓ 适合保值增值</li>
                                      </ul>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {recommendedType === 'moderate' && (
                                <div className="featured-portfolio moderate">
                                  <div className="portfolio-header-featured">
                                    <div className="portfolio-info">
                                      <h3>稳健型组合</h3>
                                      <div className="portfolio-tags">
                                        <span className="risk-tag moderate">中风险</span>
                                        <span className="return-tag">6-10% 年化收益</span>
                                      </div>
                                    </div>
                                    <div className="recommended-badge">推荐</div>
                                  </div>
                                  <div className="portfolio-content">
                                    <div className="allocation-section">
                                      <h5>资产配置比例</h5>
                                      <div className="allocation-list">
                                        <div className="allocation-item-clean">
                                          <div className="asset-info">
                                            <span className="asset-name">混合基金</span>
                                            <span className="asset-percent">35%</span>
                                          </div>
                                          <div className="progress-bar">
                                            <div className="progress-fill moderate" style={{ width: '35%' }}></div>
                                          </div>
                                        </div>
                                        <div className="allocation-item-clean">
                                          <div className="asset-info">
                                            <span className="asset-name">债券基金</span>
                                            <span className="asset-percent">25%</span>
                                          </div>
                                          <div className="progress-bar">
                                            <div className="progress-fill moderate" style={{ width: '25%' }}></div>
                                          </div>
                                        </div>
                                        <div className="allocation-item-clean">
                                          <div className="asset-info">
                                            <span className="asset-name">优质股票</span>
                                            <span className="asset-percent">25%</span>
                                          </div>
                                          <div className="progress-bar">
                                            <div className="progress-fill moderate" style={{ width: '25%' }}></div>
                                          </div>
                                        </div>
                                        <div className="allocation-item-clean">
                                          <div className="asset-info">
                                            <span className="asset-name">货币基金</span>
                                            <span className="asset-percent">15%</span>
                                          </div>
                                          <div className="progress-bar">
                                            <div className="progress-fill moderate" style={{ width: '15%' }}></div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="portfolio-features">
                                      <h5>组合特点</h5>
                                      <ul>
                                        <li>✓ 风险收益平衡</li>
                                        <li>✓ 长期增值潜力</li>
                                        <li>✓ 分散投资风险</li>
                                        <li>✓ 适合稳健增长</li>
                                      </ul>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {recommendedType === 'aggressive' && (
                                <div className="featured-portfolio aggressive">
                                  <div className="portfolio-header-featured">
                                    <div className="portfolio-info">
                                      <h3>激进型组合</h3>
                                      <div className="portfolio-tags">
                                        <span className="risk-tag aggressive">高风险</span>
                                        <span className="return-tag">10-15% 年化收益</span>
                                      </div>
                                    </div>
                                    <div className="recommended-badge">推荐</div>
                                  </div>
                                  <div className="portfolio-content">
                                    <div className="allocation-section">
                                      <h5>资产配置比例</h5>
                                      <div className="allocation-list">
                                        <div className="allocation-item-clean">
                                          <div className="asset-info">
                                            <span className="asset-name">成长股票</span>
                                            <span className="asset-percent">50%</span>
                                          </div>
                                          <div className="progress-bar">
                                            <div className="progress-fill aggressive" style={{ width: '50%' }}></div>
                                          </div>
                                        </div>
                                        <div className="allocation-item-clean">
                                          <div className="asset-info">
                                            <span className="asset-name">科技基金</span>
                                            <span className="asset-percent">25%</span>
                                          </div>
                                          <div className="progress-bar">
                                            <div className="progress-fill aggressive" style={{ width: '25%' }}></div>
                                          </div>
                                        </div>
                                        <div className="allocation-item-clean">
                                          <div className="asset-info">
                                            <span className="asset-name">新兴市场</span>
                                            <span className="asset-percent">15%</span>
                                          </div>
                                          <div className="progress-bar">
                                            <div className="progress-fill aggressive" style={{ width: '15%' }}></div>
                                          </div>
                                        </div>
                                        <div className="allocation-item-clean">
                                          <div className="asset-info">
                                            <span className="asset-name">债券基金</span>
                                            <span className="asset-percent">10%</span>
                                          </div>
                                          <div className="progress-bar">
                                            <div className="progress-fill aggressive" style={{ width: '10%' }}></div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="portfolio-features">
                                      <h5>组合特点</h5>
                                      <ul>
                                        <li>✓ 高成长潜力</li>
                                        <li>✓ 积极追求收益</li>
                                        <li>✓ 长期投资导向</li>
                                        <li>✓ 适合高风险偏好</li>
                                      </ul>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* 重要提示 */}
                            <div className="investment-disclaimer">
                              <div className="disclaimer-header">
                                <span className="disclaimer-icon">⚠️</span>
                                <h4>重要提示</h4>
                              </div>
                              <div className="disclaimer-content">
                                <p>• 以上投资组合建议仅供参考，请结合个人实际情况谨慎投资</p>
                                <p>• 投资有风险，过往业绩不代表未来收益表现</p>
                                <p>• 建议定期回顾并调整投资组合以适应市场变化</p>
                                <p>• 如需专业投资建议，欢迎咨询我行理财顾问团队</p>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
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