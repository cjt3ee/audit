package com.audit.customer.service;

import com.audit.customer.dto.AuditCompletionMessage;
import com.audit.customer.entity.AuditLog;
import com.audit.customer.entity.CustomerInfo;
import com.audit.customer.entity.RiskAssessment;
import com.audit.customer.entity.RiskAssessmentResult;
import com.audit.customer.enums.RiskType;
import com.audit.customer.repository.CustomerInfoRepository;
import com.audit.customer.repository.RiskAssessmentRepository;
import com.audit.customer.repository.RiskAssessmentResultRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AuditCompletionMessageService {
    
    private static final Logger logger = LoggerFactory.getLogger(AuditCompletionMessageService.class);
    
    @Autowired
    private KafkaTemplate<String, String> kafkaTemplate;
    
    @Autowired
    private CustomerInfoRepository customerInfoRepository;
    
    @Autowired
    private RiskAssessmentRepository riskAssessmentRepository;
    
    @Autowired
    private RiskAssessmentResultRepository riskAssessmentResultRepository;
    
    @Value("${kafka.topic.audit-completion:audit-completion}")
    private String auditCompletionTopic;
    
    private final ObjectMapper objectMapper;
    private final Map<Integer, String> stageNames;
    
    public AuditCompletionMessageService() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
        
        this.stageNames = new HashMap<>();
        stageNames.put(0, "初级审核");
        stageNames.put(1, "中级审核");
        stageNames.put(2, "高级审核");
        stageNames.put(3, "投资委员会");
    }
    
    public void sendAuditCompletionMessage(AuditLog auditLog, String finalResult) {
        try {
            AuditCompletionMessage message = buildAuditCompletionMessage(auditLog, finalResult);
            String messageJson = objectMapper.writeValueAsString(message);
            
            kafkaTemplate.send(auditCompletionTopic, auditLog.getId().toString(), messageJson)
                    .whenComplete((result, failure) -> {
                        if (failure != null) {
                            logger.error("Failed to send audit completion message for audit ID: {}", 
                                       auditLog.getId(), failure);
                        } else {
                            logger.info("Audit completion message sent successfully for audit ID: {}, message ID: {}", 
                                      auditLog.getId(), message.getMessageId());
                        }
                    });
                    
        } catch (Exception e) {
            logger.error("Error creating audit completion message for audit ID: {}", auditLog.getId(), e);
        }
    }
    
    private AuditCompletionMessage buildAuditCompletionMessage(AuditLog auditLog, String finalResult) {
        AuditCompletionMessage message = new AuditCompletionMessage();
        message.setAuditId(auditLog.getId());
        message.setCustomerId(auditLog.getCustomerId());
        message.setFinalResult(finalResult);
        
        // 获取客户基本信息
        Optional<CustomerInfo> customerOpt = customerInfoRepository.findById(auditLog.getCustomerId());
        if (customerOpt.isPresent()) {
            CustomerInfo customer = customerOpt.get();
            AuditCompletionMessage.CustomerBasicInfo customerInfo = new AuditCompletionMessage.CustomerBasicInfo(
                    customer.getName(),
                    customer.getPhone(),
                    customer.getIdCard(),
                    customer.getEmail(),
                    customer.getOccupation(),
                    customer.getInvestAmount()
            );
            message.setCustomerInfo(customerInfo);
        }
        
        // 获取风险评估信息
        Optional<RiskAssessment> riskAssessmentOpt = riskAssessmentRepository
                .findByCustomerIdOrderByCreatedAtDesc(auditLog.getCustomerId());
        if (riskAssessmentOpt.isPresent()) {
            RiskAssessment risk = riskAssessmentOpt.get();
            RiskType riskType = RiskType.fromScore(risk.getScore());
            
            AuditCompletionMessage.RiskAssessmentInfo riskInfo = new AuditCompletionMessage.RiskAssessmentInfo(
                    risk.getAnnualIncome(),
                    risk.getInvestmentAmount(),
                    risk.getInvestmentExperience(),
                    risk.getMaxLoss(),
                    risk.getInvestmentTarget(),
                    risk.getInvestmentExpire(),
                    risk.getScore(),
                    riskType.getDescription()
            );
            message.setRiskAssessment(riskInfo);
        }
        
        // 获取所有审核结果
        List<RiskAssessmentResult> auditResults = riskAssessmentResultRepository
                .findByAuditIdOrderByStageAsc(auditLog.getId());
        
        List<AuditCompletionMessage.AuditStageResult> stageResults = auditResults.stream()
                .map(result -> {
                    String stageName = stageNames.getOrDefault(result.getStage(), "未知阶段");
                    // 根据意见内容判断是否通过（这里可以根据实际业务逻辑调整）
                    Boolean approved = determineApprovalFromOpinion(result.getOpinion());
                    
                    return new AuditCompletionMessage.AuditStageResult(
                            result.getStage(),
                            stageName,
                            result.getRiskScore(),
                            result.getOpinion(),
                            approved,
                            result.getCreatedAt()
                    );
                })
                .collect(Collectors.toList());
        
        message.setAuditResults(stageResults);
        
        return message;
    }
    
    private Boolean determineApprovalFromOpinion(String opinion) {
        if (opinion == null) {
            return null;
        }
        
        String lowerOpinion = opinion.toLowerCase();
        if (lowerOpinion.contains("通过") || lowerOpinion.contains("批准") || lowerOpinion.contains("同意")) {
            return true;
        } else if (lowerOpinion.contains("拒绝") || lowerOpinion.contains("不通过") || lowerOpinion.contains("驳回")) {
            return false;
        }
        
        // 如果无法从意见中判断，返回null
        return null;
    }
}