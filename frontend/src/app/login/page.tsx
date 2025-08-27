'use client';
import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/router';
import axios, { AxiosError } from 'axios';
import Cookies from 'js-cookie';
import { useForm, SubmitHandler } from 'react-hook-form';
import Link from 'next/link';

// 定义表单数据类型
interface LoginFormData {
    email: string;
    password: string;
}

// 定义用户信息类型
interface User {
    id: string;
    email: string;
    name?: string;
    // 根据实际用户数据结构添加其他字段
}

// 定义API响应类型
interface LoginResponse {
    token: string;
    user: User;
}

// 定义错误响应类型
interface ErrorResponse {
    message: string;
}

const LoginPage: React.FC = () => {
    // const router = useRouter();
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<LoginFormData>();

    // 检查是否已登录
    // useEffect(() => {
    //     const token: string | undefined = Cookies.get('auth-token');
    //     if (token) {
    //         // router.push('/');
    //     }
    // }, [router]);

    const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
        setLoading(true);
        setError('');

        try {
            const response = await axios.post<LoginResponse>('/api/auth/login', {
                email: data.email,
                password: data.password
            });

            const { token, user } = response.data;

            // 存储JWT令牌到cookie (7天过期)
            Cookies.set('auth-token', token, {
                expires: 7,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            });

            // 存储用户信息到localStorage
            localStorage.setItem('user', JSON.stringify(user));

            // 跳转到仪表板
            // router.push('/dashboard');

        } catch (err) {
            const axiosError = err as AxiosError<ErrorResponse>;
            setError(
                axiosError.response?.data?.message || '登录失败，请检查邮箱和密码'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        登录到您的账户
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        使用邮箱和密码登录
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    <div className="rounded-md shadow-sm space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                邮箱地址
                            </label>
                            <input
                                {...register('email', {
                                    required: '邮箱地址是必填项',
                                    pattern: {
                                        value: /^\S+@\S+$/i,
                                        message: '请输入有效的邮箱地址'
                                    }
                                })}
                                type="email"
                                autoComplete="email"
                                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="请输入邮箱地址"
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                密码
                            </label>
                            <input
                                {...register('password', {
                                    required: '密码是必填项',
                                    minLength: {
                                        value: 6,
                                        message: '密码至少需要6个字符'
                                    }
                                })}
                                type="password"
                                autoComplete="current-password"
                                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="请输入密码"
                            />
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                            <div className="flex">
                                <div className="ml-3">
                                    <p className="text-sm">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                            {loading ? (
                                <div className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    登录中...
                                </div>
                            ) : (
                                '登录'
                            )}
                        </button>
                    </div>

                    <div className="text-sm text-center">
                        <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                            还没有账户？立即注册
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
