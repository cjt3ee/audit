package com.audit.customer.service;

import com.audit.customer.dto.CustomerInfoDto;
import com.audit.customer.dto.CustomerQuestionnaireRequest;
import com.audit.customer.dto.RiskAssessmentDto;
import com.audit.customer.dto.UserAuditFormMessage;
import com.audit.customer.entity.AuditLog;
import com.audit.customer.entity.CustomerInfo;
import com.audit.customer.entity.RiskAssessment;
import com.audit.customer.exception.CustomerAlreadyExistsException;
import com.audit.customer.exception.CustomerAuditAlreadyExistsException;
import com.audit.customer.repository.AuditLogRepository;
import com.audit.customer.repository.CustomerInfoRepository;
import com.audit.customer.repository.RiskAssessmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.Period;
import java.util.HashMap;
import java.util.Map;

@Service
public class CustomerQuestionnaireService {

    @Autowired
    private CustomerInfoRepository customerInfoRepository;

    @Autowired
    private RiskAssessmentRepository riskAssessmentRepository;
    
    @Autowired
    private AuditLogRepository auditLogRepository;
    
    @Autowired
    private KafkaProducerService kafkaProducerService;

    @Transactional
    public Long createCustomerQuestionnaire(CustomerQuestionnaireRequest request) {
        CustomerInfoDto customerInfoDto = request.getCustomerInfo();
        
        // 检查客户是否已存在
        if (customerInfoRepository.existsByPhone(customerInfoDto.getPhone())) {
            throw new CustomerAlreadyExistsException("手机号已存在：" + customerInfoDto.getPhone());
        }
        
        if (customerInfoRepository.existsByIdCard(customerInfoDto.getIdCard())) {
            throw new CustomerAlreadyExistsException("身份证号已存在：" + customerInfoDto.getIdCard());
        }
        
        // 创建客户信息
        CustomerInfo customerInfo = convertToCustomerInfo(customerInfoDto);
        customerInfo = customerInfoRepository.save(customerInfo);
        
        // 检查该客户是否已有审核流程
        if (auditLogRepository.findByCustomerId(customerInfo.getId()).size() > 0) {
            throw new CustomerAuditAlreadyExistsException("客户已存在审核流程：" + customerInfo.getId());
        }
        
        // 创建风险评估
        RiskAssessment riskAssessment = convertToRiskAssessment(request.getRiskAssessment(), customerInfo.getId());
        riskAssessmentRepository.save(riskAssessment);
        
        // 创建审核日志记录，进入审核流程
        AuditLog auditLog = createAuditLog(customerInfo.getId());
        
        // 发送Kafka消息给AI处理
        sendKafkaMessage(auditLog.getId(), customerInfo, riskAssessment, request);
        
        return customerInfo.getId();
    }

    private CustomerInfo convertToCustomerInfo(CustomerInfoDto dto) {
        CustomerInfo entity = new CustomerInfo();
        entity.setName(dto.getName());
        entity.setPhone(dto.getPhone());
        entity.setIdCard(dto.getIdCard());
        entity.setEmail(dto.getEmail());
        entity.setOccupation(dto.getOccupation());
        entity.setInvestAmount(dto.getInvestAmount());
        return entity;
    }

    private RiskAssessment convertToRiskAssessment(RiskAssessmentDto dto, Long customerId) {
        RiskAssessment entity = new RiskAssessment();
        entity.setCustomerId(customerId);
        entity.setAnnualIncome(dto.getAnnualIncome());
        entity.setInvestmentAmount(dto.getInvestmentAmount());
        entity.setInvestmentExperience(dto.getInvestmentExperience());
        entity.setMaxLoss(dto.getMaxLoss());
        entity.setInvestmentTarget(dto.getInvestmentTarget());
        entity.setInvestmentExpire(dto.getInvestmentExpire());
        entity.setScore(dto.getScore());
        return entity;
    }
    
    private AuditLog createAuditLog(Long customerId) {
        AuditLog auditLog = new AuditLog();
        auditLog.setCustomerId(customerId);
        auditLog.setStatus(5); // 5等待AI结果
        auditLog.setStage(0);  // 0初级
        return auditLogRepository.save(auditLog);
    }
    
    private void sendKafkaMessage(Long auditLogId, CustomerInfo customerInfo, 
                                 RiskAssessment riskAssessment, CustomerQuestionnaireRequest request) {
        try {
            // 计算客户年龄（如果有生日信息可以计算，这里简化处理）
            Integer customerAge = calculateAge(customerInfo);
            
            // 构建问卷答案摘要
            Map<String, Object> questionnaireAnswers = new HashMap<>();
            questionnaireAnswers.put("investmentExperience", riskAssessment.getInvestmentExperience());
            questionnaireAnswers.put("investmentTarget", riskAssessment.getInvestmentTarget());
            questionnaireAnswers.put("investmentExpire", riskAssessment.getInvestmentExpire());
            
            // 确定投资者类型
            String investorType = determineInvestorType(riskAssessment.getScore());
            
            // 构建FormData（不包含敏感信息如姓名、身份证）
            UserAuditFormMessage.FormData formData = new UserAuditFormMessage.FormData(
                    riskAssessment.getScore(),
                    investorType,
                    riskAssessment.getInvestmentAmount().doubleValue(),
                    riskAssessment.getAnnualIncome(),
                    riskAssessment.getMaxLoss(),
                    questionnaireAnswers,
                    customerAge,
                    customerInfo.getOccupation()
            );
            
            // 构建完整消息
            UserAuditFormMessage message = new UserAuditFormMessage(
                    auditLogId,
                    customerInfo.getId(),
                    formData,
                    LocalDateTime.now()
            );
            
            // 异步发送消息
            kafkaProducerService.sendUserAuditFormMessage(message);
            
        } catch (Exception e) {
            throw new RuntimeException("Failed to send Kafka message for audit processing", e);
        }
    }
    
    private Integer calculateAge(CustomerInfo customerInfo) {
        // 这里简化处理，实际应该根据身份证或生日计算年龄
        // 返回一个默认年龄或null
        return null;
    }
    
    private String determineInvestorType(Integer score) {
        if (score <= 30) {
            return "保守型";
        } else if (score <= 60) {
            return "稳健型";
        } else {
            return "激进型";
        }
    }
}