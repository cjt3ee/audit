# Kafka 本地测试环境搭建

## 1. 安装 Kafka

### 下载 Kafka
```bash
# 下载 Kafka (包含 Zookeeper)
wget https://downloads.apache.org/kafka/2.13-3.6.0/kafka_2.13-3.6.0.tgz
tar -xzf kafka_2.13-3.6.0.tgz
cd kafka_2.13-3.6.0
```

## 2. 启动服务

### 启动 Zookeeper (第一个终端)
```bash
bin/zookeeper-server-start.sh config/zookeeper.properties
```

### 启动 Kafka Server (第二个终端) 
```bash
bin/kafka-server-start.sh config/server.properties
```

## 3. 创建 Topic

### 创建用户审核表单主题
```bash
bin/kafka-topics.sh --create --topic user_audit_form_topic --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1
```

### 查看主题列表
```bash
bin/kafka-topics.sh --list --bootstrap-server localhost:9092
```

## 4. 测试消息收发

### 启动生产者 (可选 - 用于测试)
```bash
bin/kafka-console-producer.sh --topic user_audit_form_topic --bootstrap-server localhost:9092
```

### 启动消费者 (可选 - 用于测试)
```bash
bin/kafka-console-consumer.sh --topic user_audit_form_topic --from-beginning --bootstrap-server localhost:9092
```

## 5. 环境变量配置

### 设置 DeepSeek API Key
```bash
# Linux/Mac
export DEEPSEEK_API_KEY=your_actual_deepseek_api_key

# Windows
set DEEPSEEK_API_KEY=your_actual_deepseek_api_key
```

## 6. 应用启动

### 开发环境启动命令
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

## 7. 验证流程

1. 提交用户风险问卷表单 (POST /api/customer/questionnaire)
2. 查看后台日志，确认 Kafka 消息发送成功
3. 查看消费者日志，确认消息消费和 AI 调用成功
4. 检查数据库 audit_log 表的 ai_audit 字段是否有 AI 生成的内容

## 8. 故障排查

### 检查 Kafka 连接
```bash
# 检查 Kafka 服务状态
netstat -an | grep 9092

# 查看主题详情
bin/kafka-topics.sh --describe --topic user_audit_form_topic --bootstrap-server localhost:9092
```

### 查看应用日志
- Kafka 生产者日志：搜索 "Kafka message sent"
- Kafka 消费者日志：搜索 "Processing audit form message"
- AI 调用日志：搜索 "DeepSeek API"