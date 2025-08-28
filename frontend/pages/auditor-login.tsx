import React, { useState } from 'react';
import { useRouter } from 'next/router';

interface LoginForm {
  account: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    auditorId: number;
    account: string;
    level: number;
    levelName: string;
  };
}

const AuditorLoginPage: React.FC = () => {
  const [form, setForm] = useState<LoginForm>({ account: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [registerForm, setRegisterForm] = useState({ account: '', password: '', level: 0 });
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!form.account.trim() || !form.password.trim()) {
      setError('请输入账号和密码');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: '/api/auditor/login',
          method: 'POST',
          data: form
        })
      });

      const result: LoginResponse = await response.json();
      
      if (result.success && result.data) {
        // 保存登录信息到 localStorage
        localStorage.setItem('auditorInfo', JSON.stringify(result.data));
        
        // 根据等级跳转到对应页面
        const level = result.data.level;
        let redirectPath = '/auditor';
        
        switch (level) {
          case 0:
            redirectPath = '/junior-audit';
            break;
          case 1:
            redirectPath = '/intermediate-audit';
            break;
          case 2:
            redirectPath = '/senior-audit';
            break;
          case 3:
            redirectPath = '/committee-audit';
            break;
          default:
            redirectPath = '/auditor';
        }
        
        alert(`登录成功！欢迎，${result.data.levelName}`);
        router.push(redirectPath);
      } else {
        setError(result.message || '登录失败');
      }
    } catch (error) {
      console.error('登录请求失败:', error);
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!registerForm.account.trim() || !registerForm.password.trim()) {
      setError('请输入账号和密码');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: '/api/auditor/register',
          method: 'POST',
          data: registerForm
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert('注册成功！请使用新账号登录');
        setShowRegister(false);
        setForm({ account: registerForm.account, password: '' });
        setRegisterForm({ account: '', password: '', level: 0 });
      } else {
        setError(result.message || '注册失败');
      }
    } catch (error) {
      console.error('注册请求失败:', error);
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const levelOptions = [
    { value: 0, label: '初级审核员' },
    { value: 1, label: '中级审核员' },
    { value: 2, label: '高级审核员' },
    { value: 3, label: '投资委员会' }
  ];

  return (
    <div style={{ 
      fontFamily: 'Microsoft YaHei, Arial, sans-serif', 
      backgroundColor: '#f5f5f5', 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* 背景装饰 */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        opacity: 0.1,
        zIndex: -1
      }} />

      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '40px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px',
        margin: '20px'
      }}>
        {/* 头部 */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{
            fontSize: '28px',
            color: '#333',
            marginBottom: '8px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            银行审核系统
          </h1>
          <p style={{ color: '#666', fontSize: '16px' }}>
            {showRegister ? '审核员注册' : '审核员登录'}
          </p>
        </div>

        {/* 错误提示 */}
        {error && (
          <div style={{
            background: '#ffebee',
            color: '#c62828',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '20px',
            border: '1px solid #ffcdd2',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {!showRegister ? (
          // 登录表单
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: 'bold',
                color: '#333'
              }}>
                账号
              </label>
              <input
                type="text"
                value={form.account}
                onChange={(e) => setForm(prev => ({ ...prev, account: e.target.value }))}
                placeholder="请输入审核员账号"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  transition: 'border-color 0.3s',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              />
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: 'bold',
                color: '#333'
              }}>
                密码
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                placeholder="请输入密码"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  transition: 'border-color 0.3s',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                border: 'none',
                borderRadius: '6px',
                background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s',
                marginBottom: '20px'
              }}
            >
              {loading ? '登录中...' : '登录'}
            </button>

            <div style={{ textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => setShowRegister(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#667eea',
                  fontSize: '14px',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                没有账号？点击注册
              </button>
            </div>
          </form>
        ) : (
          // 注册表单
          <form onSubmit={handleRegister}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: 'bold',
                color: '#333'
              }}>
                账号
              </label>
              <input
                type="text"
                value={registerForm.account}
                onChange={(e) => setRegisterForm(prev => ({ ...prev, account: e.target.value }))}
                placeholder="请输入审核员账号"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  transition: 'border-color 0.3s',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: 'bold',
                color: '#333'
              }}>
                密码
              </label>
              <input
                type="password"
                value={registerForm.password}
                onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                placeholder="请输入密码"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  transition: 'border-color 0.3s',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              />
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: 'bold',
                color: '#333'
              }}>
                审核级别
              </label>
              <select
                value={registerForm.level}
                onChange={(e) => setRegisterForm(prev => ({ ...prev, level: parseInt(e.target.value) }))}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  transition: 'border-color 0.3s',
                  outline: 'none',
                  backgroundColor: 'white'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              >
                {levelOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                border: 'none',
                borderRadius: '6px',
                background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s',
                marginBottom: '20px'
              }}
            >
              {loading ? '注册中...' : '注册'}
            </button>

            <div style={{ textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => setShowRegister(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#667eea',
                  fontSize: '14px',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                已有账号？返回登录
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuditorLoginPage;