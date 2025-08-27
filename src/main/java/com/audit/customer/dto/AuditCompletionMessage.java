package com.audit.customer.dto;

import java.time.LocalDateTime;
import java.util.List;

public class AuditCompletionMessage {
    
    private Long auditId;
    private Long customerId;
    private CustomerBasicInfo customerInfo;
    private RiskAssessmentInfo riskAssessment;
    private List<AuditStageResult> auditResults;
    private String finalResult;
    private LocalDateTime completedAt;
    private String messageId;
    
    public AuditCompletionMessage() {
        this.messageId = java.util.UUID.randomUUID().toString();
        this.completedAt = LocalDateTime.now();
    }
    
    public static class CustomerBasicInfo {
        private String name;
        private String phone;
        private String idCard;
        private String email;
        private String occupation;
        private java.math.BigDecimal investAmount;
        
        public CustomerBasicInfo() {}
        
        public CustomerBasicInfo(String name, String phone, String idCard, String email, 
                               String occupation, java.math.BigDecimal investAmount) {
            this.name = name;
            this.phone = phone;
            this.idCard = idCard;
            this.email = email;
            this.occupation = occupation;
            this.investAmount = investAmount;
        }
        
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        
        public String getIdCard() { return idCard; }
        public void setIdCard(String idCard) { this.idCard = idCard; }
        
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        
        public String getOccupation() { return occupation; }
        public void setOccupation(String occupation) { this.occupation = occupation; }
        
        public java.math.BigDecimal getInvestAmount() { return investAmount; }
        public void setInvestAmount(java.math.BigDecimal investAmount) { this.investAmount = investAmount; }
    }
    
    public static class RiskAssessmentInfo {
        private Integer annualIncome;
        private java.math.BigDecimal investmentAmount;
        private String investmentExperience;
        private Integer maxLoss;
        private String investmentTarget;
        private String investmentExpire;
        private Integer score;
        private String riskType;
        
        public RiskAssessmentInfo() {}
        
        public RiskAssessmentInfo(Integer annualIncome, java.math.BigDecimal investmentAmount,
                                String investmentExperience, Integer maxLoss, String investmentTarget,
                                String investmentExpire, Integer score, String riskType) {
            this.annualIncome = annualIncome;
            this.investmentAmount = investmentAmount;
            this.investmentExperience = investmentExperience;
            this.maxLoss = maxLoss;
            this.investmentTarget = investmentTarget;
            this.investmentExpire = investmentExpire;
            this.score = score;
            this.riskType = riskType;
        }
        
        public Integer getAnnualIncome() { return annualIncome; }
        public void setAnnualIncome(Integer annualIncome) { this.annualIncome = annualIncome; }
        
        public java.math.BigDecimal getInvestmentAmount() { return investmentAmount; }
        public void setInvestmentAmount(java.math.BigDecimal investmentAmount) { this.investmentAmount = investmentAmount; }
        
        public String getInvestmentExperience() { return investmentExperience; }
        public void setInvestmentExperience(String investmentExperience) { this.investmentExperience = investmentExperience; }
        
        public Integer getMaxLoss() { return maxLoss; }
        public void setMaxLoss(Integer maxLoss) { this.maxLoss = maxLoss; }
        
        public String getInvestmentTarget() { return investmentTarget; }
        public void setInvestmentTarget(String investmentTarget) { this.investmentTarget = investmentTarget; }
        
        public String getInvestmentExpire() { return investmentExpire; }
        public void setInvestmentExpire(String investmentExpire) { this.investmentExpire = investmentExpire; }
        
        public Integer getScore() { return score; }
        public void setScore(Integer score) { this.score = score; }
        
        public String getRiskType() { return riskType; }
        public void setRiskType(String riskType) { this.riskType = riskType; }
    }
    
    public static class AuditStageResult {
        private Integer stage;
        private String stageName;
        private Integer riskScore;
        private String opinion;
        private Boolean approved;
        private LocalDateTime createdAt;
        
        public AuditStageResult() {}
        
        public AuditStageResult(Integer stage, String stageName, Integer riskScore, 
                              String opinion, Boolean approved, LocalDateTime createdAt) {
            this.stage = stage;
            this.stageName = stageName;
            this.riskScore = riskScore;
            this.opinion = opinion;
            this.approved = approved;
            this.createdAt = createdAt;
        }
        
        public Integer getStage() { return stage; }
        public void setStage(Integer stage) { this.stage = stage; }
        
        public String getStageName() { return stageName; }
        public void setStageName(String stageName) { this.stageName = stageName; }
        
        public Integer getRiskScore() { return riskScore; }
        public void setRiskScore(Integer riskScore) { this.riskScore = riskScore; }
        
        public String getOpinion() { return opinion; }
        public void setOpinion(String opinion) { this.opinion = opinion; }
        
        public Boolean getApproved() { return approved; }
        public void setApproved(Boolean approved) { this.approved = approved; }
        
        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    }
    
    // Getters and Setters
    public Long getAuditId() { return auditId; }
    public void setAuditId(Long auditId) { this.auditId = auditId; }
    
    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }
    
    public CustomerBasicInfo getCustomerInfo() { return customerInfo; }
    public void setCustomerInfo(CustomerBasicInfo customerInfo) { this.customerInfo = customerInfo; }
    
    public RiskAssessmentInfo getRiskAssessment() { return riskAssessment; }
    public void setRiskAssessment(RiskAssessmentInfo riskAssessment) { this.riskAssessment = riskAssessment; }
    
    public List<AuditStageResult> getAuditResults() { return auditResults; }
    public void setAuditResults(List<AuditStageResult> auditResults) { this.auditResults = auditResults; }
    
    public String getFinalResult() { return finalResult; }
    public void setFinalResult(String finalResult) { this.finalResult = finalResult; }
    
    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
    
    public String getMessageId() { return messageId; }
    public void setMessageId(String messageId) { this.messageId = messageId; }
}