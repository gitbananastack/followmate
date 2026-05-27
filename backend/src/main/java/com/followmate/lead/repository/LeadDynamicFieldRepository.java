package com.followmate.lead.repository;

import com.followmate.lead.entity.LeadDynamicField;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LeadDynamicFieldRepository extends JpaRepository<LeadDynamicField, Long> {

    List<LeadDynamicField> findByLeadId(Long leadId);
}
