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
    private String aiAudit;
    
    // 客户详细信息
    private String customerEmail;
    private String customerOccupation;
    private String customerIdCard;
    
    // 风险评估详细信息
    private Integer annualIncome;
    private BigDecimal investmentAmount;
    private String investmentExperience;
    private Integer maxLoss;
    private String investmentTarget;
    private String investmentExpire;
    
    public AuditTaskDto() {}
    
    public AuditTaskDto(Long auditId, Long customerId, String customerName, String customerPhone, 
                       Integer stage, Integer riskScore, String riskType, LocalDateTime createdAt, 
                       BigDecimal investAmount, String aiAudit,
                       String customerEmail, String customerOccupation, String customerIdCard,
                       Integer annualIncome, BigDecimal investmentAmount, String investmentExperience,
                       Integer maxLoss, String investmentTarget, String investmentExpire) {
        this.auditId = auditId;
        this.customerId = customerId;
        this.customerName = customerName;
        this.customerPhone = customerPhone;
        this.stage = stage;
        this.riskScore = riskScore;
        this.riskType = riskType;
        this.createdAt = createdAt;
        this.investAmount = investAmount;
        this.aiAudit = aiAudit;
        this.customerEmail = customerEmail;
        this.customerOccupation = customerOccupation;
        this.customerIdCard = customerIdCard;
        this.annualIncome = annualIncome;
        this.investmentAmount = investmentAmount;
        this.investmentExperience = investmentExperience;
        this.maxLoss = maxLoss;
        this.investmentTarget = investmentTarget;
        this.investmentExpire = investmentExpire;
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
    
    public String getAiAudit() {
        return aiAudit;
    }
    
    public void setAiAudit(String aiAudit) {
        this.aiAudit = aiAudit;
    }
    
    public String getCustomerEmail() {
        return customerEmail;
    }
    
    public void setCustomerEmail(String customerEmail) {
        this.customerEmail = customerEmail;
    }
    
    public String getCustomerOccupation() {
        return customerOccupation;
    }
    
    public void setCustomerOccupation(String customerOccupation) {
        this.customerOccupation = customerOccupation;
    }
    
    public String getCustomerIdCard() {
        return customerIdCard;
    }
    
    public void setCustomerIdCard(String customerIdCard) {
        this.customerIdCard = customerIdCard;
    }
    
    public Integer getAnnualIncome() {
        return annualIncome;
    }
    
    public void setAnnualIncome(Integer annualIncome) {
        this.annualIncome = annualIncome;
    }
    
    public BigDecimal getInvestmentAmount() {
        return investmentAmount;
    }
    
    public void setInvestmentAmount(BigDecimal investmentAmount) {
        this.investmentAmount = investmentAmount;
    }
    
    public String getInvestmentExperience() {
        return investmentExperience;
    }
    
    public void setInvestmentExperience(String investmentExperience) {
        this.investmentExperience = investmentExperience;
    }
    
    public Integer getMaxLoss() {
        return maxLoss;
    }
    
    public void setMaxLoss(Integer maxLoss) {
        this.maxLoss = maxLoss;
    }
    
    public String getInvestmentTarget() {
        return investmentTarget;
    }
    
    public void setInvestmentTarget(String investmentTarget) {
        this.investmentTarget = investmentTarget;
    }
    
    public String getInvestmentExpire() {
        return investmentExpire;
    }
    
    public void setInvestmentExpire(String investmentExpire) {
        this.investmentExpire = investmentExpire;
    }
}