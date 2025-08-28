package com.audit.customer.service;

import com.audit.customer.dto.CustomerInfoDto;
import com.audit.customer.dto.CustomerQuestionnaireRequest;
import com.audit.customer.dto.RiskAssessmentDto;
import com.audit.customer.entity.AuditLog;
import com.audit.customer.entity.CustomerInfo;
import com.audit.customer.entity.RiskAssessment;
import com.audit.customer.exception.CustomerAlreadyExistsException;
import com.audit.customer.exception.CustomerAuditAlreadyExistsException;
import com.audit.customer.repository.AuditLogRepository;
import com.audit.customer.repository.CustomerInfoRepository;
import com.audit.customer.repository.RiskAssessmentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomerQuestionnaireServiceAuditTest {

    @Mock
    private CustomerInfoRepository customerInfoRepository;

    @Mock
    private RiskAssessmentRepository riskAssessmentRepository;

    @Mock
    private AuditLogRepository auditLogRepository;

    @InjectMocks
    private CustomerQuestionnaireService customerQuestionnaireService;

    private CustomerQuestionnaireRequest request;
    private CustomerInfoDto customerInfoDto;
    private RiskAssessmentDto riskAssessmentDto;

    @BeforeEach
    void setUp() {
        customerInfoDto = new CustomerInfoDto();
        customerInfoDto.setName("测试客户");
        customerInfoDto.setPhone("13800138000");
        customerInfoDto.setIdCard("110101199001011234");
        customerInfoDto.setEmail("test@example.com");
        customerInfoDto.setOccupation("软件工程师");
        customerInfoDto.setInvestAmount(new BigDecimal("100000"));

        riskAssessmentDto = new RiskAssessmentDto();
        riskAssessmentDto.setAnnualIncome(3);
        riskAssessmentDto.setInvestmentAmount(new BigDecimal("50000"));
        riskAssessmentDto.setInvestmentExperience("3年投资经验");
        riskAssessmentDto.setMaxLoss(2);
        riskAssessmentDto.setInvestmentTarget("稳健增值");
        riskAssessmentDto.setInvestmentExpire("1-3年");
        riskAssessmentDto.setScore(75);

        request = new CustomerQuestionnaireRequest();
        request.setCustomerInfo(customerInfoDto);
        request.setRiskAssessment(riskAssessmentDto);
    }

    @Test
    void createCustomerQuestionnaire_Success_ShouldCreateAuditLog() {
        // Given
        CustomerInfo savedCustomer = new CustomerInfo();
        savedCustomer.setId(1L);
        savedCustomer.setName("测试客户");
        
        when(customerInfoRepository.existsByPhone(anyString())).thenReturn(false);
        when(customerInfoRepository.existsByIdCard(anyString())).thenReturn(false);
        when(customerInfoRepository.save(any(CustomerInfo.class))).thenReturn(savedCustomer);
        when(auditLogRepository.findByCustomerId(1L)).thenReturn(new ArrayList<>());
        when(riskAssessmentRepository.save(any(RiskAssessment.class))).thenReturn(new RiskAssessment());
        when(auditLogRepository.save(any(AuditLog.class))).thenReturn(new AuditLog());

        // When
        Long customerId = customerQuestionnaireService.createCustomerQuestionnaire(request);

        // Then
        assertEquals(1L, customerId);
        
        // Verify audit log creation
        ArgumentCaptor<AuditLog> auditLogCaptor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository, times(1)).save(auditLogCaptor.capture());
        
        AuditLog capturedAuditLog = auditLogCaptor.getValue();
        assertEquals(1L, capturedAuditLog.getCustomerId());
        assertEquals(Integer.valueOf(0), capturedAuditLog.getStatus());
        assertEquals(Integer.valueOf(0), capturedAuditLog.getStage());
    }

    @Test
    void createCustomerQuestionnaire_WhenPhoneExists_ShouldThrowCustomerAlreadyExistsException() {
        // Given
        when(customerInfoRepository.existsByPhone("13800138000")).thenReturn(true);

        // When & Then
        assertThrows(CustomerAlreadyExistsException.class, () -> {
            customerQuestionnaireService.createCustomerQuestionnaire(request);
        });
        
        // Verify no audit log is created
        verify(auditLogRepository, never()).save(any(AuditLog.class));
    }

    @Test
    void createCustomerQuestionnaire_WhenIdCardExists_ShouldThrowCustomerAlreadyExistsException() {
        // Given
        when(customerInfoRepository.existsByPhone(anyString())).thenReturn(false);
        when(customerInfoRepository.existsByIdCard("110101199001011234")).thenReturn(true);

        // When & Then
        assertThrows(CustomerAlreadyExistsException.class, () -> {
            customerQuestionnaireService.createCustomerQuestionnaire(request);
        });
        
        // Verify no audit log is created
        verify(auditLogRepository, never()).save(any(AuditLog.class));
    }

    @Test
    void createCustomerQuestionnaire_WhenAuditLogExists_ShouldThrowCustomerAuditAlreadyExistsException() {
        // Given
        CustomerInfo savedCustomer = new CustomerInfo();
        savedCustomer.setId(1L);
        
        AuditLog existingAuditLog = new AuditLog();
        existingAuditLog.setId(1L);
        existingAuditLog.setCustomerId(1L);
        
        when(customerInfoRepository.existsByPhone(anyString())).thenReturn(false);
        when(customerInfoRepository.existsByIdCard(anyString())).thenReturn(false);
        when(customerInfoRepository.save(any(CustomerInfo.class))).thenReturn(savedCustomer);
        when(auditLogRepository.findByCustomerId(1L)).thenReturn(Arrays.asList(existingAuditLog));

        // When & Then
        assertThrows(CustomerAuditAlreadyExistsException.class, () -> {
            customerQuestionnaireService.createCustomerQuestionnaire(request);
        });
        
        // Verify existing audit log check was called
        verify(auditLogRepository, times(1)).findByCustomerId(1L);
        // Verify no new audit log is created
        verify(auditLogRepository, never()).save(any(AuditLog.class));
    }

    @Test
    void createCustomerQuestionnaire_TransactionRollback_WhenAuditLogCreationFails() {
        // Given
        CustomerInfo savedCustomer = new CustomerInfo();
        savedCustomer.setId(1L);
        
        when(customerInfoRepository.existsByPhone(anyString())).thenReturn(false);
        when(customerInfoRepository.existsByIdCard(anyString())).thenReturn(false);
        when(customerInfoRepository.save(any(CustomerInfo.class))).thenReturn(savedCustomer);
        when(auditLogRepository.findByCustomerId(1L)).thenReturn(new ArrayList<>());
        when(riskAssessmentRepository.save(any(RiskAssessment.class))).thenReturn(new RiskAssessment());
        when(auditLogRepository.save(any(AuditLog.class))).thenThrow(new RuntimeException("Database error"));

        // When & Then
        assertThrows(RuntimeException.class, () -> {
            customerQuestionnaireService.createCustomerQuestionnaire(request);
        });
        
        // Verify all saves were attempted
        verify(customerInfoRepository, times(1)).save(any(CustomerInfo.class));
        verify(riskAssessmentRepository, times(1)).save(any(RiskAssessment.class));
        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }

    @Test
    void createCustomerQuestionnaire_VerifyCorrectDataMapping() {
        // Given
        CustomerInfo savedCustomer = new CustomerInfo();
        savedCustomer.setId(2L);
        
        when(customerInfoRepository.existsByPhone(anyString())).thenReturn(false);
        when(customerInfoRepository.existsByIdCard(anyString())).thenReturn(false);
        when(customerInfoRepository.save(any(CustomerInfo.class))).thenReturn(savedCustomer);
        when(auditLogRepository.findByCustomerId(2L)).thenReturn(new ArrayList<>());
        when(riskAssessmentRepository.save(any(RiskAssessment.class))).thenReturn(new RiskAssessment());
        when(auditLogRepository.save(any(AuditLog.class))).thenReturn(new AuditLog());

        // When
        customerQuestionnaireService.createCustomerQuestionnaire(request);

        // Then
        ArgumentCaptor<CustomerInfo> customerCaptor = ArgumentCaptor.forClass(CustomerInfo.class);
        verify(customerInfoRepository, times(1)).save(customerCaptor.capture());
        
        CustomerInfo capturedCustomer = customerCaptor.getValue();
        assertEquals("测试客户", capturedCustomer.getName());
        assertEquals("13800138000", capturedCustomer.getPhone());
        assertEquals("110101199001011234", capturedCustomer.getIdCard());
        
        ArgumentCaptor<RiskAssessment> riskCaptor = ArgumentCaptor.forClass(RiskAssessment.class);
        verify(riskAssessmentRepository, times(1)).save(riskCaptor.capture());
        
        RiskAssessment capturedRisk = riskCaptor.getValue();
        assertEquals(2L, capturedRisk.getCustomerId());
        assertEquals(Integer.valueOf(75), capturedRisk.getScore());
        assertEquals(Integer.valueOf(3), capturedRisk.getAnnualIncome());
    }
}