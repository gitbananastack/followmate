package com.followmate.setup.service;

import com.followmate.auth.entity.User;
import com.followmate.organization.entity.Organization;
import com.followmate.organization.repository.OrganizationRepository;
import com.followmate.security.AuthenticatedUserService;
import com.followmate.setup.dto.OrganizationLeadFieldRequest;
import com.followmate.setup.dto.OrganizationLeadFieldResponse;
import com.followmate.setup.dto.OrganizationPipelineStageRequest;
import com.followmate.setup.dto.OrganizationPipelineStageResponse;
import com.followmate.setup.dto.OrganizationSetupResponse;
import com.followmate.setup.entity.BusinessTemplateMaster;
import com.followmate.setup.entity.BusinessTemplateField;
import com.followmate.setup.entity.BusinessTemplateStage;
import com.followmate.setup.entity.OrganizationLeadField;
import com.followmate.setup.entity.OrganizationPipelineStage;
import com.followmate.setup.repository.BusinessTemplateFieldRepository;
import com.followmate.setup.repository.BusinessTemplateMasterRepository;
import com.followmate.setup.repository.BusinessTemplateStageRepository;
import com.followmate.setup.repository.OrganizationLeadFieldRepository;
import com.followmate.setup.repository.OrganizationPipelineStageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OrganizationSetupService {

    private final OrganizationRepository organizationRepository;
    private final BusinessTemplateMasterRepository businessTemplateMasterRepository;
    private final BusinessTemplateFieldRepository businessTemplateFieldRepository;
    private final BusinessTemplateStageRepository businessTemplateStageRepository;
    private final OrganizationLeadFieldRepository organizationLeadFieldRepository;
    private final OrganizationPipelineStageRepository organizationPipelineStageRepository;
    private final AuthenticatedUserService authenticatedUserService;

    @Transactional
    public void copyTemplateSetup(Organization organization) {
        if (organization.getSourceTemplateId() == null) {
            return;
        }

        validateTemplateMatches(organization.getSourceTemplateId(), organization.getBusinessType());

        List<BusinessTemplateField> templateFields = businessTemplateFieldRepository
                .findByTemplateIdAndActiveTrueOrderByDisplayOrderAsc(organization.getSourceTemplateId());
        organizationLeadFieldRepository.saveAll(templateFields.stream()
                .map(field -> OrganizationLeadField.builder()
                        .organizationId(organization.getId())
                        .fieldName(field.getFieldName())
                        .fieldLabel(field.getFieldLabel())
                        .fieldType(field.getFieldType())
                        .mandatory(field.getMandatory())
                        .displayOrder(field.getDisplayOrder())
                        .dropdownOptions(field.getDropdownOptions())
                        .active(Boolean.TRUE.equals(field.getActive()))
                        .build())
                .toList());

        List<BusinessTemplateStage> templateStages = businessTemplateStageRepository
                .findByTemplateIdAndActiveTrueOrderByDisplayOrderAsc(organization.getSourceTemplateId());
        organizationPipelineStageRepository.saveAll(templateStages.stream()
                .map(stage -> OrganizationPipelineStage.builder()
                        .organizationId(organization.getId())
                        .stageName(stage.getStageName())
                        .displayOrder(stage.getDisplayOrder())
                        .active(Boolean.TRUE.equals(stage.getActive()))
                        .build())
                .toList());
    }

    @Transactional
    public void saveEnrollmentSetup(
            Organization organization,
            List<OrganizationLeadFieldRequest> leadFields,
            List<OrganizationPipelineStageRequest> pipelineStages
    ) {
        organizationLeadFieldRepository.saveAll(leadFields.stream()
                .map(field -> OrganizationLeadField.builder()
                        .organizationId(organization.getId())
                        .fieldName(field.getFieldName())
                        .fieldLabel(field.getFieldLabel())
                        .fieldType(field.getFieldType())
                        .mandatory(field.getMandatory())
                        .displayOrder(field.getDisplayOrder())
                        .dropdownOptions(field.getDropdownOptions())
                        .active(!Boolean.FALSE.equals(field.getActive()))
                        .build())
                .toList());

        organizationPipelineStageRepository.saveAll(pipelineStages.stream()
                .map(stage -> OrganizationPipelineStage.builder()
                        .organizationId(organization.getId())
                        .stageName(stage.getStageName())
                        .displayOrder(stage.getDisplayOrder())
                        .active(!Boolean.FALSE.equals(stage.getActive()))
                        .build())
                .toList());
    }

    public void validateTemplateMatches(Long templateId, String businessType) {
        BusinessTemplateMaster template = businessTemplateMasterRepository.findById(templateId)
                .filter(sourceTemplate -> Boolean.TRUE.equals(sourceTemplate.getActive()))
                .orElseThrow(() -> new RuntimeException("Business template not found or inactive"));
        if (!template.getBusinessType().equals(businessType)) {
            throw new IllegalArgumentException("Business type does not match source template");
        }
    }

    public OrganizationSetupResponse getOrganizationSetup(Long organizationId) {
        Organization organization = findOrganizationById(resolveViewOrganizationId(organizationId));
        return toSetupResponse(organization, false);
    }

    public OrganizationSetupResponse getEffectiveOrganizationSetup(Long organizationId) {
        Organization organization = findOrganizationById(resolveViewOrganizationId(organizationId));
        return toSetupResponse(organization, true);
    }

    @Transactional
    public OrganizationSetupResponse updateLeadFields(
            Long organizationId,
            List<OrganizationLeadFieldRequest> requests,
            boolean override
    ) {
        Organization organization = findOrganizationById(organizationId);
        validateCanUpdateSetup(organization, override);

        organizationLeadFieldRepository.deleteByOrganizationId(organization.getId());
        organizationLeadFieldRepository.saveAll(requests.stream()
                .map(request -> OrganizationLeadField.builder()
                        .organizationId(organization.getId())
                        .fieldName(request.getFieldName())
                        .fieldLabel(request.getFieldLabel())
                        .fieldType(request.getFieldType())
                        .mandatory(request.getMandatory())
                        .displayOrder(request.getDisplayOrder())
                        .dropdownOptions(request.getDropdownOptions())
                        .active(!Boolean.FALSE.equals(request.getActive()))
                        .build())
                .toList());

        return toSetupResponse(organization, false);
    }

    @Transactional
    public OrganizationSetupResponse updatePipelineStages(
            Long organizationId,
            List<OrganizationPipelineStageRequest> requests,
            boolean override
    ) {
        Organization organization = findOrganizationById(organizationId);
        validateCanUpdateSetup(organization, override);

        organizationPipelineStageRepository.deleteByOrganizationId(organization.getId());
        organizationPipelineStageRepository.saveAll(requests.stream()
                .map(request -> OrganizationPipelineStage.builder()
                        .organizationId(organization.getId())
                        .stageName(request.getStageName())
                        .displayOrder(request.getDisplayOrder())
                        .active(!Boolean.FALSE.equals(request.getActive()))
                        .build())
                .toList());

        return toSetupResponse(organization, false);
    }

    public OrganizationSetupResponse finalizeSetup(Long organizationId) {
        Organization organization = findOrganizationById(organizationId);
        validateSuperAdmin();
        organization.setSetupFinalized(true);
        return toSetupResponse(organizationRepository.save(organization), false);
    }

    private Organization findOrganizationById(Long id) {
        return organizationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Organization not found with id: " + id));
    }

    private Long resolveViewOrganizationId(Long requestedOrganizationId) {
        User currentUser = authenticatedUserService.getCurrentUser();
        if (authenticatedUserService.isSuperAdmin(currentUser)) {
            return requestedOrganizationId;
        }

        Long currentOrganizationId = authenticatedUserService.requireOrganizationId(currentUser);
        if (!currentOrganizationId.equals(requestedOrganizationId)) {
            throw new AccessDeniedException("Access denied");
        }

        return currentOrganizationId;
    }

    private void validateCanUpdateSetup(Organization organization, boolean override) {
        validateSuperAdmin();
        if (Boolean.TRUE.equals(organization.getSetupFinalized()) && !override) {
            throw new AccessDeniedException("Admin override is required to edit finalized setup");
        }
    }

    private void validateSuperAdmin() {
        if (!authenticatedUserService.isSuperAdmin(authenticatedUserService.getCurrentUser())) {
            throw new AccessDeniedException("Access denied");
        }
    }

    private OrganizationSetupResponse toSetupResponse(Organization organization, boolean activeOnly) {
        return OrganizationSetupResponse.builder()
                .organizationId(organization.getId())
                .organizationName(organization.getOrganizationName())
                .businessType(organization.getBusinessType())
                .status(organization.getStatus())
                .setupFinalized(organization.getSetupFinalized())
                .sourceTemplateId(organization.getSourceTemplateId())
                .leadFields((activeOnly
                        ? organizationLeadFieldRepository
                                .findByOrganizationIdAndActiveTrueOrderByDisplayOrderAsc(organization.getId())
                        : organizationLeadFieldRepository
                                .findByOrganizationIdOrderByDisplayOrderAsc(organization.getId()))
                        .stream()
                        .map(this::toLeadFieldResponse)
                        .toList())
                .pipelineStages((activeOnly
                        ? organizationPipelineStageRepository
                                .findByOrganizationIdAndActiveTrueOrderByDisplayOrderAsc(organization.getId())
                        : organizationPipelineStageRepository
                                .findByOrganizationIdOrderByDisplayOrderAsc(organization.getId()))
                        .stream()
                        .map(this::toPipelineStageResponse)
                        .toList())
                .build();
    }

    private OrganizationLeadFieldResponse toLeadFieldResponse(OrganizationLeadField field) {
        return OrganizationLeadFieldResponse.builder()
                .id(field.getId())
                .organizationId(field.getOrganizationId())
                .fieldName(field.getFieldName())
                .fieldLabel(field.getFieldLabel())
                .fieldType(field.getFieldType())
                .mandatory(field.getMandatory())
                .displayOrder(field.getDisplayOrder())
                .dropdownOptions(field.getDropdownOptions())
                .active(field.getActive())
                .createdAt(field.getCreatedAt())
                .updatedAt(field.getUpdatedAt())
                .build();
    }

    private OrganizationPipelineStageResponse toPipelineStageResponse(OrganizationPipelineStage stage) {
        return OrganizationPipelineStageResponse.builder()
                .id(stage.getId())
                .organizationId(stage.getOrganizationId())
                .stageName(stage.getStageName())
                .displayOrder(stage.getDisplayOrder())
                .active(stage.getActive())
                .createdAt(stage.getCreatedAt())
                .updatedAt(stage.getUpdatedAt())
                .build();
    }
}
