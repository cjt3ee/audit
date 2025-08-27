package com.audit.customer.service;

import com.audit.customer.dto.AuditResultDto;
import com.audit.customer.dto.AuditStatusResponse;
import com.audit.customer.entity.AuditLog;
import com.audit.customer.entity.RiskAssessmentResult;
import com.audit.customer.repository.AuditLogRepository;
import com.audit.customer.repository.RiskAssessmentResultRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AuditStatusService {
    
    @Autowired
    private AuditLogRepository auditLogRepository;
    
    @Autowired
    private RiskAssessmentResultRepository riskAssessmentResultRepository;
    
    public AuditStatusResponse getAuditStatus(Long customerId) {
        List<AuditLog> auditLogs = auditLogRepository.findByCustomerId(customerId);
        
        if (auditLogs.isEmpty()) {
            return new AuditStatusResponse(customerId, "not_found", "未找到该客户的审核记录");
        }
        
        List<AuditLog> finalAuditLogs = auditLogs.stream()
                .filter(audit -> audit.getStatus() == 3)
                .collect(Collectors.toList());
        
        if (finalAuditLogs.isEmpty()) {
            return new AuditStatusResponse(customerId, "in_progress", "审核中，请等待审核完成");
        }
        
        List<AuditResultDto> allResults = finalAuditLogs.stream()
                .flatMap(audit -> {
                    List<RiskAssessmentResult> results = riskAssessmentResultRepository
                            .findByAuditIdOrderByStageAsc(audit.getId());
                    return results.stream().map(result -> 
                            new AuditResultDto(result.getStage(), result.getRiskScore(), 
                                    result.getOpinion(), result.getCreatedAt()));
                })
                .collect(Collectors.toList());
        
        return new AuditStatusResponse(customerId, "completed", "审核已完成", allResults);
    }
}