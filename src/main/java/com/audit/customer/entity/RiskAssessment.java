package com.audit.customer.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "risk_assessment",
       indexes = {
           @Index(name = "idx_risk_customer", columnList = "customer_id"),
           @Index(name = "idx_risk_score", columnList = "score")
       })
public class RiskAssessment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    @NotNull
    @Column(name = "annual_income", nullable = false)
    private Integer annualIncome;

    @NotNull
    @DecimalMin("0.00")
    @Column(name = "investment_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal investmentAmount;

    @Size(max = 100)
    @Column(name = "investment_experience", length = 100)
    private String investmentExperience;

    @NotNull
    @Column(name = "max_loss", nullable = false)
    private Integer maxLoss;

    @Size(max = 100)
    @Column(name = "investment_target", length = 100)
    private String investmentTarget;

    @Size(max = 100)
    @Column(name = "investment_expire", length = 100)
    private String investmentExpire;

    @NotNull
    @Column(name = "score", nullable = false)
    private Integer score;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
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

    public Integer getScore() {
        return score;
    }

    public void setScore(Integer score) {
        this.score = score;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}