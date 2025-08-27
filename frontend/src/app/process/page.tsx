import React from 'react';
import {Shield, Scale, TrendingUp, ArrowLeft} from 'lucide-react';
// import { useRouter} from 'next/navigation';
import Link from 'next/link'
const InvestmentProcessPage = () => {
    // const router = useRouter();

    // 跳转函数
    // const handleBackClick = () => {
    //     router.replace('/');
    //     // router.push('/'); // 跳转到首页，你可以修改为需要的路径
    // };
    const processes = [
        {
            title: "保守型投资者",
            icon: <Shield className="w-6 h-6 text-green-600" />,
            bgColor: "bg-green-50",
            iconBg: "bg-green-100",
            checkColor: "text-green-600",
            steps: [
                "客户信息收集与自动核实",
                "系统风险评估与分类",
                "低风险投资建议生成",
                "初级审核员审核",
                "中级审核员复核",
                "结果通知客户"
            ]
        },
        {
            title: "稳健型投资者",
            icon: <Scale className="w-6 h-6 text-orange-600" />,
            bgColor: "bg-orange-50",
            iconBg: "bg-orange-100",
            checkColor: "text-orange-600",
            steps: [
                "客户信息收集与核实",
                "系统风险评估与分类",
                "平衡型投资建议生成",
                "初级审核员审核",
                "中级审核员详细分析",
                "高级审核员复核（大额）",
                "结果通知客户"
            ]
        },
        {
            title: "激进型投资者",
            icon: <TrendingUp className="w-6 h-6 text-red-600" />,
            bgColor: "bg-red-50",
            iconBg: "bg-red-100",
            checkColor: "text-red-600",
            steps: [
                "客户信息收集与核实",
                "系统风险评估与分类",
                "高风险投资建议生成",
                "初级审核员审核",
                "中级审核员分析",
                "高级审核员深度评估",
                "投资委员会审批",
                "结果通知客户"
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b border-gray-200">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <Link href="/" className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
                        >
                        <ArrowLeft className="w-4 h-4 mr-2"/>
                        返回首页
                        </Link>
                </div>
            </div>
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    {/* 标题区域 */}
                    <div className="text-center mb-16">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-gray-900">
                            投资风险审核流程
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto text-lg">
                            根据客户风险偏好，系统将自动分配不同的审核流程，确保投资建议的合理性和安全性
                        </p>
                    </div>

                    {/* 流程卡片 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {processes.map((process, index) => (
                            <div
                                key={index}
                                className={`${process.bgColor} rounded-xl p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105`}
                            >
                                {/* 图标区域 */}
                                <div
                                    className={`w-14 h-14 ${process.iconBg} rounded-full flex items-center justify-center mb-6`}>
                                    {process.icon}
                                </div>

                                {/* 标题 */}
                                <h3 className="text-xl font-semibold mb-6 text-gray-900">{process.title}</h3>

                                {/* 步骤列表 */}
                                <ul className="space-y-3">
                                    {process.steps.map((step, stepIndex) => (
                                        <li key={stepIndex} className="flex items-start">
                                            <div
                                                className={`mt-1 mr-3 w-4 h-4 rounded-full ${process.checkColor} flex-shrink-0 flex items-center justify-center`}>
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd"
                                                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                          clipRule="evenodd"/>
                                                </svg>
                                            </div>
                                            <span className="text-gray-700">{step}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    {/* 底部说明 */}
                    <div className="mt-16 text-center">
                        <div className="bg-blue-50 rounded-lg p-6 max-w-4xl mx-auto">
                            <h4 className="text-lg font-semibold text-blue-900 mb-3">审核说明</h4>
                            <p className="text-blue-800">
                                所有投资建议都需要经过严格的多级审核，确保符合客户的风险承受能力。
                                高风险投资需要更多层级的审核和专业委员会的最终批准。
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default InvestmentProcessPage;
