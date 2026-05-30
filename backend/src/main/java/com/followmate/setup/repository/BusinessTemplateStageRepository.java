package com.followmate.setup.repository;

import com.followmate.setup.entity.BusinessTemplateStage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BusinessTemplateStageRepository extends JpaRepository<BusinessTemplateStage, Long> {

    List<BusinessTemplateStage> findByTemplateIdAndActiveTrueOrderByDisplayOrderAsc(Long templateId);
}
