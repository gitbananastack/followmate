package com.followmate.template.repository;

import com.followmate.template.entity.TemplateField;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TemplateFieldRepository extends JpaRepository<TemplateField, Long> {

    List<TemplateField> findByTemplateIdOrderByDisplayOrderAsc(Long templateId);

    void deleteByTemplateId(Long templateId);

    List<TemplateField> findByTemplateIdAndActiveTrueOrderByDisplayOrderAsc(Long templateId);
}
