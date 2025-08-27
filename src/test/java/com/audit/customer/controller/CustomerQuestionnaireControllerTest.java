package com.audit.customer.controller;

import com.audit.customer.dto.AuditResultDto;
import com.audit.customer.dto.AuditStatusResponse;
import com.audit.customer.service.AuditStatusService;
import com.audit.customer.service.CustomerQuestionnaireService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Arrays;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CustomerQuestionnaireController.class)
class CustomerQuestionnaireControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CustomerQuestionnaireService customerQuestionnaireService;

    @MockBean
    private AuditStatusService auditStatusService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void getAuditStatus_WhenCustomerNotFound_ShouldReturnNotFoundResponse() throws Exception {
        // Given
        Long customerId = 999L;
        AuditStatusResponse response = new AuditStatusResponse(customerId, "not_found", "未找到该客户的审核记录");
        
        when(auditStatusService.getAuditStatus(customerId)).thenReturn(response);

        // When & Then
        mockMvc.perform(get("/api/customer/audit-status/{customerId}", customerId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("查询成功"))
                .andExpect(jsonPath("$.data.customerId").value(999))
                .andExpect(jsonPath("$.data.status").value("not_found"))
                .andExpect(jsonPath("$.data.message").value("未找到该客户的审核记录"))
                .andExpect(jsonPath("$.data.results").doesNotExist());
    }

    @Test
    void getAuditStatus_WhenAuditInProgress_ShouldReturnInProgressResponse() throws Exception {
        // Given
        Long customerId = 1L;
        AuditStatusResponse response = new AuditStatusResponse(customerId, "in_progress", "审核中，请等待审核完成");
        
        when(auditStatusService.getAuditStatus(customerId)).thenReturn(response);

        // When & Then
        mockMvc.perform(get("/api/customer/audit-status/{customerId}", customerId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("查询成功"))
                .andExpect(jsonPath("$.data.customerId").value(1))
                .andExpect(jsonPath("$.data.status").value("in_progress"))
                .andExpect(jsonPath("$.data.message").value("审核中，请等待审核完成"))
                .andExpect(jsonPath("$.data.results").doesNotExist());
    }

    @Test
    void getAuditStatus_WhenAuditCompleted_ShouldReturnCompletedResponseWithResults() throws Exception {
        // Given
        Long customerId = 1L;
        
        AuditResultDto result1 = new AuditResultDto(1, 75, "中级审核通过", LocalDateTime.of(2023, 12, 1, 10, 0));
        AuditResultDto result2 = new AuditResultDto(2, 80, "高级审核通过", LocalDateTime.of(2023, 12, 2, 11, 0));
        
        AuditStatusResponse response = new AuditStatusResponse(
                customerId, 
                "completed", 
                "审核已完成", 
                Arrays.asList(result1, result2)
        );
        
        when(auditStatusService.getAuditStatus(customerId)).thenReturn(response);

        // When & Then
        mockMvc.perform(get("/api/customer/audit-status/{customerId}", customerId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("查询成功"))
                .andExpect(jsonPath("$.data.customerId").value(1))
                .andExpect(jsonPath("$.data.status").value("completed"))
                .andExpect(jsonPath("$.data.message").value("审核已完成"))
                .andExpect(jsonPath("$.data.results").isArray())
                .andExpect(jsonPath("$.data.results.length()").value(2))
                .andExpect(jsonPath("$.data.results[0].stage").value(1))
                .andExpect(jsonPath("$.data.results[0].riskScore").value(75))
                .andExpect(jsonPath("$.data.results[0].opinion").value("中级审核通过"))
                .andExpect(jsonPath("$.data.results[1].stage").value(2))
                .andExpect(jsonPath("$.data.results[1].riskScore").value(80))
                .andExpect(jsonPath("$.data.results[1].opinion").value("高级审核通过"));
    }

    @Test
    void getAuditStatus_WhenServiceThrowsException_ShouldReturnInternalServerError() throws Exception {
        // Given
        Long customerId = 1L;
        when(auditStatusService.getAuditStatus(customerId))
                .thenThrow(new RuntimeException("Database connection error"));

        // When & Then
        mockMvc.perform(get("/api/customer/audit-status/{customerId}", customerId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("服务器内部错误"));
    }

    @Test
    void getAuditStatus_WithInvalidCustomerId_ShouldReturnBadRequest() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/customer/audit-status/{customerId}", "invalid")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getAuditStatus_WithNegativeCustomerId_ShouldCallServiceWithNegativeId() throws Exception {
        // Given
        Long customerId = -1L;
        AuditStatusResponse response = new AuditStatusResponse(customerId, "not_found", "未找到该客户的审核记录");
        
        when(auditStatusService.getAuditStatus(customerId)).thenReturn(response);

        // When & Then
        mockMvc.perform(get("/api/customer/audit-status/{customerId}", customerId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.customerId").value(-1));
    }
}