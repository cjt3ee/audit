package com.audit.consumer.service;

import com.audit.consumer.dto.UserAuditFormMessage;
import com.audit.consumer.entity.AuditLog;
import com.audit.consumer.repository.AuditLogRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class KafkaConsumerService {
    
    private static final Logger logger = LoggerFactory.getLogger(KafkaConsumerService.class);
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @Autowired
    private AuditLogRepository auditLogRepository;
    
    @Autowired
    private DeepSeekAiService deepSeekAiService;
    
    @KafkaListener(topics = "user_audit_form_topic", groupId = "audit-consumer-group")
    @Transactional
    public void consumeUserAuditFormMessage(
            @Payload String message,
            @Header(KafkaHeaders.RECEIVED_KEY) String key,
            Acknowledgment acknowledgment) {
        
        logger.info("=== KAFKA MESSAGE RECEIVED ===");
        logger.info("Message Key: {}", key);
        logger.info("Raw Message: {}", message);
        
        try {
            logger.info("Step 1: Parsing JSON message...");
            UserAuditFormMessage auditFormMessage = objectMapper.readValue(message, UserAuditFormMessage.class);
            Long auditLogId = auditFormMessage.getAuditLogId();
            
            logger.info("Step 2: Parsed message successfully");
            logger.info("  - AuditLogId: {}", auditLogId);
            logger.info("  - CustomerId: {}", auditFormMessage.getCustomerId());
            logger.info("  - SubmitTime: {}", auditFormMessage.getSubmitTime());
            if (auditFormMessage.getFormData() != null) {
                logger.info("  - Risk Score: {}", auditFormMessage.getFormData().getRiskScore());
                logger.info("  - Investor Type: {}", auditFormMessage.getFormData().getInvestorType());
                logger.info("  - Investment Amount: {}", auditFormMessage.getFormData().getInvestmentAmount());
            }
            
            logger.info("Step 3: Validating audit log status...");
            AuditLog auditLog = auditLogRepository.findById(auditLogId).orElse(null);
            if (auditLog == null) {
                logger.warn("❌ AuditLog not found for id: {}, ignoring message", auditLogId);
                acknowledgment.acknowledge();
                return;
            }
            
            logger.info("  - Found AuditLog: id={}, customerId={}, status={}, stage={}", 
                    auditLog.getId(), auditLog.getCustomerId(), auditLog.getStatus(), auditLog.getStage());
            
            if (auditLog.getStatus() != 5) {
                logger.warn("❌ AuditLog status is not 5 (got {}), ignoring message for auditLogId: {}", 
                        auditLog.getStatus(), auditLogId);
                acknowledgment.acknowledge();
                return;
            }
            
            logger.info("Step 4: Calling DeepSeek AI service...");
            long startTime = System.currentTimeMillis();
            String aiStrategy = deepSeekAiService.generateAuditStrategy(auditFormMessage.getFormData());
            long endTime = System.currentTimeMillis();
            
            logger.info("Step 5: AI response received in {}ms", (endTime - startTime));
            logger.info("  - AI Strategy length: {} characters", aiStrategy.length());
            logger.info("  - AI Strategy preview: {}", 
                    aiStrategy.length() > 100 ? aiStrategy.substring(0, 100) + "..." : aiStrategy);
            
            logger.info("Step 6: Updating database...");
            updateAuditLogWithAiResult(auditLog, aiStrategy);
            
            logger.info("✅ Successfully processed audit form message for auditLogId: {}", auditLogId);
            logger.info("=== MESSAGE PROCESSING COMPLETE ===");
            acknowledgment.acknowledge();
            
        } catch (Exception e) {
            logger.error("❌ ERROR processing Kafka message with key: {}", key);
            logger.error("Error details: {}", e.getMessage(), e);
            
            try {
                logger.info("Attempting error recovery...");
                UserAuditFormMessage auditFormMessage = objectMapper.readValue(message, UserAuditFormMessage.class);
                handleProcessingError(auditFormMessage.getAuditLogId(), e);
                logger.info("Error recovery completed");
            } catch (Exception parseError) {
                logger.error("❌ Failed to parse message for error handling", parseError);
            }
            
            logger.info("Message acknowledged despite error");
            acknowledgment.acknowledge();
        }
    }
    
    private void updateAuditLogWithAiResult(AuditLog auditLog, String aiStrategy) {
        logger.info("=== UPDATING DATABASE ===");
        logger.info("Updating audit log id: {} with AI strategy", auditLog.getId());
        
        int maxRetries = 2;
        int currentRetry = 0;
        
        while (currentRetry <= maxRetries) {
            try {
                logger.info("Database update attempt {}/{}", currentRetry + 1, maxRetries + 1);
                logger.info("  - Setting aiAudit field with {} characters", aiStrategy.length());
                logger.info("  - Setting status from {} to 0 (available for assignment)", auditLog.getStatus());
                
                auditLog.setAiAudit(aiStrategy);
                auditLog.setStatus(0); // 设置为可分配状态
                
                AuditLog savedLog = auditLogRepository.save(auditLog);
                
                logger.info("✅ Successfully updated audit log:");
                logger.info("  - AuditLog ID: {}", savedLog.getId());
                logger.info("  - Customer ID: {}", savedLog.getCustomerId());
                logger.info("  - New Status: {}", savedLog.getStatus());
                logger.info("  - AI Audit length: {} characters", 
                        savedLog.getAiAudit() != null ? savedLog.getAiAudit().length() : 0);
                logger.info("=== DATABASE UPDATE COMPLETE ===");
                return;
                
            } catch (Exception e) {
                currentRetry++;
                logger.warn("❌ Database update failed (attempt {}/{})", currentRetry, maxRetries + 1);
                logger.warn("Error: {}", e.getMessage());
                
                if (currentRetry > maxRetries) {
                    logger.error("❌ Failed to update audit log after {} attempts for auditLogId: {}", 
                            maxRetries + 1, auditLog.getId());
                    logger.error("Final error: ", e);
                    return;
                }
                
                try {
                    int sleepTime = 1000 * currentRetry;
                    logger.info("Waiting {}ms before retry...", sleepTime);
                    Thread.sleep(sleepTime);
                } catch (InterruptedException ie) {
                    logger.warn("Sleep interrupted, stopping retry attempts");
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }
    }
    
    private void handleProcessingError(Long auditLogId, Exception e) {
        try {
            AuditLog auditLog = auditLogRepository.findById(auditLogId).orElse(null);
            if (auditLog != null) {
                auditLog.setAiAudit("暂时繁忙，无法生成策略");
                auditLog.setStatus(0); // 设置为可分配状态
                auditLogRepository.save(auditLog);
            }
        } catch (Exception updateError) {
            logger.error("Failed to update audit log after processing error for auditLogId: {}", 
                    auditLogId, updateError);
        }
    }
}