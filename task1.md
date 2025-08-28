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


Task3:
增加以下功能：在submitQuestionnaire处理过程中，如果一切校验通过，则向audit_log表新增一条记录,表示该客户进入审核流程。
初始审核阶段为0初级，审核状态为为分配。你只需要实现这个功能。代码必须精确、模块化、可测试。注意每个customer只能有一条audit_log记录，表示该客户处在审核流的哪个状态。一个客户只能开启一个审核流程。如果有新增依赖，请修改pom文件。







Task4:
增加以下功能，并设计审核员前端路径（GET 任务）
审核员有四个等级，对应审核状态的四个阶段（audit_log 中的 stage 阶段）：0初级，1中级，2高级，3委员会
根据（risk_assessment表中的score）将客户分为保守型，稳健型，激进型。
目前只需要根据前端给的审核员等级判断给哪个流程中的任务。

审核员GET任务：路径应该是 GET
逻辑如下：
不同级别审核员只能获取对应审核等级的任务，扫描audit_log，根据stage和status筛选。
获取对应等级（初级审核员只能接取初级审核阶段的任务，中级审核员只能接取中级审核阶段的任务，以此类推）
且status 为 0未分配 的任务，同时任务状态修改为 1已分配未完成。
注意获取且修改可能需要保证原子，因为可能有多个审核员同时接取。
注意审核员接取返回一批任务，这批任务数量设置一个最大值。

不需要生成单测。你只需要实现这个功能。代码必须精确、模块化、可测试。如果有新增依赖，请修改pom文件。



Task5:
审核员POST结果，先设计路由路径。 POST 任务结果
处理逻辑如下。
1. 新增审核结果到risk_assessment_result。
2. 看审核员是否通过，
如果审核员结果为拒绝，则audit_log中对应的审核流程id的 status = 3，直接结束审核流程。
3. 如果审核通过，则根据审核员等级和客户风险类型判断下一步操作。
   3.1 如果审核员为初级
        3.1.1 如果客户为保守类型，流转给中级审核员审核。更新audit_log中对应的审核流程id的 status = 0，stage = 1
        3.1.2 如果客户为稳健类型，流程转给中级。更新audit_log中对应的审核流程id的 status = 0，stage = 1
        3.1.3 如果客户为激进类型，流程转给中级。更新audit_log中对应的审核流程id的 status = 0，stage = 1。
    3.2 如果审核员为中级
        3.2.1 如果客户为保守类型，得出最终审核结果，audit_log中对应的审核流程id的 status = 3，直接结束审核流程。
        3.2.2 否则，流转给高级。更新audit_log中对应的审核流程id的 status = 0，stage = 2.
    3.3 如果审核员为高级
        3.3.1 如果客户为稳健型。得出最终审核结果，audit_log中对应的审核流程id的 status = 3，直接结束审核流程。
        3.3.2 如果客户为激进型，流程转给投资委员会。更新audit_log中对应的审核流程id的 status = 0，stage = 3。
    3.4 如果审核员为投资委员会，则得出最终审核结果，audit_log中对应的审核流程id的 status = 3，直接结束审核流程。

你需要设计前端POST哪些所需数据。采用合适的设计模式。代码必须精确、模块化、可测试。如果有新增依赖，请修改pom文件。
不用生成测试文件。


Task6:
GET /api/customer/audit-status里面的逻辑需要修改。
修改成以下逻辑：
增加以下功能 客户需要获得审核结果，需要根据customer_id 查询审核状态表audit_log，只有status == 3的才有最终审核结果，其他status返回审核中的信息。如果有最终结果，从risk_assessment_result表中根据audit_id获取所有相关结果（因为多轮审核会有多个结果）。
获取最后一个审核结果里面的"riskScore"。根据最终riskScore返回用户所属的风险类别。
同样的，你不需要考虑前端，只需要实现后端。
代码必须精确、模块化、可测试。

response应该长这样：


{
    "success": true,
    "message": "查询成功",
    "data": {
        "customerId": 4,
        "status": "completed",
        "message": "审核已完成",
        "results": [
            "tpye" : 0 // 0 : 稳健 1：保守 2.
        ]
    }
}

Task7:
根据以下要求生成前端页面，要求用react next.js技术栈生成前端。要求对接C:\D\proj\audit\src\main\java\com\audit\customer\controller\CustomerQuestionnaireController.java
里面定义的接口。实现用户提交信息和回显的前端。
要求遵守frontend\demo\for_customer.html的页面风格和打分逻辑。

Task8:
根据以下要求生成前端页面，要求用react next.js技术栈生成前端。要求对接。暂时不考虑审核员登录。C:\D\proj\audit\src\main\java\com\audit\customer\controller\AuditorController.java
里面定义的接口。实现审核员拉取任务和提交结果。
要求遵守frontend\demo\for_auditor.html的页面风格和打分逻辑。


Task8:
根据以下要求为审核员添加身份注册，登录和鉴定。
你需要先设计后端审核员身份表的结构。包括（审核员id,审核员等级，审核员账号，审核员密码）。不需要存储其他审核员的个人信息。
1. 先设计后端审核员注册和登录的路由以及实现（从路由注册到写数据库）。要求：审核员注册只需要简单提交账号，密码，等级即可注册（账号不能重复）。

#### （1）身份鉴权流程
- 输入：前端传递的username（账号）、password（明文密码）；
- 鉴权逻辑：① 先查询auditors表，判断username是否存在且status=1（正常）；② 若存在，通过BCrypt工具类比对输入的明文密码与数据库中加密的password是否匹配；③ 若匹配则鉴权通过，否则按场景返回错误（连续3次密码错误则将status设为0，锁定1小时）；
- 错误响应：① 账号不存在→401 + "账号不存在"；② 密码错误→401 + "密码错误"；③ 账号禁用/锁定→403 + "账号已禁用/锁定，请联系管理员"。

#### （2）JWT token生成
- 生成规则：① 基于JWT协议生成token，密钥从配置文件读取（区分环境）；② token过期时间设为2小时；③ payload中必须携带字段：auditorId（数据库id）、username、stage（审核级别）；
- 返回格式：鉴权通过后，后端返回JSON：{"code":200,"message":"鉴权成功","data":{"token":"Bearer xxxxxxxx","auditorInfo":{"auditorId":1,"username":"audit123","stage":1}}}。

#### （3）审核界面跳转与任务查询
- 跳转逻辑：前后端分离架构，后端不负责页面跳转，由前端接收token后，根据token中的stage跳转对应界面：stage=1→/junior-audit，stage=2→/intermediate-audit，stage=3→/senior-audit；
- 任务查询：① 前端查询审核任务时，需在请求头Authorization字段携带token（格式：Bearer xxxxxxxx）；② 后端通过拦截器验证token有效性（是否过期、是否篡改），验证通过后，按“auditors.stage = 审核任务表.task_stage”且“任务状态=待处理（task_status=0）”的条件查询任务，返回给前端；③ 若token无效/过期，返回401 + "请重新登录"。

### （4）. 约束条件
- 权限控制：审核员仅能查询和处理与自身stage一致的待处理任务，无法跨级别访问（如stage=1不能查询stage=2的任务）；
- 时效性：审核员stage或status变更后，旧token立即失效，需重新登录生成新token（后端查询任务时需实时从auditors表获取当前stage/status，不依赖token缓存值）。

2. 审核员提交账号密码登录，后端需要返回对应等级以及登录信息等等。
3. 修改前端生成审核员的登录界面。
4. 添加不同等级审核员对应的前端审核界面，实现审核员登录成功后跳转到对应级别审核页面。要求遵循之前初级审核员的页面风格。
代码必须精确、模块化。不需要生成单测。

Task9:
根据以下安全要求，加强信息安全。修改前后端代码，但是要确保本地（localhost）可测试：
1. 用国密算法进行加密审核员登录token 
2. 前后端通讯采用https进行通讯。（注意，我们没有合法证书，本地测试也没证书，希望能在本地测试。如果无法完成，这个可以跳过。）
3. 敏感数据不能暴露在url中。
4. 其他安全性修复。
代码必须精确、模块化。不需要生成单测。
你提升完安全性后，总结采用了哪些措施和技术。



Task 10:
你需要创建一个consumer,必要时修改pom以更新依赖。创建子文件夹。

0. 为Audit Log表新增字段 aiAudit 类型为text 可选,用于存储AI生成的信息。

1. 生产者：用户表单提交与 Kafka 消息发送
触发时机：用户提交风险问卷表单并完成基础校验（信息完整、格式正确）后；
Kafka 配置：
主题名称：user_audit_form_topic（单一主题，简化消息路由）；
消息结构（JSON）：包含auditLogId（关联 audit_log.id，必填）、customerId（customer_id）、formData（表单核心数据：如风险评分、投资者类型、问卷答案摘要，用户基本信息（除了名字，身份证等敏感信息））、submitTime（提交时间戳）；
状态控制：消息发送成功后，audit_log表的status改为5（不可分配）；
异常处理：
消息发送失败时，重试 3 次（间隔 2s），仍失败则记录错误日志（含auditLogId和失败原因），并标记audit_log的ai_audit为 “消息发送失败，待重试”（便于后续人工介入）,此时audit_log的status改为0(可分配)；
确保消息仅发送一次（避免重复处理），通过表单提交的幂等性校验（如基于customerId+ 提交时间戳去重）。

2. 消费者：Kafka 消息处理与 AI 大模型API Key调用
消费逻辑：消费者监听user_audit_form_topic，接收到消息后按以下步骤处理：
参数准备：从消息中提取auditLogId和formData，验证audit_log中对应记录的status是否为 0（未分配），若已非 0 则忽略（避免重复处理）；
AI 大模型调用： 大模型的调用采用的deepseek
接口文档参考：
调用 API
DeepSeek API 使用与 OpenAI 兼容的 API 格式，通过修改配置，您可以使用 OpenAI SDK 来访问 DeepSeek API，或使用与 OpenAI API 兼容的软件。
PARAM	VALUE
base_url *       	https://api.deepseek.com
api_key	apply for an API key
* 出于与 OpenAI 兼容考虑，您也可以将 base_url 设置为 https://api.deepseek.com/v1 来使用，但注意，此处 v1 与模型版本无关。

* deepseek-chat 和 deepseek-reasoner 都已经升级为 DeepSeek-V3.1。deepseek-chat 对应 DeepSeek-V3.1 的非思考模式，deepseek-reasoner 对应 DeepSeek-V3.1 的思考模式.

调用对话 API
在创建 API key 之后，你可以使用以下样例脚本的来访问 DeepSeek API。样例为非流式输出，您可以将 stream 设置为 true 来使用流式输出。

curl
python
nodejs
curl https://api.deepseek.com/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <DeepSeek API Key>" \
  -d '{
        "model": "deepseek-chat",
        "messages": [
          {"role": "system", "content": "You are a helpful assistant."},
          {"role": "user", "content": "Hello!"}
        ],
        "stream": false
      }'
调用方式：通过HTTPS 协议调用外部 AI 接口，传递formData中的必要字段（如风险评分、投资者类型、计划投资金额）；
超时控制：设置连接超时和读取超时均为5s（超过则判定为超时）；
结果处理与数据库更新：
若超时（>5s）或调用异常（如 HTTPS 握手失败、接口返回 5xx/4xx 错误）：设置ai_audit = "暂时繁忙，无法生成策略"；同时修改audit log 的status更改为0。
若调用成功：设置ai_audit = AI返回的审核策略内容（如 “建议初级审核重点关注风险评分复核”），同时修改audit log 的status更改为0；若更新失败，重试 2 次（确保最终状态一致）。

注意 你需要设置kafka的参数，kafka在本地部署测试。
代码必须精确、模块化。不需要生成单测。

task11:
在客户进行审核结果查询时，服务端返回如下结果。
{
    "success": true,
    "message": "查询成功",
    "data": {
        "customerId": 79,
        "status": "completed",
        "message": "审核已完成",
        "results": [
            {
                "stage": 2,
                "riskScore": 90,
                "opinion": "审核完成",
                "createdAt": "2025-08-28T14:31:22.6919102"
            }
        ]
    }
}
但是前端显示未知类型。修改前端代码，根据风险分给出投资类型，给用户显示正确的风险分类：
    ("保守型", 0, 40),
    ("稳健型", 41, 70),
    ("激进型", 71, 100);


Task12:
我在task10中生成AI审核建议，共提供审核员参考。
现在，前端拉取审核任务的时候需要同时把audit_log中ai_audit字段的AI推荐意见回显在所有级别审核人员的审核页面上。
等审核员点击开始审核是，把AI提供的建议显示给审核员。
为此，你需要
1. 修改后端把ai_audit传递到前端
2. 前端显示AI意见。
代码必须精确、模块化。不需要生成单测。

Task13:
详细表单信息 包括风险评估问卷的内容。审核员点击 展开详情时，应该显示该客户之前提交的风险评估表的各项信息。
为此，你需要
1. 修改后端把风险评估表信息传递到前端。（在获取审核任务时）
2. 修改前端详细表单信息的显示，需要包括风险评估表的信息。
代码必须精确、模块化。不需要生成单测。

Task14:
前端的最大亏损承受显示有点小问题，不要显示代码1，要显示代码对应的亏损承受。
只修改前端代码
对应规则如下：
1:5%以内
2:5%以内
3:5-15%
4:30%以上


Task15:
根据以下步骤修改代码
0. 针对controller中releaseAuditTask方法，需要删除前后端逻辑，避免把status的值从1改为0；删除前端调用和后端releaseAuditTask函数
1. 需要在auditor_log表中新插入一个字段audit_id，记录该审核任务对应审核人员id；同样的需要在risk_assessment_result中新增对应的auditor_id字段。
2. 在审核员提交结果时，把审核员id存入risk_assessment_result中。
3. 当审核员领取审核任务的时候，
   当该审核员成功抢占到任务时，除了修改status,还要把审核员id存放在audit_log的auditor_id字段中。
   返回审核员新抢占和已抢占未完成的任务（注意需要核对stage和审核员身份）

4. 新增审核员历史审核记录接口。
   该接口实现 查询 risk_assessment_result，返回该审核人员审核记录历史详情。

5. 然后前端需要根据审核员历史审核记录传递的信息，新加一栏。显示已经审核的任务信息。已审核任务提供查看详情按钮。

Task16:
修改一下审核员已审核任务的前端回显，不需要显示结果。只需要显示riskScore，opinion，createdAt三个内容

修改一下src\main\java\com\audit\customer\controller\AuditorController.java的@GetMapping("/history/{auditorId}")
添加一个回传字段，后端需要把audit_id传递给前端，同时前端显示审核流程ID:{audit_id}