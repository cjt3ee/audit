package com.audit.customer.service;

import com.audit.customer.dto.CustomerInfoDto;
import com.audit.customer.dto.CustomerQuestionnaireRequest;
import com.audit.customer.dto.RiskAssessmentDto;
import com.audit.customer.entity.CustomerInfo;
import com.audit.customer.entity.RiskAssessment;
import com.audit.customer.exception.CustomerAlreadyExistsException;
import com.audit.customer.repository.CustomerInfoRepository;
import com.audit.customer.repository.RiskAssessmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CustomerQuestionnaireService {

    @Autowired
    private CustomerInfoRepository customerInfoRepository;

    @Autowired
    private RiskAssessmentRepository riskAssessmentRepository;

    @Transactional
    public Long createCustomerQuestionnaire(CustomerQuestionnaireRequest request) {
        CustomerInfoDto customerInfoDto = request.getCustomerInfo();
        
        if (customerInfoRepository.existsByPhone(customerInfoDto.getPhone())) {
            throw new CustomerAlreadyExistsException("手机号已存在：" + customerInfoDto.getPhone());
        }
        
        if (customerInfoRepository.existsByIdCard(customerInfoDto.getIdCard())) {
            throw new CustomerAlreadyExistsException("身份证号已存在：" + customerInfoDto.getIdCard());
        }
        
        CustomerInfo customerInfo = convertToCustomerInfo(customerInfoDto);
        customerInfo = customerInfoRepository.save(customerInfo);
        
        RiskAssessment riskAssessment = convertToRiskAssessment(request.getRiskAssessment(), customerInfo.getId());
        riskAssessmentRepository.save(riskAssessment);
        
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
}