package com.followmate.lead.repository;

import com.followmate.lead.entity.Lead;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LeadRepository extends JpaRepository<Lead, Long> {

    List<Lead> findByOrganizationId(Long organizationId);

    Optional<Lead> findByIdAndOrganizationId(Long id, Long organizationId);
}
