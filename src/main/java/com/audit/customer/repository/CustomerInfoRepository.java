package com.audit.customer.repository;

import com.audit.customer.entity.CustomerInfo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CustomerInfoRepository extends JpaRepository<CustomerInfo, Long> {
    
    Optional<CustomerInfo> findByPhone(String phone);
    
    Optional<CustomerInfo> findByIdCard(String idCard);
    
    boolean existsByPhone(String phone);
    
    boolean existsByIdCard(String idCard);
}