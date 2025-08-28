package com.audit.customer.service;

import com.audit.customer.dto.UserAuditFormMessage;
import com.audit.customer.entity.AuditLog;
import com.audit.customer.repository.AuditLogRepository;
import com.audit.customer.util.AuditLogger;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

@Service
public class KafkaProducerService {
    
    private static final Logger logger = LoggerFactory.getLogger(KafkaProducerService.class);
    private static final String TOPIC_NAME = "user_audit_form_topic";
    
    @Autowired
    private KafkaTemplate<String, String> kafkaTemplate;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @Autowired
    private AuditLogRepository auditLogRepository;
    
    public void sendUserAuditFormMessage(UserAuditFormMessage message) {
        try {
            String jsonMessage = objectMapper.writeValueAsString(message);
            logger.info("Preparing to send Kafka message for auditLogId: {}", message.getAuditLogId());
            
            CompletableFuture<SendResult<String, String>> future = kafkaTemplate.send(TOPIC_NAME, 
                    message.getAuditLogId().toString(), jsonMessage);
            
            future.whenComplete((result, throwable) -> {
                if (throwable == null) {
                    handleMessageSendSuccess(message.getAuditLogId());
                    logger.info("Kafka message sent successfully for auditLogId: {}", message.getAuditLogId());
                } else {
                    handleMessageSendFailure(message.getAuditLogId(), throwable);
                    logger.error("Failed to send Kafka message for auditLogId: {}", 
                            message.getAuditLogId(), throwable);
                }
            });
            
        } catch (Exception e) {
            logger.error("Error preparing Kafka message for auditLogId: {}", 
                    message.getAuditLogId(), e);
            handleMessageSendFailure(message.getAuditLogId(), e);
        }
    }
    
    private void handleMessageSendSuccess(Long auditLogId) {
        try {
            AuditLog auditLog = auditLogRepository.findById(auditLogId).orElse(null);
            if (auditLog != null) {
                auditLog.setStatus(5); // 不可分配状态
                auditLogRepository.save(auditLog);
                AuditLogger.logSecurityEvent("KAFKA_MESSAGE_SENT", "Message sent successfully", 
                        "AuditLogId: " + auditLogId);
            }
        } catch (Exception e) {
            logger.error("Failed to update audit log status after successful message send for auditLogId: {}", 
                    auditLogId, e);
        }
    }
    
    private void handleMessageSendFailure(Long auditLogId, Throwable throwable) {
        try {
            AuditLog auditLog = auditLogRepository.findById(auditLogId).orElse(null);
            if (auditLog != null) {
                auditLog.setStatus(0); // 可分配状态
                auditLog.setAiAudit("消息发送失败，待重试");
                auditLogRepository.save(auditLog);
                
                AuditLogger.logSecurityEvent("KAFKA_MESSAGE_FAILED", 
                        "Message send failed: " + throwable.getMessage(), 
                        "AuditLogId: " + auditLogId);
            }
        } catch (Exception e) {
            logger.error("Failed to update audit log after message send failure for auditLogId: {}", 
                    auditLogId, e);
        }
    }
}