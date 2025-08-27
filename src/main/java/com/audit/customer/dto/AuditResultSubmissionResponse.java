package com.audit.customer.dto;

public class AuditResultSubmissionResponse {
    
    private Long auditId;
    private Long customerId;
    private String workflowStatus;
    private String message;
    private Integer nextStage;
    private Boolean isCompleted;
    
    public AuditResultSubmissionResponse() {}
    
    public AuditResultSubmissionResponse(Long auditId, Long customerId, String workflowStatus, 
                                       String message, Integer nextStage, Boolean isCompleted) {
        this.auditId = auditId;
        this.customerId = customerId;
        this.workflowStatus = workflowStatus;
        this.message = message;
        this.nextStage = nextStage;
        this.isCompleted = isCompleted;
    }
    
    public Long getAuditId() {
        return auditId;
    }
    
    public void setAuditId(Long auditId) {
        this.auditId = auditId;
    }
    
    public Long getCustomerId() {
        return customerId;
    }
    
    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }
    
    public String getWorkflowStatus() {
        return workflowStatus;
    }
    
    public void setWorkflowStatus(String workflowStatus) {
        this.workflowStatus = workflowStatus;
    }
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
    
    public Integer getNextStage() {
        return nextStage;
    }
    
    public void setNextStage(Integer nextStage) {
        this.nextStage = nextStage;
    }
    
    public Boolean getIsCompleted() {
        return isCompleted;
    }
    
    public void setIsCompleted(Boolean isCompleted) {
        this.isCompleted = isCompleted;
    }
}