package com.followmate.setup.service;

import com.followmate.security.AuthenticatedUserService;
import com.followmate.setup.dto.BusinessTemplateFieldResponse;
import com.followmate.setup.dto.BusinessTemplateResponse;
import com.followmate.setup.dto.BusinessTemplateStageResponse;
import com.followmate.setup.entity.BusinessTemplateField;
import com.followmate.setup.entity.BusinessTemplateMaster;
import com.followmate.setup.entity.BusinessTemplateStage;
import com.followmate.setup.repository.BusinessTemplateFieldRepository;
import com.followmate.setup.repository.BusinessTemplateMasterRepository;
import com.followmate.setup.repository.BusinessTemplateStageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BusinessTemplateService {

    private final BusinessTemplateMasterRepository businessTemplateMasterRepository;
    private final BusinessTemplateFieldRepository businessTemplateFieldRepository;
    private final BusinessTemplateStageRepository businessTemplateStageRepository;
    private final AuthenticatedUserService authenticatedUserService;

    public List<BusinessTemplateResponse> getBusinessTemplates(String businessType) {
        validateSuperAdmin();

        return businessTemplateMasterRepository.findAll()
                .stream()
                .filter(template -> Boolean.TRUE.equals(template.getActive()))
                .filter(template -> businessType == null
                        || businessType.isBlank()
                        || template.getBusinessType().equals(businessType))
                .sorted(Comparator.comparing(BusinessTemplateMaster::getTemplateName))
                .map(this::toSummaryResponse)
                .toList();
    }

    public BusinessTemplateResponse getBusinessTemplate(Long id) {
        validateSuperAdmin();
        BusinessTemplateMaster template = businessTemplateMasterRepository.findById(id)
                .filter(sourceTemplate -> Boolean.TRUE.equals(sourceTemplate.getActive()))
                .orElseThrow(() -> new RuntimeException("Business template not found or inactive"));
        return toResponse(template);
    }

    private void validateSuperAdmin() {
        if (!authenticatedUserService.isSuperAdmin(authenticatedUserService.getCurrentUser())) {
            throw new AccessDeniedException("Access denied");
        }
    }

    private BusinessTemplateResponse toSummaryResponse(BusinessTemplateMaster template) {
        return BusinessTemplateResponse.builder()
                .id(template.getId())
                .templateName(template.getTemplateName())
                .businessType(template.getBusinessType())
                .active(template.getActive())
                .createdAt(template.getCreatedAt())
                .updatedAt(template.getUpdatedAt())
                .fields(List.of())
                .stages(List.of())
                .leadFields(List.of())
                .pipelineStages(List.of())
                .build();
    }

    private BusinessTemplateResponse toResponse(BusinessTemplateMaster template) {
        List<BusinessTemplateFieldResponse> fields = businessTemplateFieldRepository
                .findByTemplateIdAndActiveTrueOrderByDisplayOrderAsc(template.getId())
                .stream()
                .map(this::toFieldResponse)
                .toList();
        List<BusinessTemplateStageResponse> stages = businessTemplateStageRepository
                .findByTemplateIdAndActiveTrueOrderByDisplayOrderAsc(template.getId())
                .stream()
                .map(this::toStageResponse)
                .toList();

        return BusinessTemplateResponse.builder()
                .id(template.getId())
                .templateName(template.getTemplateName())
                .businessType(template.getBusinessType())
                .active(template.getActive())
                .createdAt(template.getCreatedAt())
                .updatedAt(template.getUpdatedAt())
                .fields(fields)
                .stages(stages)
                .leadFields(fields)
                .pipelineStages(stages)
                .build();
    }

    private BusinessTemplateFieldResponse toFieldResponse(BusinessTemplateField field) {
        return BusinessTemplateFieldResponse.builder()
                .id(field.getId())
                .templateId(field.getTemplateId())
                .fieldName(field.getFieldName())
                .fieldLabel(field.getFieldLabel())
                .fieldType(field.getFieldType())
                .mandatory(field.getMandatory())
                .displayOrder(field.getDisplayOrder())
                .dropdownOptions(field.getDropdownOptions())
                .active(field.getActive())
                .build();
    }

    private BusinessTemplateStageResponse toStageResponse(BusinessTemplateStage stage) {
        return BusinessTemplateStageResponse.builder()
                .id(stage.getId())
                .templateId(stage.getTemplateId())
                .stageName(stage.getStageName())
                .displayOrder(stage.getDisplayOrder())
                .active(stage.getActive())
                .build();
    }
}
