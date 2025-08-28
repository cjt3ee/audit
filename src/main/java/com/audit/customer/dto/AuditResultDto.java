package com.audit.customer.dto;

import java.time.LocalDateTime;

public class AuditResultDto {
    
    private Long auditId;
    private Integer stage;
    private Integer riskScore;
    private String opinion;
    private LocalDateTime createdAt;
    
    public AuditResultDto() {}
    
    public AuditResultDto(Long auditId, Integer stage, Integer riskScore, String opinion, LocalDateTime createdAt) {
        this.auditId = auditId;
        this.stage = stage;
        this.riskScore = riskScore;
        this.opinion = opinion;
        this.createdAt = createdAt;
    }
    
    public Long getAuditId() {
        return auditId;
    }
    
    public void setAuditId(Long auditId) {
        this.auditId = auditId;
    }
    
    public Integer getStage() {
        return stage;
    }
    
    public void setStage(Integer stage) {
        this.stage = stage;
    }
    
    public Integer getRiskScore() {
        return riskScore;
    }
    
    public void setRiskScore(Integer riskScore) {
        this.riskScore = riskScore;
    }
    
    public String getOpinion() {
        return opinion;
    }
    
    public void setOpinion(String opinion) {
        this.opinion = opinion;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}