package com.audit.customer.dto;

import jakarta.validation.constraints.NotBlank;

public class AuditorLoginRequest {
    
    @NotBlank(message = "账号不能为空")
    private String account;
    
    @NotBlank(message = "密码不能为空")
    private String password;
    
    public AuditorLoginRequest() {}
    
    public AuditorLoginRequest(String account, String password) {
        this.account = account;
        this.password = password;
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
}