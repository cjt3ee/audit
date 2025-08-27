package com.audit.customer.service;

import com.audit.customer.dto.AuditResultDto;
import com.audit.customer.dto.AuditStatusResponse;
import com.audit.customer.entity.AuditLog;
import com.audit.customer.entity.RiskAssessmentResult;
import com.audit.customer.repository.AuditLogRepository;
import com.audit.customer.repository.RiskAssessmentResultRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuditStatusServiceTest {

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private RiskAssessmentResultRepository riskAssessmentResultRepository;

    @InjectMocks
    private AuditStatusService auditStatusService;

    private Long customerId;
    private AuditLog auditLog;
    private RiskAssessmentResult riskResult1;
    private RiskAssessmentResult riskResult2;

    @BeforeEach
    void setUp() {
        customerId = 1L;
        
        auditLog = new AuditLog();
        auditLog.setId(1L);
        auditLog.setCustomerId(customerId);
        auditLog.setStatus(3);
        auditLog.setStage(2);
        auditLog.setCreatedAt(LocalDateTime.now());
        auditLog.setUpdatedAt(LocalDateTime.now());

        riskResult1 = new RiskAssessmentResult();
        riskResult1.setId(1L);
        riskResult1.setAuditId(1L);
        riskResult1.setStage(1);
        riskResult1.setCustomerId(customerId);
        riskResult1.setRiskScore(75);
        riskResult1.setOpinion("中级审核意见");
        riskResult1.setCreatedAt(LocalDateTime.now());

        riskResult2 = new RiskAssessmentResult();
        riskResult2.setId(2L);
        riskResult2.setAuditId(1L);
        riskResult2.setStage(2);
        riskResult2.setCustomerId(customerId);
        riskResult2.setRiskScore(80);
        riskResult2.setOpinion("高级审核意见");
        riskResult2.setCreatedAt(LocalDateTime.now());
    }

    @Test
    void getAuditStatus_WhenNoAuditLogsFound_ShouldReturnNotFound() {
        // Given
        when(auditLogRepository.findByCustomerId(customerId)).thenReturn(Collections.emptyList());

        // When
        AuditStatusResponse response = auditStatusService.getAuditStatus(customerId);

        // Then
        assertNotNull(response);
        assertEquals(customerId, response.getCustomerId());
        assertEquals("not_found", response.getStatus());
        assertEquals("未找到该客户的审核记录", response.getMessage());
        assertNull(response.getResults());
    }

    @Test
    void getAuditStatus_WhenAuditInProgress_ShouldReturnInProgress() {
        // Given
        AuditLog inProgressAudit = new AuditLog();
        inProgressAudit.setId(1L);
        inProgressAudit.setCustomerId(customerId);
        inProgressAudit.setStatus(1); // 已分配未完成
        inProgressAudit.setStage(1);

        when(auditLogRepository.findByCustomerId(customerId))
                .thenReturn(Arrays.asList(inProgressAudit));

        // When
        AuditStatusResponse response = auditStatusService.getAuditStatus(customerId);

        // Then
        assertNotNull(response);
        assertEquals(customerId, response.getCustomerId());
        assertEquals("in_progress", response.getStatus());
        assertEquals("审核中，请等待审核完成", response.getMessage());
        assertNull(response.getResults());
    }

    @Test
    void getAuditStatus_WhenAuditCompleted_ShouldReturnResults() {
        // Given
        when(auditLogRepository.findByCustomerId(customerId))
                .thenReturn(Arrays.asList(auditLog));
        when(riskAssessmentResultRepository.findByAuditIdOrderByStageAsc(1L))
                .thenReturn(Arrays.asList(riskResult1, riskResult2));

        // When
        AuditStatusResponse response = auditStatusService.getAuditStatus(customerId);

        // Then
        assertNotNull(response);
        assertEquals(customerId, response.getCustomerId());
        assertEquals("completed", response.getStatus());
        assertEquals("审核已完成", response.getMessage());
        assertNotNull(response.getResults());
        assertEquals(2, response.getResults().size());

        AuditResultDto result1 = response.getResults().get(0);
        assertEquals(Integer.valueOf(1), result1.getStage());
        assertEquals(Integer.valueOf(75), result1.getRiskScore());
        assertEquals("中级审核意见", result1.getOpinion());

        AuditResultDto result2 = response.getResults().get(1);
        assertEquals(Integer.valueOf(2), result2.getStage());
        assertEquals(Integer.valueOf(80), result2.getRiskScore());
        assertEquals("高级审核意见", result2.getOpinion());
    }

    @Test
    void getAuditStatus_WhenMultipleAuditsWithDifferentStatus_ShouldOnlyReturnCompletedResults() {
        // Given
        AuditLog inProgressAudit = new AuditLog();
        inProgressAudit.setId(2L);
        inProgressAudit.setCustomerId(customerId);
        inProgressAudit.setStatus(1); // 进行中
        inProgressAudit.setStage(0);

        List<AuditLog> auditLogs = Arrays.asList(auditLog, inProgressAudit);
        when(auditLogRepository.findByCustomerId(customerId)).thenReturn(auditLogs);
        when(riskAssessmentResultRepository.findByAuditIdOrderByStageAsc(1L))
                .thenReturn(Arrays.asList(riskResult1, riskResult2));

        // When
        AuditStatusResponse response = auditStatusService.getAuditStatus(customerId);

        // Then
        assertNotNull(response);
        assertEquals("completed", response.getStatus());
        assertEquals(2, response.getResults().size());
        
        // Verify only completed audit results are returned
        verify(riskAssessmentResultRepository, times(1)).findByAuditIdOrderByStageAsc(1L);
        verify(riskAssessmentResultRepository, never()).findByAuditIdOrderByStageAsc(2L);
    }

    @Test
    void getAuditStatus_WhenMultipleCompletedAudits_ShouldReturnAllResults() {
        // Given
        AuditLog completedAudit2 = new AuditLog();
        completedAudit2.setId(2L);
        completedAudit2.setCustomerId(customerId);
        completedAudit2.setStatus(3); // 终审完成
        completedAudit2.setStage(3);

        RiskAssessmentResult riskResult3 = new RiskAssessmentResult();
        riskResult3.setId(3L);
        riskResult3.setAuditId(2L);
        riskResult3.setStage(3);
        riskResult3.setCustomerId(customerId);
        riskResult3.setRiskScore(85);
        riskResult3.setOpinion("委员会审核意见");
        riskResult3.setCreatedAt(LocalDateTime.now());

        List<AuditLog> auditLogs = Arrays.asList(auditLog, completedAudit2);
        when(auditLogRepository.findByCustomerId(customerId)).thenReturn(auditLogs);
        when(riskAssessmentResultRepository.findByAuditIdOrderByStageAsc(1L))
                .thenReturn(Arrays.asList(riskResult1, riskResult2));
        when(riskAssessmentResultRepository.findByAuditIdOrderByStageAsc(2L))
                .thenReturn(Arrays.asList(riskResult3));

        // When
        AuditStatusResponse response = auditStatusService.getAuditStatus(customerId);

        // Then
        assertNotNull(response);
        assertEquals("completed", response.getStatus());
        assertEquals(3, response.getResults().size()); // All results from both audits
    }
}