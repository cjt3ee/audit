package com.audit.customer.repository;

import com.audit.customer.entity.Auditor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AuditorRepository extends JpaRepository<Auditor, Long> {
    Optional<Auditor> findByAccount(String account);
    boolean existsByAccount(String account);
}