package com.audit.customer.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class AuditTaskDto {
    
    private Long auditId;
    private Long customerId;
    private String customerName;
    private String customerPhone;
    private Integer stage;
    private Integer riskScore;
    private String riskType;
    private LocalDateTime createdAt;
    private BigDecimal investAmount;
    
    public AuditTaskDto() {}
    
    public AuditTaskDto(Long auditId, Long customerId, String customerName, String customerPhone, 
                       Integer stage, Integer riskScore, String riskType, LocalDateTime createdAt, 
                       BigDecimal investAmount) {
        this.auditId = auditId;
        this.customerId = customerId;
        this.customerName = customerName;
        this.customerPhone = customerPhone;
        this.stage = stage;
        this.riskScore = riskScore;
        this.riskType = riskType;
        this.createdAt = createdAt;
        this.investAmount = investAmount;
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
    
    public String getCustomerName() {
        return customerName;
    }
    
    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }
    
    public String getCustomerPhone() {
        return customerPhone;
    }
    
    public void setCustomerPhone(String customerPhone) {
        this.customerPhone = customerPhone;
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
    
    public String getRiskType() {
        return riskType;
    }
    
    public void setRiskType(String riskType) {
        this.riskType = riskType;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public BigDecimal getInvestAmount() {
        return investAmount;
    }
    
    public void setInvestAmount(BigDecimal investAmount) {
        this.investAmount = investAmount;
    }
}