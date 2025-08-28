# Audit Consumer Service

独立的Kafka消费者服务，负责处理用户审核表单消息并调用AI大模型生成审核策略。

## 功能
- 消费Kafka主题 `user_audit_form_topic` 的消息
- 调用DeepSeek AI API生成审核策略
- 更新audit_log表的ai_audit字段

## 启动步骤

### 1. 配置DeepSeek API Key
编辑 `src/main/java/com/audit/consumer/service/DeepSeekAiService.java`
```java
private String apiKey = "sk-your-actual-deepseek-api-key-here";
```

### 2. 确保Kafka正在运行
```bash
# 启动Zookeeper
bin/zookeeper-server-start.sh config/zookeeper.properties

# 启动Kafka
bin/kafka-server-start.sh config/server.properties

# 创建主题
bin/kafka-topics.sh --create --topic user_audit_form_topic --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1
```

### 3. 启动Consumer服务
```bash
# 方法1: 使用脚本
./start-consumer.bat

# 方法2: 直接使用Maven
cd C:\D\proj\audit\consumer
mvn spring-boot:run
```

## 端口
- Consumer服务端口: 8081
- 后端服务端口: 8443

## 验证
1. 启动Consumer服务 (端口8081)
2. 启动后端服务 (端口8443) 
3. 提交用户问卷表单
4. 查看Consumer日志确认消息消费
5. 检查数据库audit_log表的ai_audit字段

## 日志监控
Consumer服务的关键日志：
- `Received Kafka message with key: X`
- `Processing audit form message for auditLogId: X`
- `DeepSeek AI response received`
- `Successfully updated audit log with AI strategy`