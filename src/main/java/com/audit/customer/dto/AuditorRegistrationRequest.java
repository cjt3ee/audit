package com.audit.customer.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public class AuditorRegistrationRequest {
    
    @NotBlank(message = "账号不能为空")
    private String account;
    
    @NotBlank(message = "密码不能为空")
    private String password;
    
    @NotNull(message = "等级不能为空")
    @Min(value = 0, message = "等级必须在0-3之间")
    @Max(value = 3, message = "等级必须在0-3之间")
    private Integer level;
    
    public AuditorRegistrationRequest() {}
    
    public AuditorRegistrationRequest(String account, String password, Integer level) {
        this.account = account;
        this.password = password;
        this.level = level;
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