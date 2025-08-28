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
    
    @Column(name = "password", nullable = false, length = 100)
    private String password;
    
    @Column(name = "level", nullable = false)
    private Integer level;
    
    public Auditor() {}
    
    public Auditor(String account, String password, Integer level) {
        this.account = account;
        this.password = password;
        this.level = level;
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
    }
}