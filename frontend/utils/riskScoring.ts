import { SelectedAnswers, RiskScoreConfig } from '../types/api';

// 风险评分算法 - 基于原HTML中的逻辑
export const calculateRiskScore = (selectedAnswers: SelectedAnswers): number => {
  let score = 50; // 基础分

  // 年龄影响
  if (selectedAnswers.age === '18-30岁') score += 15;
  else if (selectedAnswers.age === '31-45岁') score += 10;
  else if (selectedAnswers.age === '46-60岁') score += 5;
  else if (selectedAnswers.age === '60岁以上') score -= 10;

  // 收入影响
  if (selectedAnswers.income === '50万以上') score += 15;
  else if (selectedAnswers.income === '30-50万') score += 10;
  else if (selectedAnswers.income === '10-30万') score += 5;

  // 经验影响
  if (selectedAnswers.experience === '5年以上') score += 15;
  else if (selectedAnswers.experience === '3-5年') score += 10;
  else if (selectedAnswers.experience === '1-3年') score += 5;

  // 风险承受能力影响
  if (selectedAnswers['risk-tolerance'] === '30%以上') score += 20;
  else if (selectedAnswers['risk-tolerance'] === '15-30%') score += 10;
  else if (selectedAnswers['risk-tolerance'] === '5-15%') score += 5;
  else if (selectedAnswers['risk-tolerance'] === '5%以内') score -= 10;

  // 投资目标影响
  if (selectedAnswers.goal === '追求高收益') score += 15;
  else if (selectedAnswers.goal === '积极增长') score += 10;
  else if (selectedAnswers.goal === '稳健增值') score += 5;
  else if (selectedAnswers.goal === '资产保值') score -= 5;

  // 投资期限影响
  if (selectedAnswers.period === '5年以上') score += 10;
  else if (selectedAnswers.period === '3-5年') score += 5;
  else if (selectedAnswers.period === '1年以内') score -= 10;

  return Math.max(0, Math.min(100, score));
};

// 根据评分获取风险等级配置
export const getRiskConfig = (score: number): RiskScoreConfig => {
  if (score < 40) {
    return {
      score,
      level: '保守型投资者',
      badgeClass: 'badge-conservative',
      description: `评分：${score}/100 - 适合低风险投资产品`
    };
  } else if (score < 70) {
    return {
      score,
      level: '稳健型投资者',
      badgeClass: 'badge-moderate',
      description: `评分：${score}/100 - 适合中等风险投资产品`
    };
  } else {
    return {
      score,
      level: '激进型投资者',
      badgeClass: 'badge-aggressive',
      description: `评分：${score}/100 - 适合高风险投资产品`
    };
  }
};

// 年收入代码映射
export const getIncomeCode = (incomeText: string): number => {
  switch (incomeText) {
    case '10万以下': return 1;
    case '10-30万': return 2;
    case '30-50万': return 3;
    case '50万以上': return 4;
    default: return 2;
  }
};

// 最大亏损代码映射
export const getMaxLossCode = (riskToleranceText: string): number => {
  switch (riskToleranceText) {
    case '5%以内': return 1;
    case '5-15%': return 2;
    case '15-30%': return 3;
    case '30%以上': return 4;
    default: return 2;
  }
};

// 投资经验文本转换
export const getExperienceText = (experienceText: string): string => {
  const experienceMap: { [key: string]: string } = {
    '无经验': '无投资经验',
    '1-3年': '1-3年投资经验',
    '3-5年': '3-5年投资经验',
    '5年以上': '5年以上投资经验'
  };
  return experienceMap[experienceText] || experienceText;
};

// 风险类型代码转换为显示文本
export const getRiskTypeText = (typeCode: number): string => {
  switch (typeCode) {
    case 0: return '稳健型';
    case 1: return '保守型';  
    case 2: return '激进型';
    default: return '未知类型';
  }
};

// 获取风险类型对应的样式类名
export const getRiskTypeBadgeClass = (typeCode: number): string => {
  switch (typeCode) {
    case 0: return 'badge-moderate';   // 稳健型
    case 1: return 'badge-conservative'; // 保守型
    case 2: return 'badge-aggressive';   // 激进型
    default: return 'badge-moderate';
  }
};