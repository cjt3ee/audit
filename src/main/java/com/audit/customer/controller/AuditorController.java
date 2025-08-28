package com.audit.customer.controller;

import com.audit.customer.dto.ApiResponse;
import com.audit.customer.dto.AuditResultDto;
import com.audit.customer.dto.AuditResultSubmissionRequest;
import com.audit.customer.dto.AuditResultSubmissionResponse;
import com.audit.customer.dto.AuditTaskResponse;
import com.audit.customer.dto.AuditorLoginRequest;
import com.audit.customer.dto.AuditorLoginResponse;
import com.audit.customer.dto.AuditorRegistrationRequest;
import com.audit.customer.service.AuditTaskService;
import com.audit.customer.service.AuditWorkflowService;
import com.audit.customer.service.AuditorAuthService;

import java.util.ArrayList;
import java.util.List;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auditor")
public class AuditorController {

    private static final Logger logger = LoggerFactory.getLogger(AuditorController.class);

    @Autowired
    private AuditTaskService auditTaskService;
    
    @Autowired
    private AuditWorkflowService auditWorkflowService;
    
    @Autowired
    private AuditorAuthService auditorAuthService;

    @PostMapping("/tasks") // 改为POST，避免敏感参数在URL中暴露
    public ResponseEntity<ApiResponse<AuditTaskResponse>> getAuditTasks(@RequestBody Map<String, Integer> request) {
        Integer level = request.get("level");
        try {
            AuditTaskResponse response = auditTaskService.assignTasksToAuditor(level);
            logger.info("Audit tasks assigned to auditor level {}: {} tasks", level, response.getTaskCount());
            return ResponseEntity.ok(ApiResponse.success("任务获取成功", response));
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid auditor level: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error getting audit tasks for auditor level: {}", level, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("服务器内部错误"));
        }
    }
    
    @GetMapping("/tasks/new")
    public ResponseEntity<ApiResponse<AuditTaskResponse>> getNewAuditTasks(
            @RequestParam Integer level,
            @RequestParam(required = false) String excludeIds) {
        try {
            // 解析排除的任务ID列表
            List<Long> excludeTaskIds = new ArrayList<>();
            if (excludeIds != null && !excludeIds.trim().isEmpty()) {
                String[] idArray = excludeIds.split(",");
                for (String id : idArray) {
                    try {
                        excludeTaskIds.add(Long.parseLong(id.trim()));
                    } catch (NumberFormatException e) {
                        logger.warn("Invalid exclude task ID: {}", id);
                    }
                }
            }
            
            AuditTaskResponse response = auditTaskService.assignTasksToAuditor(level, excludeTaskIds);
            logger.info("New audit tasks assigned to auditor level {}: {} tasks", level, response.getTaskCount());
            return ResponseEntity.ok(ApiResponse.success("新任务获取成功", response));
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid auditor level: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error getting new audit tasks for auditor level: {}", level, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("服务器内部错误"));
        }
    }
    
    @GetMapping("/audit-history/{auditId}")
    public ResponseEntity<ApiResponse<List<AuditResultDto>>> getAuditHistory(@PathVariable Long auditId) {
        try {
            List<AuditResultDto> auditHistory = auditTaskService.getAuditHistory(auditId);
            logger.info("Audit history retrieved for audit ID: {} with {} entries", auditId, auditHistory.size());
            return ResponseEntity.ok(ApiResponse.success("审核历史获取成功", auditHistory));
        } catch (Exception e) {
            logger.error("Error getting audit history for audit ID: {}", auditId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("服务器内部错误"));
        }
    }
    
    @PostMapping("/release-task/{auditId}")
    public ResponseEntity<ApiResponse<Void>> releaseAuditTask(@PathVariable Long auditId) {
        try {
            auditTaskService.releaseAuditTask(auditId);
            logger.info("Audit task released: {}", auditId);
            return ResponseEntity.ok(ApiResponse.success("任务已释放", null));
        } catch (Exception e) {
            logger.error("Error releasing audit task: {}", auditId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("服务器内部错误"));
        }
    }
    
    @PostMapping("/result")
    public ResponseEntity<ApiResponse<AuditResultSubmissionResponse>> submitAuditResult(
            @Valid @RequestBody AuditResultSubmissionRequest request,
            BindingResult bindingResult) {
        
        if (bindingResult.hasErrors()) {
            StringBuilder errorMsg = new StringBuilder();
            bindingResult.getFieldErrors().forEach(error ->
                errorMsg.append(error.getDefaultMessage()).append("; ")
            );
            logger.warn("Audit result submission validation failed: {}", errorMsg.toString());
            return ResponseEntity.badRequest().body(ApiResponse.error(errorMsg.toString()));
        }
        
        try {
            AuditResultSubmissionResponse response = auditWorkflowService.processAuditResult(request);
            logger.info("Audit result processed successfully for audit ID: {}, workflow status: {}", 
                       request.getAuditId(), response.getWorkflowStatus());
            return ResponseEntity.ok(ApiResponse.success("审核结果提交成功", response));
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid audit result submission: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (IllegalStateException e) {
            logger.warn("Invalid audit state: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error processing audit result for audit ID: {}", request.getAuditId(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("服务器内部错误"));
        }
    }
    
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Void>> registerAuditor(
            @Valid @RequestBody AuditorRegistrationRequest request,
            BindingResult bindingResult) {
        
        if (bindingResult.hasErrors()) {
            StringBuilder errorMsg = new StringBuilder();
            bindingResult.getFieldErrors().forEach(error ->
                errorMsg.append(error.getDefaultMessage()).append("; ")
            );
            logger.warn("Auditor registration validation failed: {}", errorMsg.toString());
            return ResponseEntity.badRequest().body(ApiResponse.error(errorMsg.toString()));
        }
        
        try {
            auditorAuthService.registerAuditor(request);
            logger.info("Auditor registered successfully: {}", request.getAccount());
            return ResponseEntity.ok(ApiResponse.success("注册成功", null));
        } catch (RuntimeException e) {
            logger.warn("Auditor registration failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error registering auditor: {}", request.getAccount(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("服务器内部错误"));
        }
    }
    
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuditorLoginResponse>> loginAuditor(
            @Valid @RequestBody AuditorLoginRequest request,
            BindingResult bindingResult) {
        
        if (bindingResult.hasErrors()) {
            StringBuilder errorMsg = new StringBuilder();
            bindingResult.getFieldErrors().forEach(error ->
                errorMsg.append(error.getDefaultMessage()).append("; ")
            );
            logger.warn("Auditor login validation failed: {}", errorMsg.toString());
            return ResponseEntity.badRequest().body(ApiResponse.error(errorMsg.toString()));
        }
        
        try {
            AuditorLoginResponse response = auditorAuthService.login(request);
            logger.info("Auditor logged in successfully: {} (level: {})", 
                       response.getAccount(), response.getLevel());
            return ResponseEntity.ok(ApiResponse.success("登录成功", response));
        } catch (RuntimeException e) {
            logger.warn("Auditor login failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error logging in auditor: {}", request.getAccount(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("服务器内部错误"));
        }
    }
}