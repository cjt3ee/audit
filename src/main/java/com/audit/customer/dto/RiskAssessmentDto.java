package com.audit.customer.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public class RiskAssessmentDto {

    @NotNull(message = "年收入代码不能为空")
    private Integer annualIncome;

    @NotNull(message = "投资金额不能为空")
    @DecimalMin(value = "0.00", message = "投资金额不能为负数")
    private BigDecimal investmentAmount;

    @Size(max = 100, message = "投资经验说明长度不能超过100字符")
    private String investmentExperience;

    @NotNull(message = "可承受最大亏损比例代码不能为空")
    private Integer maxLoss;

    @Size(max = 100, message = "投资目标说明长度不能超过100字符")
    private String investmentTarget;

    @Size(max = 100, message = "投资期限说明长度不能超过100字符")
    private String investmentExpire;

    @NotNull(message = "风险评分不能为空")
    private Integer score;

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

    public Integer getScore() {
        return score;
    }

    public void setScore(Integer score) {
        this.score = score;
    }
}