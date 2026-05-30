package com.followmate.template.service;

import com.followmate.auth.entity.User;
import com.followmate.security.AuthenticatedUserService;
import com.followmate.template.dto.TemplateFieldRequest;
import com.followmate.template.dto.TemplateFieldResponse;
import com.followmate.template.dto.TemplateRequest;
import com.followmate.template.dto.TemplateResponse;
import com.followmate.template.entity.TemplateField;
import com.followmate.template.entity.TemplateMaster;
import com.followmate.template.repository.TemplateFieldRepository;
import com.followmate.template.repository.TemplateMasterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TemplateService {

    private final TemplateMasterRepository templateMasterRepository;
    private final TemplateFieldRepository templateFieldRepository;
    private final AuthenticatedUserService authenticatedUserService;

    public TemplateResponse createTemplate(TemplateRequest request) {
        User currentUser = authenticatedUserService.getCurrentUser();
        validateCanManageTemplates(currentUser);

        TemplateMaster template = TemplateMaster.builder()
                .organizationId(resolveOrganizationId(currentUser, request.getOrganizationId()))
                .templateName(request.getTemplateName())
                .businessType(request.getBusinessType())
                .active(request.getActive() == null ? true : request.getActive())
                .build();

        return toResponse(templateMasterRepository.save(template));
    }

    public TemplateFieldResponse addFieldToTemplate(Long id, TemplateFieldRequest request) {
        validateCanManageTemplates(authenticatedUserService.getCurrentUser());
        TemplateMaster template = findAccessibleTemplateById(id);
        TemplateField field = TemplateField.builder()
                .templateId(template.getId())
                .fieldName(request.getFieldName())
                .fieldLabel(request.getFieldLabel())
                .fieldType(normalizeFieldType(request.getFieldType()))
                .mandatory(request.getMandatory())
                .displayOrder(request.getDisplayOrder())
                .dropdownOptions(request.getDropdownOptions())
                .active(true)
                .build();

        return toFieldResponse(templateFieldRepository.save(field));
    }

    public TemplateFieldResponse updateTemplateField(Long fieldId, TemplateFieldRequest request) {
        validateCanManageTemplates(authenticatedUserService.getCurrentUser());
        TemplateField field = findAccessibleFieldById(fieldId);
        field.setFieldName(request.getFieldName());
        field.setFieldLabel(request.getFieldLabel());
        field.setFieldType(normalizeFieldType(request.getFieldType()));
        field.setMandatory(request.getMandatory());
        field.setDisplayOrder(request.getDisplayOrder());
        field.setDropdownOptions(request.getDropdownOptions());
        return toFieldResponse(templateFieldRepository.save(field));
    }

    public void deleteTemplateField(Long fieldId) {
        validateCanManageTemplates(authenticatedUserService.getCurrentUser());
        TemplateField field = findAccessibleFieldById(fieldId);
        field.setActive(false);
        templateFieldRepository.save(field);
    }

    public TemplateResponse updateTemplateStatus(Long id, Boolean active) {
        validateCanManageTemplates(authenticatedUserService.getCurrentUser());
        TemplateMaster template = findAccessibleTemplateById(id);
        template.setActive(active == null ? !Boolean.TRUE.equals(template.getActive()) : active);
        return toResponse(templateMasterRepository.save(template));
    }

    public TemplateResponse getTemplate(Long id) {
        return toResponse(findAccessibleTemplateById(id));
    }

    public List<TemplateResponse> getAllTemplates() {
        User currentUser = authenticatedUserService.getCurrentUser();
        List<TemplateMaster> templates = authenticatedUserService.isSuperAdmin(currentUser)
                ? templateMasterRepository.findAll()
                : templateMasterRepository.findByOrganizationId(
                        authenticatedUserService.requireOrganizationId(currentUser));

        return templates
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void deleteTemplate(Long id) {
        validateCanManageTemplates(authenticatedUserService.getCurrentUser());
        TemplateMaster template = findAccessibleTemplateById(id);
        templateFieldRepository.deleteByTemplateId(template.getId());
        templateMasterRepository.delete(template);
    }

    private TemplateMaster findTemplateById(Long id) {
        return templateMasterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Template not found with id: " + id));
    }

    private TemplateMaster findAccessibleTemplateById(Long id) {
        User currentUser = authenticatedUserService.getCurrentUser();

        if (authenticatedUserService.isSuperAdmin(currentUser)) {
            return findTemplateById(id);
        }

        return templateMasterRepository
                .findByIdAndOrganizationId(id, authenticatedUserService.requireOrganizationId(currentUser))
                .orElseThrow(() -> new AccessDeniedException("Access denied"));
    }

    private TemplateField findAccessibleFieldById(Long fieldId) {
        TemplateField field = templateFieldRepository.findById(fieldId)
                .orElseThrow(() -> new RuntimeException("Template field not found with id: " + fieldId));
        findAccessibleTemplateById(field.getTemplateId());
        return field;
    }

    private void validateCanManageTemplates(User currentUser) {
        String role = currentUser.getRole().getRoleName();
        if (AuthenticatedUserService.SUPER_ADMIN_ROLE.equals(role)
                || AuthenticatedUserService.ORG_ADMIN_ROLE.equals(role)) {
            return;
        }

        throw new AccessDeniedException("Access denied");
    }

    private Long resolveOrganizationId(User currentUser, Long requestedOrganizationId) {
        if (!authenticatedUserService.isSuperAdmin(currentUser)) {
            return authenticatedUserService.requireOrganizationId(currentUser);
        }

        return requestedOrganizationId;
    }

    private String normalizeFieldType(String fieldType) {
        return fieldType == null ? "" : fieldType.trim().toUpperCase();
    }

    private TemplateResponse toResponse(TemplateMaster template) {
        List<TemplateFieldResponse> fields = templateFieldRepository
                .findByTemplateIdAndActiveTrueOrderByDisplayOrderAsc(template.getId())
                .stream()
                .map(this::toFieldResponse)
                .toList();

        return TemplateResponse.builder()
                .id(template.getId())
                .organizationId(template.getOrganizationId())
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
                .dropdownOptions(field.getDropdownOptions())
                .active(field.getActive())
                .build();
    }
}
