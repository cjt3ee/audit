'use client'
import { useState, useEffect } from 'react';
import { Shield, Users, Target } from 'lucide-react';
import { useRouter } from 'next/navigation';
// import { useCallback } from 'react';
import Link from 'next/link'

import Head from 'next/head';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBank,
  faUserCircle,
  faUserPlus,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons';

export default function HomePage() {
  const [isNavScrolled, setIsNavScrolled] = useState(false);
  const router = useRouter();
  // 监听滚动事件，用于导航栏样式变化
  useEffect(() => {
    const handleScroll = () => {
      setIsNavScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 按钮点击处理函数
  const handleCustomerClick = () => {
    console.log('客户入口点击 - 当前时间:', new Date().toLocaleString());
    console.log('用户类型: 客户');
    console.log('页面跳转: #customer');
  };

  const handleAuditorClick = () => {
    console.log('审核入口点击 - 当前时间:', new Date().toLocaleString());
    console.log('用户类型: 审核员');
    console.log('页面跳转: #auditor');
  };

  const handleLoginClick = () => {
    console.log('登录按钮点击 - 当前时间:', new Date().toLocaleString());
    console.log('操作: 用户登录');
    console.log('登录状态: 未登录 -> 准备登录');
    // router.prefetch('/login');
    // router.replace('/login', { scroll: false });

  };

  const handleStartEvaluationClick = () => {
    console.log('开始评估按钮点击 - 当前时间:', new Date().toLocaleString());
    console.log('操作类型: 风险评估');
    console.log('用户流程: 开始 -> 客户信息填写');
    console.log('预期耗时: 10-15分钟');
  };


  // const router = useRouter();

  // 方法1: 使用 router.push (推荐)
  const handleLearnProcessClick = () => {
      console.log('了解流程按钮点击 - 当前时间:', new Date().toLocaleString());
      console.log('操作类型: 查看流程说明');
      console.log('页面跳转: #process');
      console.log('内容类型: 帮助文档');
    // router.prefetch('/process');
    router.replace('/process', { scroll: false });

  };
  return (
      <>
        <Head>
          <title>银行投资风险审核系统</title>
          <meta name="description" content="智能投资风险评估与审核系统" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <div className="bg-gray-50 font-sans text-gray-800 min-h-screen">
          {/* 导航栏 */}
          <nav className={`fixed w-full top-0 z-50 transition-all duration-300 ${
              isNavScrolled ? 'bg-white/95 backdrop-blur-sm shadow-lg' : 'bg-white shadow-sm'
          }`}>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <a href="#" className="flex items-center group">
                    <FontAwesomeIcon
                        icon={faBank}
                        className="text-blue-600 text-2xl mr-2 group-hover:text-blue-700 transition-colors"
                    />
                    <span className="text-xl font-semibold text-blue-600 group-hover:text-blue-700 transition-colors">
                    智慧投资风险审核系统
                  </span>
                  </a>
                </div>

                <div className="flex items-center space-x-4">
                  <button
                      onClick={handleCustomerClick}
                      className="text-gray-600 hover:text-blue-600 transition-colors px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-50"
                  >
                    客户入口
                  </button>

                  <button
                      onClick={handleAuditorClick}
                      className="text-gray-600 hover:text-blue-600 transition-colors px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-50"
                  >
                    审核入口
                  </button>

                  <Link href="/login"
                      onClick={handleLoginClick}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5 hover:bg-blue-700 flex items-center"
                  >
                    <FontAwesomeIcon icon={faUserCircle} className="mr-1" />
                    登录
                  </Link>
                </div>
              </div>
            </div>
          </nav>

          {/* 英雄区域 */}
          <section className="pt-28 pb-16 bg-gradient-to-br from-blue-50 to-cyan-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row items-center">
                <div className="md:w-1/2 mb-10 md:mb-0">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 leading-tight mb-4">
                    智能投资风险<br />
                    <span className="text-blue-600">评估与审核</span>
                  </h1>

                  <p className="text-lg text-gray-600 mb-8 max-w-lg leading-relaxed">
                    基于客户信息和风险偏好，提供智能化的投资风险评估和审核服务，
                    生成个性化投资建议，通过多级审核确保准确性。
                  </p>

                  <div className="flex flex-wrap gap-4">
                    <Link href={'/estimate'}
                        onClick={handleStartEvaluationClick}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5 hover:bg-blue-700 flex items-center font-medium"
                    >
                      <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
                      开始评估
                    </Link>

                    <button
                        onClick={handleLearnProcessClick}
                        className="bg-white text-blue-600 border-2 border-blue-600 px-6 py-3 rounded-lg transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5 hover:bg-blue-600 hover:text-white flex items-center font-medium"
                    >
                      <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
                      了解流程
                    </button>
                  </div>
                </div>

                <div className="md:w-1/2">
                  <div className="relative">
                    <img
                        src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                        alt="投资风险评估系统示意图"
                        className="rounded-xl shadow-2xl w-full h-auto transform hover:scale-105 transition-transform duration-300"
                    />
                    {/* 装饰性元素 */}
                    <div className="absolute -top-4 -left-4 w-24 h-24 bg-blue-600/10 rounded-full"></div>
                    <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-cyan-600/10 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 特色功能区域 */}
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                  核心功能特色
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  我们的系统提供全方位的投资风险评估服务，确保每一个投资决策都经过专业审核
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    icon: Shield,
                    title: "智能风险评估",
                    color:"red",
                    description: "基于大数据分析，精准评估投资风险等级"
                  },
                  {
                    icon: Users,
                    title: "多级审核机制",
                    color:"blue",
                    description: "专业审核团队，确保评估结果的准确性和可靠性"
                  },
                  {
                    icon: Target,
                    title: "个性化建议",
                    color: "green",
                    description: "根据客户风险偏好，提供量身定制的投资建议"
                  }
                ].map((feature, index) => (
                    <div key={index} className="bg-gray-50 p-6 rounded-xl hover:shadow-lg transition-shadow duration-300">
                      {/*<div className="text-4xl mb-4">feature.icon</div>*/}
                      <feature.icon color={feature.color}  size={48} />
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">{feature.title}</h3>
                      <p className="text-gray-600">{feature.description}</p>
                    </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </>
  );
}

