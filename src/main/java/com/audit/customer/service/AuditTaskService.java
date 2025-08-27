package com.audit.customer.service;

import com.audit.customer.dto.AuditTaskDto;
import com.audit.customer.dto.AuditTaskResponse;
import com.audit.customer.entity.AuditLog;
import com.audit.customer.entity.CustomerInfo;
import com.audit.customer.entity.RiskAssessment;
import com.audit.customer.enums.RiskType;
import com.audit.customer.repository.AuditLogRepository;
import com.audit.customer.repository.CustomerInfoRepository;
import com.audit.customer.repository.RiskAssessmentRepository;
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
    
    @Autowired
    private AuditLogRepository auditLogRepository;
    
    @Autowired
    private CustomerInfoRepository customerInfoRepository;
    
    @Autowired
    private RiskAssessmentRepository riskAssessmentRepository;
    
    @Value("${audit.task.max-batch-size:10}")
    private int maxBatchSize;
    
    @Transactional
    public AuditTaskResponse assignTasksToAuditor(Integer auditorLevel) {
        // 验证审核员等级
        if (auditorLevel < 0 || auditorLevel > 3) {
            throw new IllegalArgumentException("审核员等级必须在0-3之间");
        }
        
        // 获取待分配的任务
        Pageable pageable = PageRequest.of(0, maxBatchSize);
        List<AuditLog> availableTasks = auditLogRepository.findByStageAndStatusOrderByCreatedAtAsc(
                auditorLevel, 0, pageable);
        
        if (availableTasks.isEmpty()) {
            return new AuditTaskResponse(auditorLevel, new ArrayList<>());
        }
        
        // 提取audit_log的ID列表
        List<Long> auditIds = availableTasks.stream()
                .map(AuditLog::getId)
                .collect(Collectors.toList());
        
        // 原子性更新状态：0未分配 -> 1已分配未完成
        int updatedCount = auditLogRepository.updateStatusByIds(auditIds, 1, 0);
        
        // 如果更新的数量不匹配，说明有并发冲突，重新获取实际更新的记录
        List<AuditLog> assignedTasks;
        if (updatedCount != availableTasks.size()) {
            // 重新查询已经被分配的任务
            assignedTasks = auditLogRepository.findAllById(auditIds).stream()
                    .filter(audit -> audit.getStatus() == 1)
                    .collect(Collectors.toList());
        } else {
            assignedTasks = availableTasks;
        }
        
        if (assignedTasks.isEmpty()) {
            return new AuditTaskResponse(auditorLevel, new ArrayList<>());
        }
        
        // 获取客户信息和风险评估信息
        List<AuditTaskDto> taskDtos = buildAuditTaskDtos(assignedTasks);
        
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
                        auditLog.getCreatedAt()
                );
                taskDtos.add(taskDto);
            }
        }
        
        return taskDtos;
    }
}