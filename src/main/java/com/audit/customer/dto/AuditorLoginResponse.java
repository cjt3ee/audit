package com.audit.customer.dto;

public class AuditorLoginResponse {
    
    private Long auditorId;
    private String account;
    private Integer level;
    private String levelName;
    private String token;
    
    public AuditorLoginResponse() {}
    
    public AuditorLoginResponse(Long auditorId, String account, Integer level, String levelName) {
        this.auditorId = auditorId;
        this.account = account;
        this.level = level;
        this.levelName = levelName;
    }
    
    public Long getAuditorId() {
        return auditorId;
    }
    
    public void setAuditorId(Long auditorId) {
        this.auditorId = auditorId;
    }
    
    public String getAccount() {
        return account;
    }
    
    public void setAccount(String account) {
        this.account = account;
    }
    
    public Integer getLevel() {
        return level;
    }
    
    public void setLevel(Integer level) {
        this.level = level;
    }
    
    public String getLevelName() {
        return levelName;
    }
    
    public void setLevelName(String levelName) {
        this.levelName = levelName;
    }
    
    public String getToken() {
        return token;
    }
    
    public void setToken(String token) {
        this.token = token;
    }
}