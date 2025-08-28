package com.audit.customer.util;

import org.springframework.stereotype.Component;
import org.springframework.web.util.HtmlUtils;

import java.util.regex.Pattern;

@Component
public class SecurityUtil {
    
    // 手机号正则表达式
    private static final Pattern PHONE_PATTERN = Pattern.compile("^1[3-9]\\d{9}$");
    
    // 身份证号正则表达式
    private static final Pattern ID_CARD_PATTERN = Pattern.compile("^\\d{17}[\\dX]$");
    
    // 邮箱正则表达式
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@([A-Za-z0-9.-]+\\.[A-Za-z]{2,})$");
    
    // SQL注入关键词检测
    private static final Pattern SQL_INJECTION_PATTERN = Pattern.compile(
        "(?i).*(union|select|insert|update|delete|drop|create|alter|exec|script|javascript|vbscript|onload|onerror).*"
    );
    
    /**
     * 验证手机号格式
     */
    public static boolean isValidPhone(String phone) {
        if (phone == null || phone.trim().isEmpty()) {
            return false;
        }
        return PHONE_PATTERN.matcher(phone.trim()).matches();
    }
    
    /**
     * 验证身份证号格式
     */
    public static boolean isValidIdCard(String idCard) {
        if (idCard == null || idCard.trim().isEmpty()) {
            return false;
        }
        return ID_CARD_PATTERN.matcher(idCard.trim().toUpperCase()).matches();
    }
    
    /**
     * 验证邮箱格式
     */
    public static boolean isValidEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return true; // 邮箱可选
        }
        return EMAIL_PATTERN.matcher(email.trim()).matches();
    }
    
    /**
     * XSS防护 - HTML转义
     */
    public static String sanitizeInput(String input) {
        if (input == null) {
            return null;
        }
        return HtmlUtils.htmlEscape(input.trim());
    }
    
    /**
     * SQL注入检测
     */
    public static boolean containsSqlInjection(String input) {
        if (input == null || input.trim().isEmpty()) {
            return false;
        }
        return SQL_INJECTION_PATTERN.matcher(input).matches();
    }
    
    /**
     * 安全的字符串清理
     */
    public static String sanitizeAndValidate(String input, int maxLength) {
        if (input == null) {
            return null;
        }
        
        String cleaned = input.trim();
        
        // 检查长度
        if (cleaned.length() > maxLength) {
            throw new IllegalArgumentException("输入内容超过最大长度限制：" + maxLength);
        }
        
        // SQL注入检测
        if (containsSqlInjection(cleaned)) {
            throw new IllegalArgumentException("输入内容包含非法字符");
        }
        
        // XSS防护
        return sanitizeInput(cleaned);
    }
    
    /**
     * 脱敏手机号显示
     */
    public static String maskPhone(String phone) {
        if (phone == null || phone.length() != 11) {
            return phone;
        }
        return phone.substring(0, 3) + "****" + phone.substring(7);
    }
    
    /**
     * 脱敏身份证号显示
     */
    public static String maskIdCard(String idCard) {
        if (idCard == null || idCard.length() != 18) {
            return idCard;
        }
        return idCard.substring(0, 6) + "********" + idCard.substring(14);
    }
    
    /**
     * 脱敏邮箱显示
     */
    public static String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return email;
        }
        String[] parts = email.split("@");
        if (parts[0].length() <= 2) {
            return email;
        }
        return parts[0].substring(0, 2) + "****@" + parts[1];
    }
}