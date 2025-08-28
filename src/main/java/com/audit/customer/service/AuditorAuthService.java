package com.audit.customer.service;

import com.audit.customer.dto.AuditorLoginRequest;
import com.audit.customer.dto.AuditorLoginResponse;
import com.audit.customer.dto.AuditorRegistrationRequest;
import com.audit.customer.entity.Auditor;
import com.audit.customer.repository.AuditorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AuditorAuthService {
    
    @Autowired
    private AuditorRepository auditorRepository;
    
    public void registerAuditor(AuditorRegistrationRequest request) {
        if (auditorRepository.existsByAccount(request.getAccount())) {
            throw new RuntimeException("账号已存在");
        }
        
        Auditor auditor = new Auditor(
            request.getAccount(),
            request.getPassword(),
            request.getLevel()
        );
        
        auditorRepository.save(auditor);
    }
    
    public AuditorLoginResponse login(AuditorLoginRequest request) {
        Auditor auditor = auditorRepository.findByAccount(request.getAccount())
            .orElseThrow(() -> new RuntimeException("账号不存在"));
        
        if (!auditor.getPassword().equals(request.getPassword())) {
            throw new RuntimeException("密码错误");
        }
        
        String levelName = getLevelName(auditor.getLevel());
        
        return new AuditorLoginResponse(
            auditor.getId(),
            auditor.getAccount(),
            auditor.getLevel(),
            levelName
        );
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