Task1 :
搭建一个java web服务，包括项目框架和基本代码以及必要package安装。路由路径为POST /api/customer/questionnaire
功能是接收用户信息和风险问卷信息。
接受用户信息需要检查是否已经存在，如果是则返回错误；如果没有则新建记录插入。
要求技术栈用java,你必须先实现我指定的功能，其他功能在后续任务中我会和你说清楚。
你不需要考虑前端，只需要实现后端。
代码必须精确、模块化、可测试。
假设mysql部署在本机某个容器上。
如果需要我做任何配置，请告诉我。



表设计如下：
CREATE TABLE customer_info (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    name VARCHAR(100) NOT NULL COMMENT '客户姓名',
    phone VARCHAR(20) NOT NULL COMMENT '手机号',
    id_card VARCHAR(20) NOT NULL COMMENT '身份证号',
    email VARCHAR(100) DEFAULT NULL COMMENT '电子邮箱',
    occupation VARCHAR(100) DEFAULT NULL COMMENT '职业',
    invest_amount DECIMAL(18,2) DEFAULT 0.00 COMMENT '计划投资金额，单位：元',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uq_customer_phone (phone),
    UNIQUE KEY uq_customer_id_card (id_card)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='客户基本信息表';

CREATE TABLE risk_assessment (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    customer_id BIGINT UNSIGNED NOT NULL COMMENT '客户ID，关联customer_info.id',
    annual_income INT NOT NULL COMMENT '年收入代码（参考字典表）',
    investment_amount DECIMAL(18,2) NOT NULL COMMENT '投资金额，单位：元',
    investment_experience VARCHAR(100) DEFAULT NULL COMMENT '投资经验说明',
    max_loss INT NOT NULL COMMENT '可承受最大亏损比例代码（参考字典表）',
    investment_target VARCHAR(100) DEFAULT NULL COMMENT '投资目标说明',
    investment_expire VARCHAR(100) DEFAULT NULL COMMENT '投资期限说明',
    score INT NOT NULL COMMENT '风险评分',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_risk_customer (customer_id),
    INDEX idx_risk_score (score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='风险评估问卷表';

Task2:
增加以下功能 客户需要获得审核结果，需要根据customer_id 查询审核状态表audit_log，只有status == 3的才有最终审核结果，其他status返回审核中的信息。如果有最终结果，从risk_assessment_result表中根据audit_id获取所有相关结果（因为多轮审核会有多个结果），组合成一个json相应给前端。
同样的，你不需要考虑前端，只需要实现后端。
代码必须精确、模块化、可测试。
相关表定义如下：

-- 审核状态表
CREATE TABLE audit_log (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT '审核流程ID',
    customer_id BIGINT UNSIGNED NOT NULL COMMENT '所属客户ID',
    status TINYINT NOT NULL COMMENT '审核状态：0未分配，1已分配未完成，2已完成， 3 终审完成，最终结果可查',
    stage TINYINT NOT NULL COMMENT '审核阶段：0初级，1中级，2高级，3委员会',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_audit_customer (customer_id),
    INDEX idx_audit_status_stage (status, stage)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='审核状态表';


-- 审核结果记录表（只增加）
CREATE TABLE risk_assessment_result (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT '审核记录ID',
    audit_id BIGINT UNSIGNED NOT NULL COMMENT '关联audit_log.id',
    stage TINYINT NOT NULL COMMENT '审核阶段：0初级，1中级，2高级，3委员会',
    customer_id BIGINT UNSIGNED NOT NULL COMMENT '客户ID，关联customer_info.id',
    risk_score INT NOT NULL COMMENT '风险评分',
    opinion TEXT NOT NULL COMMENT '审核意见',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_result_audit (audit_id),
    INDEX idx_result_customer (customer_id),
    INDEX idx_result_stage (stage)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='审核结果记录表';