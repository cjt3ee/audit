package com.audit.customer.repository;

import com.audit.customer.entity.AuditLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    
    List<AuditLog> findByCustomerId(Long customerId);
    
    List<AuditLog> findByCustomerIdAndStatus(Long customerId, Integer status);
    
    List<AuditLog> findByStageAndStatus(Integer stage, Integer status);
    
    @Query("SELECT al FROM AuditLog al WHERE al.stage = :stage AND al.status = :status ORDER BY al.createdAt ASC")
    List<AuditLog> findByStageAndStatusOrderByCreatedAtAsc(@Param("stage") Integer stage, 
                                                           @Param("status") Integer status, 
                                                           Pageable pageable);
    
    @Modifying
    @Query("UPDATE AuditLog al SET al.status = :newStatus WHERE al.id IN :auditIds AND al.status = :oldStatus")
    int updateStatusByIds(@Param("auditIds") List<Long> auditIds, 
                          @Param("newStatus") Integer newStatus, 
                          @Param("oldStatus") Integer oldStatus);
}