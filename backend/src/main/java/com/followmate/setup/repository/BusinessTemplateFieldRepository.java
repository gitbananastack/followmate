package com.followmate.setup.repository;

import com.followmate.setup.entity.BusinessTemplateField;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BusinessTemplateFieldRepository extends JpaRepository<BusinessTemplateField, Long> {

    List<BusinessTemplateField> findByTemplateIdAndActiveTrueOrderByDisplayOrderAsc(Long templateId);
}
