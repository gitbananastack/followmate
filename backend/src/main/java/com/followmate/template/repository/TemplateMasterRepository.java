package com.followmate.template.repository;

import com.followmate.template.entity.TemplateMaster;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TemplateMasterRepository extends JpaRepository<TemplateMaster, Long> {

    List<TemplateMaster> findByOrganizationId(Long organizationId);

    Optional<TemplateMaster> findByIdAndOrganizationId(Long id, Long organizationId);
}
