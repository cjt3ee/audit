package com.audit.customer.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Component
public class AuditLogger {
    
    private static final Logger securityLogger = LoggerFactory.getLogger("SECURITY");
    private static final Logger auditLogger = LoggerFactory.getLogger("AUDIT");
    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    
    /**
     * 记录安全事件
     */
    public static void logSecurityEvent(String event, String details, String userInfo) {
        String timestamp = LocalDateTime.now().format(formatter);
        securityLogger.info("[SECURITY] {} | {} | {} | {}", timestamp, event, userInfo, details);
    }
    
    /**
     * 记录审计事件
     */
    public static void logAuditEvent(String operation, String entityType, Long entityId, String userInfo, String details) {
        String timestamp = LocalDateTime.now().format(formatter);
        auditLogger.info("[AUDIT] {} | {} | {} | {} | {} | {}", 
            timestamp, operation, entityType, entityId, userInfo, details);
    }
    
    /**
     * 记录登录事件
     */
    public static void logLogin(String account, boolean success, String ip) {
        String event = success ? "LOGIN_SUCCESS" : "LOGIN_FAILED";
        logSecurityEvent(event, "IP: " + ip, "Account: " + account);
    }
    
    /**
     * 记录审核员操作
     */
    public static void logAuditorOperation(String operation, Long auditorId, String account, String details) {
        logAuditEvent(operation, "AUDITOR", auditorId, account, details);
    }
    
    /**
     * 记录客户操作
     */
    public static void logCustomerOperation(String operation, Long customerId, String details) {
        logAuditEvent(operation, "CUSTOMER", customerId, "SYSTEM", details);
    }
    
    /**
     * 记录数据访问
     */
    public static void logDataAccess(String dataType, Long dataId, String accessor, String operation) {
        logAuditEvent("DATA_ACCESS", dataType, dataId, accessor, operation);
    }
    
    /**
     * 记录安全违规
     */
    public static void logSecurityViolation(String violation, String userInfo, String details) {
        logSecurityEvent("SECURITY_VIOLATION", details, userInfo);
    }
}