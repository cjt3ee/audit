package com.audit.customer.enums;

public enum RiskType {
    CONSERVATIVE("保守型", 0, 40),
    BALANCED("稳健型", 41, 70),
    AGGRESSIVE("激进型", 71, 100);
    
    private final String description;
    private final int minScore;
    private final int maxScore;
    
    RiskType(String description, int minScore, int maxScore) {
        this.description = description;
        this.minScore = minScore;
        this.maxScore = maxScore;
    }
    
    public String getDescription() {
        return description;
    }
    
    public int getMinScore() {
        return minScore;
    }
    
    public int getMaxScore() {
        return maxScore;
    }
    
    public static RiskType fromScore(Integer score) {
        if (score == null) {
            throw new IllegalArgumentException("风险评分不能为空");
        }
        
        for (RiskType type : RiskType.values()) {
            if (score >= type.minScore && score <= type.maxScore) {
                return type;
            }
        }
        
        throw new IllegalArgumentException("无效的风险评分: " + score);
    }
}