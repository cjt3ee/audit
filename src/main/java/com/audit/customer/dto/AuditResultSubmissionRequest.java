package com.audit.customer.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class AuditResultSubmissionRequest {
    
    @NotNull(message = "审核流程ID不能为空")
    private Long auditId;
    
    @NotNull(message = "审核员等级不能为空")
    @Min(value = 0, message = "审核员等级必须在0-3之间")
    @Max(value = 3, message = "审核员等级必须在0-3之间")
    private Integer auditorLevel;
    
    @NotNull(message = "审核员ID不能为空")
    private Long auditorId;
    
    @NotNull(message = "审核结果不能为空")
    private Boolean approved;
    
    @NotNull(message = "风险评分不能为空")
    @Min(value = 0, message = "风险评分不能小于0")
    @Max(value = 100, message = "风险评分不能大于100")
    private Integer riskScore;
    
    @NotBlank(message = "审核意见不能为空")
    private String opinion;
    
    public AuditResultSubmissionRequest() {}
    
    public AuditResultSubmissionRequest(Long auditId, Integer auditorLevel, Long auditorId, Boolean approved, 
                                      Integer riskScore, String opinion) {
        this.auditId = auditId;
        this.auditorLevel = auditorLevel;
        this.auditorId = auditorId;
        this.approved = approved;
        this.riskScore = riskScore;
        this.opinion = opinion;
    }
    
    public Long getAuditId() {
        return auditId;
    }
    
    public void setAuditId(Long auditId) {
        this.auditId = auditId;
    }
    
    public Integer getAuditorLevel() {
        return auditorLevel;
    }
    
    public void setAuditorLevel(Integer auditorLevel) {
        this.auditorLevel = auditorLevel;
    }
    
    public Boolean getApproved() {
        return approved;
    }
    
    public void setApproved(Boolean approved) {
        this.approved = approved;
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
    
    public Long getAuditorId() {
        return auditorId;
    }
    
    public void setAuditorId(Long auditorId) {
        this.auditorId = auditorId;
    }
}