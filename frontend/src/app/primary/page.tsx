'use client'
import React, {  useState, useEffect } from 'react';

// 定义任务类型
interface Task {
    id: number;
    name: string;
    riskType: string;
    amount: string;
    submissionTime: string;
    status: string;
}



const Auditor: React.FC = () => {
    // 初始待审核任务数据
    const [tasks, setTasks] = useState<Task[]>([
        { id: 1, name: '张三', riskType: '保守型', amount: '50,000元', submissionTime: '2025-08-20 09:30', status: '待初级审核' },
        { id: 2, name: '李四', riskType: '稳健型', amount: '200,000元', submissionTime: '2025-08-19 14:20', status: '待中级审核' },
        { id: 3, name: '王五', riskType: '激进型', amount: '1,000,000元', submissionTime: '2025-08-18 16:45', status: '待高级审核' },
    ]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // useEffect(() => {
    //     const fetchTasks = async () => {
    //         setLoading(true);
    //         try {
    //             const response = await fetch('YOUR_API_ENDPOINT'); // 替换为你的 API 端点
    //             if (!response.ok) {
    //                 throw new Error('网络响应不正常');
    //             }
    //             const data: Task[] = await response.json();
    //             setTasks(data);
    //         } catch (error) {
    //             setError(error.message);
    //         } finally {
    //             setLoading(false);
    //         }
    //     };
    //
    //     fetchTasks();
    // }, []);

    // if (loading) {
    //     return <div>加载中...</div>;
    // }
    //
    // if (error) {
    //     return <div>错误: {error}</div>;
    // }



    // 完成审核后的任务
    const [completedTasks, setCompletedTasks] = useState<Task[]>([]);

    // 处理审核操作
    const handleReview = (id: number) => {
        // 查找当前任务
        const taskToReview = tasks.find(task => task.id === id);
        console.log('taskToReview', taskToReview);
        if (taskToReview) {
            // 将审核的任务移到完成列表
            setCompletedTasks([...completedTasks, taskToReview]);
            // 从待审核列表中移除
            setTasks(tasks.filter(task => task.id !== id));
        }
    }

    return (
        <section id="auditor" className="py-16 bg-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-[clamp(1.5rem,3vw,2.5rem)] font-bold mb-4">审核员工作台</h2>
                    <p className="text-neutral max-w-2xl mx-auto">审核员可以在这里查看待审核任务，进行审核操作并记录审核意见</p>
                </div>

                <div className="max-w-6xl mx-auto">
                    <div className="bg-light rounded-xl shadow overflow-hidden">
                        <div className="p-6 border-b">
                            <h3 className="text-xl font-semibold">待审核任务</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">客户姓名</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">风险类型</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">投资金额</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">提交时间</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">当前状态</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {tasks.map(task => (
                                    <tr key={task.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{task.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-success/10 text-success">{task.riskType}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.amount}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.submissionTime}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-warning/10 text-warning">{task.status}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button className="review-btn text-primary hover:text-primary/80" onClick={() => handleReview(task.id)}>审核</button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 审核完成任务列表 */}
                    <div className="bg-light rounded-xl shadow overflow-hidden mt-6">
                        <div className="p-6 border-b">
                            <h3 className="text-xl font-semibold">审核完成任务</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">客户姓名</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">风险类型</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">投资金额</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">提交时间</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">审核状态</th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {completedTasks.map(task => (
                                    <tr key={task.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{task.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-success/10 text-success">{task.riskType}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.amount}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.submissionTime}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-success/10 text-success">审核完成</span>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default Auditor;
