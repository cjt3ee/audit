'use client';

import React, { useState } from 'react';

interface FormData {
    name: string;
    phone: string;
    idCard: string;
    age: string;
    occupation: string;
    education: string;
    income: string;
    assets:string;
    investmentexperience:string;
    investmentamount: string;
    risktolerance:string;
    investmentterm:string;
    investmentgoal:string;
    lossresponse:string;


}

function calculateCheckCode(idCard17: string): string {
    // 权重因子
    const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
    // 校验码对应表
    const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];

    let sum = 0;
    for (let i = 0; i < 17; i++) {
        sum += parseInt(idCard17[i]) * weights[i];
    }

    return checkCodes[sum % 11];
}

// 方法1: 基础的中国手机号校验
function isValidChinesePhone(phone: string): boolean {
    // 中国手机号格式：1开头，第二位是3-9，总共11位数字
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
}

// 方法2: 更严格的中国手机号校验（包含具体运营商）
function isValidChinesePhoneStrict(phone: string): boolean {
    // 移动：134-139, 147, 150-152, 157-159, 178, 182-184, 187-188, 195, 198
    // 联通：130-132, 145, 155-156, 166, 175-176, 185-186, 196
    // 电信：133, 149, 153, 173-174, 177, 180-181, 189, 191, 193, 199
    const phoneRegex = /^1(3[0-9]|4[5679]|5[0-35-9]|6[6]|7[3-8]|8[0-9]|9[1356789])\d{8}$/;
    return phoneRegex.test(phone);
}

// 方法3: 包含国际格式的手机号校验
function isValidPhone(phone: string, country: 'CN' | 'US' | 'INTL' = 'CN'): boolean {
    switch (country) {
        case 'CN':
            return /^1[3-9]\d{9}$/.test(phone);
        case 'US':
            return /^[2-9]\d{2}[2-9]\d{2}\d{4}$/.test(phone);
        case 'INTL':
            // 国际格式：+开头，后面跟1-3位国家码，然后是4-14位数字
            return /^\+\d{1,3}\d{4,14}$/.test(phone);
        default:
            return false;
    }
}

// 方法4: 更完善的校验函数（包含错误信息）
interface PhoneValidationResult {
    isValid: boolean;
    error?: string;
}

function validatePhone(phone: string): PhoneValidationResult {
    // 基础检查
    if (!phone) {
        return { isValid: false, error: '手机号不能为空' };
    }

    if (typeof phone !== 'string') {
        return { isValid: false, error: '手机号必须是字符串类型' };
    }

    // 去除空格和特殊字符
    const cleanPhone = phone.replace(/[\s-()]/g, '');

    // 长度检查
    if (cleanPhone.length !== 11) {
        return { isValid: false, error: '手机号必须是11位数字' };
    }

    // 格式检查
    if (!/^\d{11}$/.test(cleanPhone)) {
        return { isValid: false, error: '手机号只能包含数字' };
    }

    // 中国手机号格式检查
    if (!/^1[3-9]\d{9}$/.test(cleanPhone)) {
        return { isValid: false, error: '手机号格式不正确' };
    }

    return { isValid: true };
}







const CustomerForm: React.FC = () => {
    const [activeStep, setActiveStep] = useState<number>(1);
    const [formData, setFormData] = useState<FormData>({
        name: '',
        phone: '',
        idCard: '',
        age: '',
        occupation: '',
        education: '',
        income: '',
        assets:'',
        investmentexperience:'',
        risktolerance:'',
        investmentterm:'',
        investmentgoal:'',
        lossresponse:'',
        investmentamount: '',
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: value
        }));
    };

    const handleStepClick = (step: number) => {
        setActiveStep(step);
    };

    const stepButtons = [
        { step: 1, icon: 'fa fa-user', label: '基本信息' },
        { step: 2, icon: 'fa fa-money', label: '财务状况' },
        { step: 3, icon: 'fa fa-question-circle', label: '风险问卷' }
    ];

    const submit=()=>{
        if(formData.name===null){
            alert('姓名是必须的，请您填写姓名')
            console.log('姓名错误')
            return;
        }
        const result = validatePhone(formData.phone);
        if (!result.isValid) {
            // 处理校验失败的情况
            alert(result.error)
            console.log('手机号非法')
            return;
        }
        if(formData.idCard[17]!==calculateCheckCode(formData.idCard)){
            // 处理校验失败的情况
            alert('身份证号错误，请您重试')
            console.log('身份证不合法')
            return;
        }

        // 转换为数字
        const numericAmount = parseFloat(formData.investmentamount);

        // NaN检查
        if (isNaN(numericAmount)) {
            // return { isValid: false, error: '投资金额必须是有效数字' };
            alert('投资金额必须是有效数字')
            return;
        }

        // 无穷大检查
        if (!isFinite(numericAmount)) {
            // return { isValid: false, error: '投资金额数值超出有效范围' };
            alert('投资金额数值超出有效范围')
            return;

        }

        // 负数检查
        if (numericAmount < 0) {
            // return { isValid: false, error: '投资金额不能为负数' };
            alert('投资金额不能为负数')
            return;
        }

        // 零值检查
        if (numericAmount === 0 ) {
            // return { isValid: false, error: '投资金额必须大于0' };
            alert('投资金额必须大于0')
            return;
        }

        alert('提交成功')


        console.log('提交表单', formData)

    };
    return (
        <section id="customer-form" className="py-16 bg-gray-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-[clamp(1.5rem,3vw,2.5rem)] font-bold mb-4">
                        客户信息与风险评估
                    </h2>
                    <p className="text-neutral max-w-2xl mx-auto">
                        请填写您的基本信息并完成风险评估问卷，我们将为您提供个性化的投资建议
                    </p>
                </div>

                <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
                    {/* 表单步骤导航 */}
                    <div className="border-b">
                        <div className="flex">
                            {stepButtons.map(({ step, icon, label }) => (
                                <button
                                    key={step}
                                    className={`px-6 py-4 font-medium ${
                                        activeStep === step
                                            ? 'text-primary border-b-2 border-primary'
                                            : 'text-neutral'
                                    }`}
                                    onClick={() => handleStepClick(step)}
                                >
                                    <i className={`${icon} mr-2`}></i>
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 步骤1：基本信息 */}
                    {activeStep === 1 && (
                        <div className="p-6 md:p-8">
                            <h3 className="text-xl font-semibold mb-6">基本信息</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                        htmlFor="name"
                                    >
                                        姓名*
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                        placeholder="请输入您的姓名"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required/>
                                </div>

                                <div>
                                    <label
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                        htmlFor="phone"
                                    >
                                        手机号码*
                                    </label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                        placeholder="请输入您的手机号码"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        required />
                                </div>

                                <div>
                                    <label
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                        htmlFor="idCard"
                                    >
                                        身份证号*
                                    </label>
                                    <input
                                        type="text"
                                        id="idCard"
                                        className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                        placeholder="请输入您的身份证号"
                                        value={formData.idCard}
                                        onChange={handleInputChange}
                                        required />
                                </div>

                                <div>
                                    <label
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                        htmlFor="age"
                                    >
                                        年龄
                                    </label>
                                    <input
                                        type="number"
                                        id="age"
                                        className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                        placeholder="请输入您的年龄"
                                        value={formData.age}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div>
                                    <label
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                        htmlFor="occupation"
                                    >
                                        职业
                                    </label>
                                    <select
                                        id="occupation"
                                        className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                        value={formData.occupation}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">请选择您的职业</option>
                                        <option value="employee">企业员工</option>
                                        <option value="manager">企业管理</option>
                                        <option value="professional">专业人士</option>
                                        <option value="student">学生</option>
                                        <option value="retired">退休</option>
                                        <option value="other">其他</option>
                                    </select>
                                </div>

                                <div>
                                    <label
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                        htmlFor="education"
                                    >
                                        教育程度
                                    </label>
                                    <select
                                        id="education"
                                        className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                        value={formData.education}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">请选择您的教育程度</option>
                                        <option value="high-school">高中及以下</option>
                                        <option value="college">专科</option>
                                        <option value="bachelor">本科</option>
                                        <option value="master">硕士</option>
                                        <option value="doctor">博士</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mt-8 justify-between flex justify-end">

                                <button
                                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                                    onClick={() => handleStepClick(2)}
                                >
                                    下一步
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 步骤2：财务状况 */}
                    {activeStep === 2 && (
                        <div className="p-6 md:p-8">
                            <h3 className="text-xl font-semibold mb-6">财务状况</h3>
                            <div>
                                <label
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                    htmlFor="income"
                                >
                                    年收入水平
                                </label>
                                <select
                                    id="income"
                                    className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                    value={formData.income}
                                    onChange={handleInputChange}
                                >
                                    <option value="">请选择您的年收入</option>
                                    <option value="10">10万元以下</option>
                                    <option value="20">10-30万元以下</option>
                                    <option value="40">30万-50万元</option>
                                    <option value="75">50万-100万元</option>
                                    <option value="100">100万元以上</option>

                                </select>
                            </div>

                            <div>
                                <label
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                    htmlFor="occupation"
                                >
                                    总资产规模
                                </label>
                                <select
                                    id="assets"
                                    className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                    value={formData.assets}
                                    onChange={handleInputChange}
                                >
                                    <option value="">请选择您的总资产规模</option>
                                    <option value="0-50">50万元以下</option>
                                    <option value="50-100">50-100万元</option>
                                    <option value="100-500">100-500万元</option>
                                    <option value="500-1000">500-1000万元</option>
                                    <option value="1000+">1000万元以上</option>

                                </select>
                            </div>


                            <div>
                                <label
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                    htmlFor="investmentexperience"
                                >
                                    投资经验
                                </label>
                                <select
                                    id="investmentexperience"
                                    className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                    value={formData.investmentexperience}
                                    onChange={handleInputChange}
                                >
                                    <option value="">请选择您的投资经验</option>
                                    <option value="none">无经验</option>
                                    <option value="basic">基础（1-3年）</option>
                                    <option value="intermediate">中级（3-5年）</option>
                                    <option value="advanced">高级（5年以上）</option>
                                </select>
                            </div>

                            <div>
                                <label
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                    htmlFor="investmentamount"
                                >
                                    计划投资金额*
                                </label>
                                <input
                                    type="number"
                                    id="investmentamount"
                                    className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="请输入您计划投资的金额（万元）"
                                    value={formData.investmentamount}
                                    onChange={handleInputChange}
                                    required/>
                            </div>



                            <div className="mt-8 flex justify-between">
                                <button
                                    className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                                    onClick={() => handleStepClick(1)}
                                >
                                    上一步
                                </button>
                                <button
                                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                                    onClick={() => handleStepClick(3)}
                                >
                                    下一步
                                </button>
                            </div>


                        </div>
                    )}

                    {/* 步骤3：风险问卷 */}
                    {activeStep === 3 && (
                        <div className="p-6 md:p-8">
                            <h3 className="text-xl font-semibold mb-6">风险问卷</h3>
                            <div className="text-center text-gray-500">
                                <div>
                                    <label
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                        htmlFor="risktolerance"
                                    >
                                        计划投资金额
                                    </label>
                                    <select
                                        id="risktolerance"
                                        className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                        value={formData.risktolerance}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">请选择您的投资经验</option>
                                        <option value="none">无经验</option>
                                        <option value="basic">基础（1-3年）</option>
                                        <option value="intermediate">中级（3-5年）</option>
                                        <option value="advanced">高级（5年以上）</option>
                                    </select>
                                </div>
                            </div>

                            <div className="text-center text-gray-500">
                                <div>
                                    <label
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                        htmlFor="investmentterm"
                                    >
                                        您的投资期限是多久？
                                    </label>
                                    <select
                                        id="investmentterm"
                                        className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                        value={formData.investmentterm}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">请选择您的投资期限</option>
                                        <option value="none">6个月以内</option>
                                        <option value="basic">6个月到1年</option>
                                        <option value="intermediate">1到3年</option>
                                        <option value="advanced">3到5年</option>
                                        <option value="advanced">5年以上</option>

                                    </select>
                                </div>
                            </div>
                            <div className="text-center text-gray-500">
                                <div>
                                    <label
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                        htmlFor="investmentgoal"
                                    >
                                        您的投资目标是什么？
                                    </label>
                                    <select
                                        id="investmentgoal"
                                        className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                        value={formData.investmentgoal}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">请选择您的投资目标是什么？</option>
                                        <option value="none">保证本金安全，获取稳定收益</option>
                                        <option value="basic">平衡风险与收益，稳健增长</option>
                                        <option value="intermediate">追求较高收益，可接受一定风险</option>
                                        <option value="advanced">追求高收益，能够承受高风险</option>

                                    </select>
                                </div>




                            </div>


                            <div>
                                <label
                                    className="block text-sm font-medium text-gray-700 mb-1 text-center"
                                    htmlFor="lossresponse"
                                >   如果您的投资组合在一个月内亏损了20%，您会怎么做？
                                </label>
                                <select
                                    id="lossresponse"
                                    className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                    value={formData.lossresponse}
                                    onChange={handleInputChange}
                                >
                                    <option value="">立即卖出所有投资，避免进一步损失</option>
                                    <option value="none">卖出一部分，降低风险</option>
                                    <option value="basic">平衡风险与收益，稳健增长</option>
                                    <option value="intermediate">不采取行动，等待市场反弹</option>
                                    <option value="advanced">加仓，认为这是一个买入机会</option>

                                </select>
                            </div>


                            <div className="mt-8 flex justify-between">
                                <button
                                    className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                                    onClick={() => handleStepClick(2)}
                                >
                                    上一步
                                </button>
                                <button
                                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                                    onClick={() =>submit()}
                                >
                                    提交
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default CustomerForm;
