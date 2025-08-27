'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { customerAPI } from '../lib/api';

// 定义表单数据类型
interface QuestionnaireFormData {
  name: string;
  phone: string;
  idCard: string;
  email?: string;
  occupation?: string;
  investAmount: string;
  annualIncome: string;
  investmentAmount: string;
  investmentExperience?: string;
  maxLoss: string;
  investmentTarget?: string;
  investmentExpire?: string;
  score: string;
}

// 定义提交结果类型
interface SubmitResult {
  type: 'success' | 'error';
  message: string;
  customerId?: number;
}

export default function CustomerQuestionnaire() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<QuestionnaireFormData>();

  const onSubmit = async (formData: QuestionnaireFormData) => {
    setIsSubmitting(true);
    setSubmitResult(null);
    
    try {
      // 构造符合后端 API 格式的数据
      const requestData = {
        customerInfo: {
          name: formData.name,
          phone: formData.phone,
          idCard: formData.idCard,
          email: formData.email || undefined, // 使用 undefined 而不是 null
          occupation: formData.occupation || undefined,
          investAmount: formData.investAmount ? parseFloat(formData.investAmount) : 0
        },
        riskAssessment: {
          annualIncome: parseInt(formData.annualIncome),
          investmentAmount: parseFloat(formData.investmentAmount),
          investmentExperience: formData.investmentExperience || undefined,
          maxLoss: parseInt(formData.maxLoss),
          investmentTarget: formData.investmentTarget || undefined,
          investmentExpire: formData.investmentExpire || undefined,
          score: parseInt(formData.score)
        }
      };

      const response = await customerAPI.submitQuestionnaire(requestData);
      
      if (response.data.success) {
        setSubmitResult({
          type: 'success',
          message: `问卷提交成功！客户ID: ${response.data.data}`,
          customerId: response.data.data
        });
        reset(); // 清空表单
      } else {
        setSubmitResult({
          type: 'error',
          message: response.data.message || '提交失败'
        });
      }
    } catch (error: any) {
      console.error('提交问卷失败:', error);
      setSubmitResult({
        type: 'error',
        message: error.response?.data?.message || '网络错误，请稍后重试'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
        客户问卷调查
      </h1>

      {/* 结果提示 */}
      {submitResult && (
        <div className={`mb-6 p-4 rounded-lg ${
          submitResult.type === 'success' 
            ? 'bg-green-100 border border-green-400 text-green-700'
            : 'bg-red-100 border border-red-400 text-red-700'
        }`}>
          <p className="font-medium">{submitResult.message}</p>
          {submitResult.customerId && (
            <p className="text-sm mt-2">
              您可以使用客户ID查询审核状态
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* 客户基本信息 */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">基本信息</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                姓名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('name', { 
                  required: '姓名不能为空',
                  maxLength: { value: 100, message: '姓名长度不能超过100字符' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入姓名"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                手机号 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                {...register('phone', { 
                  required: '手机号不能为空',
                  pattern: { value: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入手机号"
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                身份证号 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('idCard', { 
                  required: '身份证号不能为空',
                  pattern: { value: /^\d{18}$/, message: '请输入有效的18位身份证号' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入身份证号"
              />
              {errors.idCard && <p className="text-red-500 text-sm mt-1">{errors.idCard.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                邮箱
              </label>
              <input
                type="email"
                {...register('email', { 
                  pattern: { value: /^\S+@\S+\.\S+$/, message: '请输入有效的邮箱地址' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入邮箱"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                职业
              </label>
              <input
                type="text"
                {...register('occupation')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入职业"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                投资金额 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                {...register('investAmount', { 
                  required: '投资金额不能为空',
                  min: { value: 0, message: '投资金额不能为负数' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入投资金额"
              />
              {errors.investAmount && <p className="text-red-500 text-sm mt-1">{errors.investAmount.message}</p>}
            </div>
          </div>
        </div>

        {/* 风险评估信息 */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">风险评估</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                年收入（万元）<span className="text-red-500">*</span>
              </label>
              <select
                {...register('annualIncome', { required: '请选择年收入范围' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">请选择</option>
                <option value="100000">10万以下</option>
                <option value="200000">10-20万</option>
                <option value="500000">20-50万</option>
                <option value="1000000">50-100万</option>
                <option value="2000000">100万以上</option>
              </select>
              {errors.annualIncome && <p className="text-red-500 text-sm mt-1">{errors.annualIncome.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                投资金额 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                {...register('investmentAmount', { 
                  required: '投资金额不能为空',
                  min: { value: 0, message: '投资金额不能为负数' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入投资金额"
              />
              {errors.investmentAmount && <p className="text-red-500 text-sm mt-1">{errors.investmentAmount.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                投资经验
              </label>
              <select
                {...register('investmentExperience')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">请选择</option>
                <option value="无经验">无经验</option>
                <option value="1年以下">1年以下</option>
                <option value="1-3年">1-3年</option>
                <option value="3-5年">3-5年</option>
                <option value="5年以上">5年以上</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                可承受最大亏损比例 <span className="text-red-500">*</span>
              </label>
              <select
                {...register('maxLoss', { required: '请选择可承受的最大亏损比例' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">请选择</option>
                <option value="5">5%以下</option>
                <option value="10">5%-10%</option>
                <option value="20">10%-20%</option>
                <option value="30">20%-30%</option>
                <option value="50">30%以上</option>
              </select>
              {errors.maxLoss && <p className="text-red-500 text-sm mt-1">{errors.maxLoss.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                投资目标
              </label>
              <input
                type="text"
                {...register('investmentTarget')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="如：稳健增长、资产增值等"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                投资期限
              </label>
              <select
                {...register('investmentExpire')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">请选择</option>
                <option value="1年以下">1年以下</option>
                <option value="1-3年">1-3年</option>
                <option value="3-5年">3-5年</option>
                <option value="5年以上">5年以上</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                风险评分 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                max="100"
                {...register('score', { 
                  required: '风险评分不能为空',
                  min: { value: 0, message: '风险评分不能小于0' },
                  max: { value: 100, message: '风险评分不能大于100' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入风险评分（0-100）"
              />
              {errors.score && <p className="text-red-500 text-sm mt-1">{errors.score.message}</p>}
            </div>
          </div>
        </div>

        {/* 提交按钮 */}
        <div className="text-center">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-8 py-3 text-white font-medium rounded-lg transition-colors ${
              isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }`}
          >
            {isSubmitting ? '提交中...' : '提交问卷'}
          </button>
        </div>
      </form>
    </div>
  );
}
