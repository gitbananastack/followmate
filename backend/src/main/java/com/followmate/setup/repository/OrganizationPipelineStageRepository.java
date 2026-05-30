package com.followmate.setup.repository;

import com.followmate.setup.entity.OrganizationPipelineStage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrganizationPipelineStageRepository extends JpaRepository<OrganizationPipelineStage, Long> {

    List<OrganizationPipelineStage> findByOrganizationIdOrderByDisplayOrderAsc(Long organizationId);

    List<OrganizationPipelineStage> findByOrganizationIdAndActiveTrueOrderByDisplayOrderAsc(Long organizationId);

    void deleteByOrganizationId(Long organizationId);
}
