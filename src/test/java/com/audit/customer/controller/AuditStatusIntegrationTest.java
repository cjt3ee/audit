package com.audit.customer.controller;

import com.audit.customer.entity.AuditLog;
import com.audit.customer.entity.RiskAssessmentResult;
import com.audit.customer.repository.AuditLogRepository;
import com.audit.customer.repository.RiskAssessmentResultRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureWebMvc
@ActiveProfiles("test")
@Transactional
class AuditStatusIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private RiskAssessmentResultRepository riskAssessmentResultRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private MockMvc mockMvc;
    private Long testCustomerId = 1001L;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
        cleanTestData();
    }

    @AfterEach
    void tearDown() {
        cleanTestData();
    }

    private void cleanTestData() {
        riskAssessmentResultRepository.deleteAll();
        auditLogRepository.deleteAll();
    }

    @Test
    void testGetAuditStatus_NotFound() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/customer/audit-status/{customerId}", testCustomerId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.customerId").value(testCustomerId))
                .andExpect(jsonPath("$.data.status").value("not_found"))
                .andExpect(jsonPath("$.data.message").value("未找到该客户的审核记录"));
    }

    @Test
    void testGetAuditStatus_InProgress() throws Exception {
        // Given
        AuditLog auditLog = createAuditLog(testCustomerId, 1, 0);
        auditLogRepository.save(auditLog);

        // When & Then
        mockMvc.perform(get("/api/customer/audit-status/{customerId}", testCustomerId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.customerId").value(testCustomerId))
                .andExpect(jsonPath("$.data.status").value("in_progress"))
                .andExpect(jsonPath("$.data.message").value("审核中，请等待审核完成"));
    }

    @Test
    void testGetAuditStatus_Completed() throws Exception {
        // Given
        AuditLog auditLog = createAuditLog(testCustomerId, 3, 2);
        auditLog = auditLogRepository.save(auditLog);

        RiskAssessmentResult result1 = createRiskAssessmentResult(auditLog.getId(), testCustomerId, 1, 75, "初级审核通过");
        RiskAssessmentResult result2 = createRiskAssessmentResult(auditLog.getId(), testCustomerId, 2, 80, "高级审核通过");
        
        riskAssessmentResultRepository.save(result1);
        riskAssessmentResultRepository.save(result2);

        // When & Then
        mockMvc.perform(get("/api/customer/audit-status/{customerId}", testCustomerId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.customerId").value(testCustomerId))
                .andExpect(jsonPath("$.data.status").value("completed"))
                .andExpect(jsonPath("$.data.message").value("审核已完成"))
                .andExpect(jsonPath("$.data.results").isArray())
                .andExpect(jsonPath("$.data.results.length()").value(2))
                .andExpect(jsonPath("$.data.results[0].stage").value(1))
                .andExpect(jsonPath("$.data.results[0].riskScore").value(75))
                .andExpect(jsonPath("$.data.results[0].opinion").value("初级审核通过"))
                .andExpect(jsonPath("$.data.results[1].stage").value(2))
                .andExpect(jsonPath("$.data.results[1].riskScore").value(80))
                .andExpect(jsonPath("$.data.results[1].opinion").value("高级审核通过"));
    }

    @Test
    void testGetAuditStatus_MultipleAuditsWithMixedStatus() throws Exception {
        // Given
        AuditLog inProgressAudit = createAuditLog(testCustomerId, 1, 0);
        AuditLog completedAudit = createAuditLog(testCustomerId, 3, 1);
        
        auditLogRepository.save(inProgressAudit);
        completedAudit = auditLogRepository.save(completedAudit);

        RiskAssessmentResult result = createRiskAssessmentResult(completedAudit.getId(), testCustomerId, 1, 70, "中级审核通过");
        riskAssessmentResultRepository.save(result);

        // When & Then - Should only return completed audit results
        mockMvc.perform(get("/api/customer/audit-status/{customerId}", testCustomerId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("completed"))
                .andExpect(jsonPath("$.data.results.length()").value(1));
    }

    private AuditLog createAuditLog(Long customerId, Integer status, Integer stage) {
        AuditLog auditLog = new AuditLog();
        auditLog.setCustomerId(customerId);
        auditLog.setStatus(status);
        auditLog.setStage(stage);
        auditLog.setCreatedAt(LocalDateTime.now());
        auditLog.setUpdatedAt(LocalDateTime.now());
        return auditLog;
    }

    private RiskAssessmentResult createRiskAssessmentResult(Long auditId, Long customerId, Integer stage, Integer riskScore, String opinion) {
        RiskAssessmentResult result = new RiskAssessmentResult();
        result.setAuditId(auditId);
        result.setCustomerId(customerId);
        result.setStage(stage);
        result.setRiskScore(riskScore);
        result.setOpinion(opinion);
        result.setCreatedAt(LocalDateTime.now());
        result.setUpdatedAt(LocalDateTime.now());
        return result;
    }
}