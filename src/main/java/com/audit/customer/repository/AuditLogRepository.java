package com.audit.customer.repository;

import com.audit.customer.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    
    List<AuditLog> findByCustomerId(Long customerId);
    
    List<AuditLog> findByCustomerIdAndStatus(Long customerId, Integer status);
}