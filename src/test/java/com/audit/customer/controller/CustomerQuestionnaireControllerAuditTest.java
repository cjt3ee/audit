package com.audit.customer.controller;

import com.audit.customer.dto.CustomerInfoDto;
import com.audit.customer.dto.CustomerQuestionnaireRequest;
import com.audit.customer.dto.RiskAssessmentDto;
import com.audit.customer.exception.CustomerAuditAlreadyExistsException;
import com.audit.customer.service.AuditStatusService;
import com.audit.customer.service.CustomerQuestionnaireService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CustomerQuestionnaireController.class)
class CustomerQuestionnaireControllerAuditTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CustomerQuestionnaireService customerQuestionnaireService;

    @MockBean
    private AuditStatusService auditStatusService;

    @Autowired
    private ObjectMapper objectMapper;

    private CustomerQuestionnaireRequest validRequest;

    @BeforeEach
    void setUp() {
        CustomerInfoDto customerInfoDto = new CustomerInfoDto();
        customerInfoDto.setName("测试客户");
        customerInfoDto.setPhone("13800138000");
        customerInfoDto.setIdCard("110101199001011234");
        customerInfoDto.setEmail("test@example.com");
        customerInfoDto.setOccupation("软件工程师");
        customerInfoDto.setInvestAmount(new BigDecimal("100000"));

        RiskAssessmentDto riskAssessmentDto = new RiskAssessmentDto();
        riskAssessmentDto.setAnnualIncome(3);
        riskAssessmentDto.setInvestmentAmount(new BigDecimal("50000"));
        riskAssessmentDto.setInvestmentExperience("3年投资经验");
        riskAssessmentDto.setMaxLoss(2);
        riskAssessmentDto.setInvestmentTarget("稳健增值");
        riskAssessmentDto.setInvestmentExpire("1-3年");
        riskAssessmentDto.setScore(75);

        validRequest = new CustomerQuestionnaireRequest();
        validRequest.setCustomerInfo(customerInfoDto);
        validRequest.setRiskAssessment(riskAssessmentDto);
    }

    @Test
    void submitQuestionnaire_Success_ShouldCreateAuditLogAndReturnSuccess() throws Exception {
        // Given
        when(customerQuestionnaireService.createCustomerQuestionnaire(any(CustomerQuestionnaireRequest.class)))
                .thenReturn(1L);

        // When & Then
        mockMvc.perform(post("/api/customer/questionnaire")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("问卷提交成功"))
                .andExpect(jsonPath("$.data").value(1));
    }

    @Test
    void submitQuestionnaire_WhenCustomerAuditAlreadyExists_ShouldReturnConflict() throws Exception {
        // Given
        when(customerQuestionnaireService.createCustomerQuestionnaire(any(CustomerQuestionnaireRequest.class)))
                .thenThrow(new CustomerAuditAlreadyExistsException("客户已存在审核流程：1"));

        // When & Then
        mockMvc.perform(post("/api/customer/questionnaire")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("客户已存在审核流程：1"));
    }

    @Test
    void submitQuestionnaire_WhenServiceThrowsGenericException_ShouldReturnInternalServerError() throws Exception {
        // Given
        when(customerQuestionnaireService.createCustomerQuestionnaire(any(CustomerQuestionnaireRequest.class)))
                .thenThrow(new RuntimeException("Database connection failed"));

        // When & Then
        mockMvc.perform(post("/api/customer/questionnaire")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("服务器内部错误"));
    }

    @Test
    void submitQuestionnaire_WithInvalidRequestData_ShouldReturnBadRequest() throws Exception {
        // Given - Invalid request with missing required fields
        CustomerInfoDto invalidCustomerInfo = new CustomerInfoDto();
        // Missing required fields like name, phone, idCard
        
        CustomerQuestionnaireRequest invalidRequest = new CustomerQuestionnaireRequest();
        invalidRequest.setCustomerInfo(invalidCustomerInfo);

        // When & Then
        mockMvc.perform(post("/api/customer/questionnaire")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }
}