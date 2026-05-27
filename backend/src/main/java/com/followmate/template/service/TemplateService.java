package com.followmate.template.service;

import com.followmate.template.dto.TemplateFieldRequest;
import com.followmate.template.dto.TemplateFieldResponse;
import com.followmate.template.dto.TemplateRequest;
import com.followmate.template.dto.TemplateResponse;
import com.followmate.template.entity.TemplateField;
import com.followmate.template.entity.TemplateMaster;
import com.followmate.template.repository.TemplateFieldRepository;
import com.followmate.template.repository.TemplateMasterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TemplateService {

    private final TemplateMasterRepository templateMasterRepository;
    private final TemplateFieldRepository templateFieldRepository;

    public TemplateResponse createTemplate(TemplateRequest request) {
        TemplateMaster template = TemplateMaster.builder()
                .templateName(request.getTemplateName())
                .businessType(request.getBusinessType())
                .active(request.getActive())
                .build();

        return toResponse(templateMasterRepository.save(template));
    }

    public TemplateFieldResponse addFieldToTemplate(Long id, TemplateFieldRequest request) {
        TemplateMaster template = findTemplateById(id);
        TemplateField field = TemplateField.builder()
                .templateId(template.getId())
                .fieldName(request.getFieldName())
                .fieldLabel(request.getFieldLabel())
                .fieldType(request.getFieldType())
                .mandatory(request.getMandatory())
                .displayOrder(request.getDisplayOrder())
                .build();

        return toFieldResponse(templateFieldRepository.save(field));
    }

    public TemplateResponse getTemplate(Long id) {
        return toResponse(findTemplateById(id));
    }

    public List<TemplateResponse> getAllTemplates() {
        return templateMasterRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void deleteTemplate(Long id) {
        TemplateMaster template = findTemplateById(id);
        templateFieldRepository.deleteByTemplateId(template.getId());
        templateMasterRepository.delete(template);
    }

    private TemplateMaster findTemplateById(Long id) {
        return templateMasterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Template not found with id: " + id));
    }

    private TemplateResponse toResponse(TemplateMaster template) {
        List<TemplateFieldResponse> fields = templateFieldRepository
                .findByTemplateIdOrderByDisplayOrderAsc(template.getId())
                .stream()
                .map(this::toFieldResponse)
                .toList();

        return TemplateResponse.builder()
                .id(template.getId())
                .templateName(template.getTemplateName())
                .businessType(template.getBusinessType())
                .active(template.getActive())
                .createdAt(template.getCreatedAt())
                .updatedAt(template.getUpdatedAt())
                .fields(fields)
                .build();
    }

    private TemplateFieldResponse toFieldResponse(TemplateField field) {
        return TemplateFieldResponse.builder()
                .id(field.getId())
                .templateId(field.getTemplateId())
                .fieldName(field.getFieldName())
                .fieldLabel(field.getFieldLabel())
                .fieldType(field.getFieldType())
                .mandatory(field.getMandatory())
                .displayOrder(field.getDisplayOrder())
                .build();
    }
}
