package com.audit.customer.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public class CustomerQuestionnaireRequest {

    @NotNull
    @Valid
    private CustomerInfoDto customerInfo;

    @NotNull
    @Valid
    private RiskAssessmentDto riskAssessment;

    public CustomerInfoDto getCustomerInfo() {
        return customerInfo;
    }

    public void setCustomerInfo(CustomerInfoDto customerInfo) {
        this.customerInfo = customerInfo;
    }

    public RiskAssessmentDto getRiskAssessment() {
        return riskAssessment;
    }

    public void setRiskAssessment(RiskAssessmentDto riskAssessment) {
        this.riskAssessment = riskAssessment;
    }
}