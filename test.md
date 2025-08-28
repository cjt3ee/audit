地测试指南 🚀

  1. 后端启动和访问

  后端端口配置:
  - HTTPS端口: 8443 (主要端口)
  - HTTP端口: 8080 (自动重定向到HTTPS)

  启动后端:
  cd C:\D\proj\audit
  mvn spring-boot:run

  后端访问地址:
  - 主要访问: https://localhost:8443
  - HTTP重定向: http://localhost:8080 → 自动跳转到 https://localhost:8443

  SSL证书警告处理:
  1. 浏览器会显示"不安全连接"警告
  2. 点击"高级" → "继续访问localhost(不安全)"
  3. 这是正常的，因为我们使用的是自签名证书

  2. 前端启动和访问

  启动前端:
  cd C:\D\proj\audit\frontend
  npm run dev

  前端访问地址:
  - 主页面: http://localhost:3000
  - 审核员登录: http://localhost:3000/auditor-login

  3. 完整测试流程

  3.1 启动服务

  # 终端1: 启动后端
  cd C:\D\proj\audit
  mvn spring-boot:run

  # 终端2: 启动前端
  cd C:\D\proj\audit\frontend
  npm run dev

  3.2 测试页面访问路径

  客户端页面:
  - 客户问卷填写: http://localhost:3000
  - 审核结果查询: http://localhost:3000 (填写完问卷后自动切换tab)

  审核员页面:
  - 审核员登录: http://localhost:3000/auditor-login
  - 初级审核员: http://localhost:3000/junior-audit (需要先登录)
  - 中级审核员: http://localhost:3000/intermediate-audit
  - 高级审核员: http://localhost:3000/senior-audit
  - 投资委员会: http://localhost:3000/committee-audit

  4. 测试账号创建

  注册审核员账号:
  1. 访问: http://localhost:3000/auditor-login
  2. 点击"没有账号？点击注册"
  3. 填写注册信息:
    - 账号: 自定义 (如: admin001)
    - 密码: 至少8位 (如: password123)
    - 审核级别: 选择0-3 (0=初级, 1=中级, 2=高级, 3=投资委员会)

  5. 测试数据流程

  5.1 完整业务流程测试:

  1. 客户填写问卷 (localhost:3000)
     ↓
  2. 注册审核员 (localhost:3000/auditor-login)
     ↓
  3. 审核员登录并审核 (对应级别页面)
     ↓
  4. 客户查看审核结果 (localhost:3000 审核结果tab)

  5.2 安全功能测试:

  - HTTPS重定向: 访问 http://localhost:8080 看是否自动跳转HTTPS
  - Token加密: 登录后查看浏览器Developer Tools中的token是否加密
  - 敏感数据保护: 查看Network面板，确认敏感参数在POST body中
  - 输入验证: 尝试输入非法格式的手机号、身份证号测试验证

  6. 常见问题处理

  问题1: 后端启动失败
  # 检查MySQL连接
  # 确保application.yml中的数据库配置正确

  问题2: HTTPS证书警告
  - 这是正常的，点击"继续访问"即可
  - 生产环境需要使用正式CA证书

  问题3: 前后端通信失败
  # 检查前端代理配置
  # 确保proxy.ts中的BACKEND_URL指向 https://localhost:8443

  问题4: 审核员登录后跳转错误
  - 检查localStorage中的auditorInfo
  - 确认level字段对应正确的页面路径

  7. 开发调试

  查看日志:
  # 后端日志会显示在启动终端
  # 包含安全事件和审计日志

  # 前端开发者工具:
  # F12 → Console 查看前端日志
  # F12 → Network 查看API请求

  数据库检查:
  -- 查看审核员表
  SELECT * FROM auditor;

  -- 查看客户信息表
  SELECT * FROM customer_info;

  -- 查看审核日志表
  SELECT * FROM audit_log;