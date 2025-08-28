package com.audit.customer.dto;

import java.util.List;

public class AuditStatusResponse {
    
    private Long customerId;
    private String status;
    private String message;
    private List<AuditResultDto> results;
    
    public AuditStatusResponse() {}
    
    public AuditStatusResponse(Long customerId, String status, String message) {
        this.customerId = customerId;
        this.status = status;
        this.message = message;
    }
    
    public AuditStatusResponse(Long customerId, String status, String message, List<AuditResultDto> results) {
        this.customerId = customerId;
        this.status = status;
        this.message = message;
        this.results = results;
    }
    
    public Long getCustomerId() {
        return customerId;
    }
    
    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
    
    public List<AuditResultDto> getResults() {
        return results;
    }
    
    public void setResults(List<AuditResultDto> results) {
        this.results = results;
    }
}