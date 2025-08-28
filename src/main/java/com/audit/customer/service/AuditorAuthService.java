package com.audit.customer.service;

import com.audit.customer.dto.AuditorLoginRequest;
import com.audit.customer.dto.AuditorLoginResponse;
import com.audit.customer.dto.AuditorRegistrationRequest;
import com.audit.customer.entity.Auditor;
import com.audit.customer.repository.AuditorRepository;
import com.audit.customer.util.JwtUtil;
import com.audit.customer.util.AuditLogger;
import com.audit.customer.util.SecurityUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuditorAuthService {
    
    @Autowired
    private AuditorRepository auditorRepository;
    
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    
    @Autowired
    private JwtUtil jwtUtil;
    
    public void registerAuditor(AuditorRegistrationRequest request) {
        // 添加调试日志
        AuditLogger.logSecurityEvent("REGISTRATION_ATTEMPT", "Starting registration", 
            "Account: " + request.getAccount() + ", Level: " + request.getLevel());
        
        // 输入安全检查
        String account = SecurityUtil.sanitizeAndValidate(request.getAccount(), 50);
        String password = request.getPassword();
        
        // 密码强度检查
        if (password == null || password.length() < 8) {
            throw new RuntimeException("密码长度至少8位");
        }
        
        if (auditorRepository.existsByAccount(account)) {
            AuditLogger.logSecurityEvent("REGISTRATION_FAILED", "Account already exists", "Account: " + account);
            throw new RuntimeException("账号已存在");
        }
        
        // 使用BCrypt加密密码
        String encryptedPassword = passwordEncoder.encode(password);
        
        // 添加更多调试信息
        AuditLogger.logSecurityEvent("REGISTRATION_CREATING", "Creating auditor entity", 
            "Account: " + account + ", Level: " + request.getLevel() + ", PasswordEncrypted: " + (encryptedPassword != null));
        
        Auditor auditor = new Auditor(account, encryptedPassword, request.getLevel());
        auditor = auditorRepository.save(auditor);
        
        // 记录审计日志
        AuditLogger.logAuditorOperation("REGISTER", auditor.getId(), account, 
            "Level: " + request.getLevel());
    }
    
    public AuditorLoginResponse login(AuditorLoginRequest request) {
        String account = SecurityUtil.sanitizeAndValidate(request.getAccount(), 50);
        
        try {
            Auditor auditor = auditorRepository.findByAccount(account)
                .orElseThrow(() -> {
                    AuditLogger.logLogin(account, false, "Unknown");
                    return new RuntimeException("账号不存在");
                });
            
            // 检查账号状态
            if (!auditor.getIsActive()) {
                AuditLogger.logLogin(account, false, "Unknown");
                throw new RuntimeException("账号已被禁用");
            }
            
            // 使用BCrypt验证密码
            if (!passwordEncoder.matches(request.getPassword(), auditor.getPassword())) {
                AuditLogger.logLogin(account, false, "Unknown");
                throw new RuntimeException("密码错误");
            }
            
            // 生成加密的JWT token
            String token = jwtUtil.generateToken(
                auditor.getId(),
                auditor.getAccount(),
                auditor.getLevel()
            );
            
            String levelName = getLevelName(auditor.getLevel());
            
            AuditorLoginResponse response = new AuditorLoginResponse(
                auditor.getId(),
                auditor.getAccount(),
                auditor.getLevel(),
                levelName
            );
            
            // 添加JWT token到响应中
            response.setToken("Bearer " + token);
            
            // 记录成功登录
            AuditLogger.logLogin(account, true, "Unknown");
            AuditLogger.logAuditorOperation("LOGIN", auditor.getId(), account, 
                "Level: " + auditor.getLevel() + ", Token generated");
            
            return response;
        } catch (RuntimeException e) {
            AuditLogger.logSecurityEvent("LOGIN_FAILED", e.getMessage(), "Account: " + account);
            throw e;
        }
    }
    
    /**
     * 验证token并获取审核员信息
     */
    public JwtUtil.AuditorInfo validateTokenAndGetAuditorInfo(String token) {
        // 移除Bearer前缀
        if (token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        
        if (!jwtUtil.validateToken(token)) {
            throw new RuntimeException("Token无效或已过期");
        }
        
        JwtUtil.AuditorInfo auditorInfo = jwtUtil.validateTokenAndGetAuditorInfo(token);
        
        // 实时验证审核员状态（从数据库重新获取，确保权限时效性）
        Auditor auditor = auditorRepository.findById(auditorInfo.getAuditorId())
            .orElseThrow(() -> new RuntimeException("审核员不存在"));
        
        if (!auditor.getIsActive()) {
            throw new RuntimeException("账号已被禁用，请联系管理员");
        }
        
        if (!auditor.getLevel().equals(auditorInfo.getStage())) {
            throw new RuntimeException("审核员级别已变更，请重新登录");
        }
        
        return auditorInfo;
    }
    
    private String getLevelName(Integer level) {
        switch (level) {
            case 0: return "初级审核员";
            case 1: return "中级审核员";
            case 2: return "高级审核员";
            case 3: return "投资委员会";
            default: return "未知级别";
        }
    }
}