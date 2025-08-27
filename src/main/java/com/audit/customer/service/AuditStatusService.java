package com.audit.customer.service;

import com.audit.customer.dto.AuditStatusResponse;
import com.audit.customer.entity.AuditLog;
import com.audit.customer.entity.RiskAssessmentResult;
import com.audit.customer.repository.AuditLogRepository;
import com.audit.customer.repository.RiskAssessmentResultRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
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
        
        // 查找状态为3（终审完成）的审核记录
        List<AuditLog> completedAuditLogs = auditLogs.stream()
                .filter(audit -> audit.getStatus() == 3)
                .collect(Collectors.toList());
        
        if (completedAuditLogs.isEmpty()) {
            return new AuditStatusResponse(customerId, "in_progress", "审核中，请等待审核完成");
        }
        
        // 获取所有相关审核结果，并找到最后一个审核结果的风险评分
        Optional<Integer> finalRiskScore = completedAuditLogs.stream()
                .flatMap(audit -> {
                    List<RiskAssessmentResult> results = riskAssessmentResultRepository
                            .findByAuditIdOrderByStageAsc(audit.getId());
                    return results.stream();
                })
                .max(Comparator.comparing(RiskAssessmentResult::getCreatedAt))
                .map(RiskAssessmentResult::getRiskScore);
        
        if (!finalRiskScore.isPresent()) {
            return new AuditStatusResponse(customerId, "completed", "审核已完成，但未找到风险评分");
        }
        
        // 根据最终风险评分确定风险类型
        Integer riskTypeCode = mapRiskScoreToType(finalRiskScore.get());
        List<Integer> results = Arrays.asList(riskTypeCode);
        
        return new AuditStatusResponse(customerId, "completed", "审核已完成", results);
    }
    
    /**
     * 将风险评分映射到风险类型代码
     * @param riskScore 风险评分
     * @return 风险类型代码 (0: 稳健型, 1: 激进型, 2: 保守型)
     */
    private Integer mapRiskScoreToType(Integer riskScore) {
        if (riskScore <= 40) {
            return 0; // 保守型
        } else if (riskScore <= 70) {
            return 1; // 稳健型
        } else {
            return 2; // 激进型
        }
    }
}