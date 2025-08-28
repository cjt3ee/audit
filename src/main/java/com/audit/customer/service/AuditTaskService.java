package com.audit.customer.service;

import com.audit.customer.dto.AuditResultDto;
import com.audit.customer.dto.AuditTaskDto;
import com.audit.customer.dto.AuditTaskResponse;
import com.audit.customer.entity.AuditLog;
import com.audit.customer.entity.CustomerInfo;
import com.audit.customer.entity.RiskAssessment;
import com.audit.customer.entity.RiskAssessmentResult;
import com.audit.customer.enums.RiskType;
import com.audit.customer.repository.AuditLogRepository;
import com.audit.customer.repository.CustomerInfoRepository;
import com.audit.customer.repository.RiskAssessmentRepository;
import com.audit.customer.repository.RiskAssessmentResultRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AuditTaskService {
    
    private static final Logger logger = LoggerFactory.getLogger(AuditTaskService.class);
    
    @Autowired
    private AuditLogRepository auditLogRepository;
    
    @Autowired
    private CustomerInfoRepository customerInfoRepository;
    
    @Autowired
    private RiskAssessmentRepository riskAssessmentRepository;
    
    @Autowired
    private RiskAssessmentResultRepository riskAssessmentResultRepository;
    
    @Value("${audit.task.max-batch-size:10}")
    private int maxBatchSize;
    
    @Transactional
    public AuditTaskResponse assignTasksToAuditor(Integer auditorLevel, Long auditorId) {
        return assignTasksToAuditor(auditorLevel, auditorId, null);
    }
    
    @Transactional
    public AuditTaskResponse assignTasksToAuditor(Integer auditorLevel, Long auditorId, List<Long> excludeTaskIds) {
        // 验证审核员等级
        if (auditorLevel < 0 || auditorLevel > 3) {
            throw new IllegalArgumentException("审核员等级必须在0-3之间");
        }
        
        // 1. 获取该审核员已经抢占但未完成的任务
        List<AuditLog> existingTasks = auditLogRepository.findByStageAndStatusAndAuditorIdOrderByCreatedAtAsc(
                auditorLevel, 1, auditorId);
        
        // 2. 获取新的待分配任务（减去已抢占的任务数量）
        int remainingSlots = maxBatchSize - existingTasks.size();
        List<AuditLog> newTasks = new ArrayList<>();
        
        if (remainingSlots > 0) {
            Pageable pageable = PageRequest.of(0, remainingSlots);
            List<AuditLog> availableTasks;
            
            if (excludeTaskIds == null || excludeTaskIds.isEmpty()) {
                availableTasks = auditLogRepository.findByStageAndStatusOrderByCreatedAtAsc(
                        auditorLevel, 0, pageable);
            } else {
                availableTasks = auditLogRepository.findByStageAndStatusAndIdNotInOrderByCreatedAtAsc(
                        auditorLevel, 0, excludeTaskIds, pageable);
            }
            
            if (!availableTasks.isEmpty()) {
                // 提取audit_log的ID列表
                List<Long> auditIds = availableTasks.stream()
                        .map(AuditLog::getId)
                        .collect(Collectors.toList());
                
                // 原子性更新状态和审核员ID：0未分配 -> 1已分配未完成
                int updatedCount = auditLogRepository.updateStatusAndAuditorByIds(auditIds, 1, auditorId, 0);
                
                // 获取实际成功分配的任务
                if (updatedCount > 0) {
                    newTasks = auditLogRepository.findAllById(auditIds).stream()
                            .filter(audit -> audit.getStatus() == 1 && auditorId.equals(audit.getAuditorId()))
                            .collect(Collectors.toList());
                }
            }
        }
        
        // 3. 合并已有任务和新抢占的任务
        List<AuditLog> allTasks = new ArrayList<>();
        allTasks.addAll(existingTasks);
        allTasks.addAll(newTasks);
        
        if (allTasks.isEmpty()) {
            return new AuditTaskResponse(auditorLevel, new ArrayList<>());
        }
        
        // 获取客户信息和风险评估信息
        List<AuditTaskDto> taskDtos = buildAuditTaskDtos(allTasks);
        
        return new AuditTaskResponse(auditorLevel, taskDtos);
    }
    
    private List<AuditTaskDto> buildAuditTaskDtos(List<AuditLog> auditLogs) {
        List<Long> customerIds = auditLogs.stream()
                .map(AuditLog::getCustomerId)
                .collect(Collectors.toList());
        
        // 批量获取客户信息
        List<CustomerInfo> customers = customerInfoRepository.findAllById(customerIds);
        Map<Long, CustomerInfo> customerMap = customers.stream()
                .collect(Collectors.toMap(CustomerInfo::getId, customer -> customer));
        
        // 批量获取风险评估信息
        List<RiskAssessment> riskAssessments = riskAssessmentRepository.findByCustomerIdIn(customerIds);
        Map<Long, RiskAssessment> riskMap = riskAssessments.stream()
                .collect(Collectors.toMap(RiskAssessment::getCustomerId, risk -> risk));
        
        // 构建任务DTO列表
        List<AuditTaskDto> taskDtos = new ArrayList<>();
        for (AuditLog auditLog : auditLogs) {
            CustomerInfo customer = customerMap.get(auditLog.getCustomerId());
            RiskAssessment risk = riskMap.get(auditLog.getCustomerId());
            
            if (customer != null && risk != null) {
                String riskTypeDescription = RiskType.fromScore(risk.getScore()).getDescription();
                AuditTaskDto taskDto = new AuditTaskDto(
                        auditLog.getId(),
                        auditLog.getCustomerId(),
                        customer.getName(),
                        customer.getPhone(),
                        auditLog.getStage(),
                        risk.getScore(),
                        riskTypeDescription,
                        auditLog.getCreatedAt(),
                        customer.getInvestAmount(),
                        auditLog.getAiAudit(),
                        customer.getEmail(),
                        customer.getOccupation(),
                        customer.getIdCard(),
                        risk.getAnnualIncome(),
                        risk.getInvestmentAmount(),
                        risk.getInvestmentExperience(),
                        risk.getMaxLoss(),
                        risk.getInvestmentTarget(),
                        risk.getInvestmentExpire()
                );
                taskDtos.add(taskDto);
            }
        }
        
        return taskDtos;
    }
    
    public List<AuditResultDto> getAuditHistory(Long auditId) {
        List<RiskAssessmentResult> results = riskAssessmentResultRepository.findByAuditIdOrderByStageAsc(auditId);
        
        return results.stream()
                .map(result -> new AuditResultDto(
                        result.getAuditId(),
                        result.getStage(),
                        result.getRiskScore(), 
                        result.getOpinion(),
                        result.getCreatedAt()))
                .collect(Collectors.toList());
    }
    
    public List<AuditResultDto> getAuditorHistory(Long auditorId) {
        List<RiskAssessmentResult> results = riskAssessmentResultRepository.findByAuditorIdOrderByCreatedAtDesc(auditorId);
        
        return results.stream()
                .map(result -> new AuditResultDto(
                        result.getAuditId(),
                        result.getStage(),
                        result.getRiskScore(), 
                        result.getOpinion(),
                        result.getCreatedAt()))
                .collect(Collectors.toList());
    }
    
}