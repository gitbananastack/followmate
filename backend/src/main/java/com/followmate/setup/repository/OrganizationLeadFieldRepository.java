package com.followmate.setup.repository;

import com.followmate.setup.entity.OrganizationLeadField;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrganizationLeadFieldRepository extends JpaRepository<OrganizationLeadField, Long> {

    List<OrganizationLeadField> findByOrganizationIdOrderByDisplayOrderAsc(Long organizationId);

    List<OrganizationLeadField> findByOrganizationIdAndActiveTrueOrderByDisplayOrderAsc(Long organizationId);

    void deleteByOrganizationId(Long organizationId);
}
