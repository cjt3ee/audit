package com.audit.consumer.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;
import java.util.Map;

public class UserAuditFormMessage {
    
    @JsonProperty("auditLogId")
    private Long auditLogId;
    
    @JsonProperty("customerId")
    private Long customerId;
    
    @JsonProperty("formData")
    private FormData formData;
    
    @JsonProperty("submitTime")
    private LocalDateTime submitTime;
    
    public static class FormData {
        @JsonProperty("riskScore")
        private Integer riskScore;
        
        @JsonProperty("investorType")
        private String investorType;
        
        @JsonProperty("investmentAmount")
        private Double investmentAmount;
        
        @JsonProperty("annualIncome")
        private Integer annualIncome;
        
        @JsonProperty("maxLoss")
        private Integer maxLoss;
        
        @JsonProperty("questionnaireAnswers")
        private Map<String, Object> questionnaireAnswers;
        
        @JsonProperty("customerAge")
        private Integer customerAge;
        
        @JsonProperty("occupation")
        private String occupation;
        
        public FormData() {}

        public Integer getRiskScore() {
            return riskScore;
        }

        public void setRiskScore(Integer riskScore) {
            this.riskScore = riskScore;
        }

        public String getInvestorType() {
            return investorType;
        }

        public void setInvestorType(String investorType) {
            this.investorType = investorType;
        }

        public Double getInvestmentAmount() {
            return investmentAmount;
        }

        public void setInvestmentAmount(Double investmentAmount) {
            this.investmentAmount = investmentAmount;
        }

        public Integer getAnnualIncome() {
            return annualIncome;
        }

        public void setAnnualIncome(Integer annualIncome) {
            this.annualIncome = annualIncome;
        }

        public Integer getMaxLoss() {
            return maxLoss;
        }

        public void setMaxLoss(Integer maxLoss) {
            this.maxLoss = maxLoss;
        }

        public Map<String, Object> getQuestionnaireAnswers() {
            return questionnaireAnswers;
        }

        public void setQuestionnaireAnswers(Map<String, Object> questionnaireAnswers) {
            this.questionnaireAnswers = questionnaireAnswers;
        }

        public Integer getCustomerAge() {
            return customerAge;
        }

        public void setCustomerAge(Integer customerAge) {
            this.customerAge = customerAge;
        }

        public String getOccupation() {
            return occupation;
        }

        public void setOccupation(String occupation) {
            this.occupation = occupation;
        }
    }

    public UserAuditFormMessage() {}

    public Long getAuditLogId() {
        return auditLogId;
    }

    public void setAuditLogId(Long auditLogId) {
        this.auditLogId = auditLogId;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public FormData getFormData() {
        return formData;
    }

    public void setFormData(FormData formData) {
        this.formData = formData;
    }

    public LocalDateTime getSubmitTime() {
        return submitTime;
    }

    public void setSubmitTime(LocalDateTime submitTime) {
        this.submitTime = submitTime;
    }
}