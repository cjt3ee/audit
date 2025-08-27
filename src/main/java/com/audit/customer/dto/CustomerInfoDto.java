package com.audit.customer.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public class CustomerInfoDto {

    @NotBlank(message = "客户姓名不能为空")
    @Size(max = 100, message = "客户姓名长度不能超过100字符")
    private String name;

    @NotBlank(message = "手机号不能为空")
    @Size(max = 20, message = "手机号长度不能超过20字符")
    private String phone;

    @NotBlank(message = "身份证号不能为空")
    @Size(max = 20, message = "身份证号长度不能超过20字符")
    private String idCard;

    @Email(message = "邮箱格式不正确")
    @Size(max = 100, message = "邮箱长度不能超过100字符")
    private String email;

    @Size(max = 100, message = "职业长度不能超过100字符")
    private String occupation;

    @DecimalMin(value = "0.00", message = "投资金额不能为负数")
    private BigDecimal investAmount;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getIdCard() {
        return idCard;
    }

    public void setIdCard(String idCard) {
        this.idCard = idCard;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getOccupation() {
        return occupation;
    }

    public void setOccupation(String occupation) {
        this.occupation = occupation;
    }

    public BigDecimal getInvestAmount() {
        return investAmount;
    }

    public void setInvestAmount(BigDecimal investAmount) {
        this.investAmount = investAmount;
    }
}