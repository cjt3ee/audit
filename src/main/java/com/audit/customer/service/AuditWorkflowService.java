package com.audit.customer.service;

import com.audit.customer.dto.AuditResultSubmissionRequest;
import com.audit.customer.dto.AuditResultSubmissionResponse;
import com.audit.customer.entity.AuditLog;
import com.audit.customer.entity.RiskAssessment;
import com.audit.customer.entity.RiskAssessmentResult;
import com.audit.customer.enums.RiskType;
import com.audit.customer.repository.AuditLogRepository;
import com.audit.customer.repository.RiskAssessmentRepository;
import com.audit.customer.repository.RiskAssessmentResultRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class AuditWorkflowService {
    
    @Autowired
    private AuditLogRepository auditLogRepository;
    
    @Autowired
    private RiskAssessmentRepository riskAssessmentRepository;
    
    @Autowired
    private RiskAssessmentResultRepository riskAssessmentResultRepository;
    
    @Autowired
    private AuditCompletionMessageService auditCompletionMessageService;
    
    @Transactional
    public AuditResultSubmissionResponse processAuditResult(AuditResultSubmissionRequest request) {
        // 1. 验证审核流程是否存在且状态正确
        Optional<AuditLog> auditLogOpt = auditLogRepository.findById(request.getAuditId());
        if (!auditLogOpt.isPresent()) {
            throw new IllegalArgumentException("审核流程不存在: " + request.getAuditId());
        }
        
        AuditLog auditLog = auditLogOpt.get();
        
        // 验证审核流程状态
        if (auditLog.getStatus() != 1) {
            throw new IllegalStateException("审核流程状态不正确，当前状态: " + auditLog.getStatus());
        }
        
        // 验证审核员等级是否匹配
        if (!auditLog.getStage().equals(request.getAuditorLevel())) {
            throw new IllegalArgumentException("审核员等级与当前审核阶段不匹配");
        }
        
        // 2. 获取客户风险评估信息
        Optional<RiskAssessment> riskAssessmentOpt = riskAssessmentRepository
                .findByCustomerIdOrderByCreatedAtDesc(auditLog.getCustomerId());
        if (!riskAssessmentOpt.isPresent()) {
            throw new IllegalStateException("未找到客户风险评估信息");
        }
        
        RiskAssessment riskAssessment = riskAssessmentOpt.get();
        RiskType customerRiskType = RiskType.fromScore(riskAssessment.getScore());
        
        // 3. 保存审核结果
        RiskAssessmentResult result = new RiskAssessmentResult();
        result.setAuditId(request.getAuditId());
        result.setStage(request.getAuditorLevel());
        result.setCustomerId(auditLog.getCustomerId());
        result.setRiskScore(request.getRiskScore());
        result.setOpinion(request.getOpinion());
        riskAssessmentResultRepository.save(result);
        
        // 4. 处理工作流逻辑
        WorkflowDecision decision = determineWorkflowDecision(
                request.getApproved(), 
                request.getAuditorLevel(), 
                customerRiskType
        );
        
        // 5. 更新审核流程状态
        updateAuditLogStatus(auditLog, decision);
        
        // 6. 如果是最终审核结果，发送消息到Kafka
        if (decision.isCompleted()) {
            String finalResult = determineFinalResult(request.getApproved(), decision.getMessage());
            auditCompletionMessageService.sendAuditCompletionMessage(auditLog, finalResult);
        }
        
        // 7. 构建响应
        return buildResponse(auditLog, decision);
    }
    
    private WorkflowDecision determineWorkflowDecision(Boolean approved, Integer auditorLevel, RiskType riskType) {
        // 如果审核被拒绝，直接结束流程
        if (!approved) {
            return new WorkflowDecision(3, null, true, "审核被拒绝，流程结束");
        }
        
        // 根据审核员等级和客户风险类型决定下一步
        switch (auditorLevel) {
            case 0: // 初级审核员
                return handleJuniorAuditorDecision(riskType);
                
            case 1: // 中级审核员
                return handleIntermediateAuditorDecision(riskType);
                
            case 2: // 高级审核员
                return handleSeniorAuditorDecision(riskType);
                
            case 3: // 投资委员会
                return new WorkflowDecision(3, null, true, "投资委员会审核完成，流程结束");
                
            default:
                throw new IllegalArgumentException("无效的审核员等级: " + auditorLevel);
        }
    }
    
    private WorkflowDecision handleJuniorAuditorDecision(RiskType riskType) {
        // 初级审核员：所有类型都转给中级
        return new WorkflowDecision(0, 1, false, "初级审核通过，转交中级审核员");
    }
    
    private WorkflowDecision handleIntermediateAuditorDecision(RiskType riskType) {
        switch (riskType) {
            case CONSERVATIVE: // 保守型客户，中级审核员可以做最终决定
                return new WorkflowDecision(3, null, true, "中级审核员审核完成，保守型客户流程结束");
            case BALANCED:
            case AGGRESSIVE: // 稳健型和激进型转给高级
                return new WorkflowDecision(0, 2, false, "中级审核通过，转交高级审核员");
            default:
                throw new IllegalStateException("未知的风险类型: " + riskType);
        }
    }
    
    private WorkflowDecision handleSeniorAuditorDecision(RiskType riskType) {
        switch (riskType) {
            case BALANCED: // 稳健型客户，高级审核员可以做最终决定
                return new WorkflowDecision(3, null, true, "高级审核员审核完成，稳健型客户流程结束");
            case AGGRESSIVE: // 激进型转给投资委员会
                return new WorkflowDecision(0, 3, false, "高级审核通过，激进型客户转交投资委员会");
            default:
                throw new IllegalStateException("高级审核员不应处理保守型客户");
        }
    }
    
    private void updateAuditLogStatus(AuditLog auditLog, WorkflowDecision decision) {
        auditLog.setStatus(decision.getStatus());
        if (decision.getNextStage() != null) {
            auditLog.setStage(decision.getNextStage());
        }
        auditLogRepository.save(auditLog);
    }
    
    private AuditResultSubmissionResponse buildResponse(AuditLog auditLog, WorkflowDecision decision) {
        return new AuditResultSubmissionResponse(
                auditLog.getId(),
                auditLog.getCustomerId(),
                decision.isCompleted() ? "completed" : "forwarded",
                decision.getMessage(),
                decision.getNextStage(),
                decision.isCompleted()
        );
    }
    
    private String determineFinalResult(Boolean approved, String message) {
        if (!approved) {
            return "REJECTED";
        }
        
        // 根据消息内容判断最终结果类型
        if (message.contains("流程结束")) {
            return "APPROVED";
        }
        
        return "APPROVED";
    }
    
    private static class WorkflowDecision {
        private final Integer status;
        private final Integer nextStage;
        private final boolean completed;
        private final String message;
        
        public WorkflowDecision(Integer status, Integer nextStage, boolean completed, String message) {
            this.status = status;
            this.nextStage = nextStage;
            this.completed = completed;
            this.message = message;
        }
        
        public Integer getStatus() {
            return status;
        }
        
        public Integer getNextStage() {
            return nextStage;
        }
        
        public boolean isCompleted() {
            return completed;
        }
        
        public String getMessage() {
            return message;
        }
    }
}