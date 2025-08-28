import { NextPageContext } from 'next';

interface ErrorProps {
  statusCode?: number;
  hasGetInitialPropsRun?: boolean;
  err?: Error;
}

function ErrorPage({ statusCode, hasGetInitialPropsRun, err }: ErrorProps) {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>
        {statusCode
          ? `服务器错误 ${statusCode}`
          : '客户端错误'}
      </h1>
      <p>
        {statusCode === 404
          ? '页面未找到'
          : '发生了一个错误，请稍后重试'}
      </p>
      {err && (
        <details style={{ marginTop: '20px', textAlign: 'left' }}>
          <summary>错误详情</summary>
          <pre>{err.message}</pre>
        </details>
      )}
      <button 
        onClick={() => window.location.reload()} 
        style={{ 
          marginTop: '20px', 
          padding: '10px 20px', 
          backgroundColor: '#0070f3', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px', 
          cursor: 'pointer' 
        }}
      >
        刷新页面
      </button>
    </div>
  );
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default ErrorPage;