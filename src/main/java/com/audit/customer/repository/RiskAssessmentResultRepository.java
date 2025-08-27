package com.audit.customer.repository;

import com.audit.customer.entity.RiskAssessmentResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RiskAssessmentResultRepository extends JpaRepository<RiskAssessmentResult, Long> {
    
    List<RiskAssessmentResult> findByAuditId(Long auditId);
    
    List<RiskAssessmentResult> findByCustomerId(Long customerId);
    
    List<RiskAssessmentResult> findByAuditIdOrderByStageAsc(Long auditId);
}