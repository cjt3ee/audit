package com.audit.customer.repository;

import com.audit.customer.entity.RiskAssessment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RiskAssessmentRepository extends JpaRepository<RiskAssessment, Long> {
    
    List<RiskAssessment> findByCustomerId(Long customerId);
    
    Optional<RiskAssessment> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    
    List<RiskAssessment> findByCustomerIdIn(List<Long> customerIds);
}