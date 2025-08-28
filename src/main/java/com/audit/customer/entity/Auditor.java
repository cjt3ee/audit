package com.audit.customer.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "auditor")
public class Auditor {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;
    
    @Column(name = "account", nullable = false, unique = true, length = 50)
    private String account;
    
    @Column(name = "username", nullable = false, length = 50)
    private String username;
    
    @Column(name = "password", nullable = false, length = 100)
    private String password;
    
    @Column(name = "level", nullable = false)
    private Integer level;
    
    @Column(name = "stage_level", nullable = false)
    private Integer stageLevel;
    
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
    
    public Auditor() {}
    
    public Auditor(String account, String password, Integer level) {
        this.account = account;
        this.username = account; // username与account保持一致
        this.password = password;
        this.level = level;
        this.stageLevel = level; // 两个字段保持一致
        this.isActive = true; // 默认激活状态
    }
    
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getAccount() {
        return account;
    }
    
    public void setAccount(String account) {
        this.account = account;
        this.username = account; // 保持同步
    }
    
    public String getUsername() {
        return username;
    }
    
    public void setUsername(String username) {
        this.username = username;
    }
    
    public String getPassword() {
        return password;
    }
    
    public void setPassword(String password) {
        this.password = password;
    }
    
    public Integer getLevel() {
        return level;
    }
    
    public void setLevel(Integer level) {
        this.level = level;
        this.stageLevel = level; // 保持同步
    }
    
    public Integer getStageLevel() {
        return stageLevel;
    }
    
    public void setStageLevel(Integer stageLevel) {
        this.stageLevel = stageLevel;
        this.level = stageLevel; // 保持同步
    }
    
    public Boolean getIsActive() {
        return isActive;
    }
    
    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
}