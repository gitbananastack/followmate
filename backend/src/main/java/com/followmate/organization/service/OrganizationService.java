package com.followmate.organization.service;

import com.followmate.organization.dto.OrganizationRequest;
import com.followmate.organization.dto.OrganizationEnrollmentRequest;
import com.followmate.organization.dto.OrganizationResponse;
import com.followmate.organization.entity.Organization;
import com.followmate.organization.repository.OrganizationRepository;
import com.followmate.security.AuthenticatedUserService;
import com.followmate.setup.service.OrganizationSetupService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OrganizationService {

    private static final String ACTIVE_STATUS = "ACTIVE";
    private static final String INACTIVE_STATUS = "INACTIVE";
    private static final String SUSPENDED_STATUS = "SUSPENDED";

    private final OrganizationRepository organizationRepository;
    private final OrganizationSetupService organizationSetupService;
    private final AuthenticatedUserService authenticatedUserService;

    @Transactional
    public OrganizationResponse createOrganization(OrganizationRequest request) {
        validateSuperAdmin();
        if (request.getSourceTemplateId() == null) {
            throw new IllegalArgumentException("Source template id is required");
        }

        Organization organization = Organization.builder()
                .organizationName(request.getOrganizationName())
                .businessType(request.getBusinessType())
                .sourceTemplateId(request.getSourceTemplateId())
                .setupFinalized(false)
                .email(request.getEmail())
                .phone(request.getPhone())
                .address(request.getAddress())
                .status(ACTIVE_STATUS)
                .build();

        Organization savedOrganization = organizationRepository.save(organization);
        organizationSetupService.copyTemplateSetup(savedOrganization);

        return toResponse(savedOrganization);
    }

    @Transactional
    public OrganizationResponse enrollOrganization(OrganizationEnrollmentRequest request) {
        validateSuperAdmin();
        organizationSetupService.validateTemplateMatches(request.getSourceTemplateId(), request.getBusinessType());

        Organization organization = Organization.builder()
                .organizationName(request.getOrganizationName())
                .businessType(request.getBusinessType())
                .sourceTemplateId(request.getSourceTemplateId())
                .setupFinalized(true)
                .email(request.getEmail())
                .phone(request.getPhone())
                .address(request.getAddress())
                .status(ACTIVE_STATUS)
                .build();

        Organization savedOrganization = organizationRepository.save(organization);
        organizationSetupService.saveEnrollmentSetup(
                savedOrganization,
                request.getLeadFields(),
                request.getPipelineStages()
        );

        return toResponse(savedOrganization);
    }

    public List<OrganizationResponse> getAllOrganizations() {
        validateSuperAdmin();
        return organizationRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public OrganizationResponse getOrganizationById(Long id) {
        validateSuperAdmin();
        return toResponse(findOrganizationById(id));
    }

    public OrganizationResponse updateOrganization(Long id, OrganizationRequest request) {
        validateSuperAdmin();
        Organization organization = findOrganizationById(id);
        organization.setOrganizationName(request.getOrganizationName());
        organization.setBusinessType(request.getBusinessType());
        organization.setSourceTemplateId(request.getSourceTemplateId());
        organization.setEmail(request.getEmail());
        organization.setPhone(request.getPhone());
        organization.setAddress(request.getAddress());

        return toResponse(organizationRepository.save(organization));
    }

    public OrganizationResponse activateOrganization(Long id) {
        validateSuperAdmin();
        Organization organization = findOrganizationById(id);
        organization.setStatus(ACTIVE_STATUS);
        return toResponse(organizationRepository.save(organization));
    }

    public OrganizationResponse deactivateOrganization(Long id) {
        validateSuperAdmin();
        Organization organization = findOrganizationById(id);
        organization.setStatus(INACTIVE_STATUS);
        return toResponse(organizationRepository.save(organization));
    }

    public OrganizationResponse suspendOrganization(Long id) {
        validateSuperAdmin();
        Organization organization = findOrganizationById(id);
        organization.setStatus(SUSPENDED_STATUS);
        return toResponse(organizationRepository.save(organization));
    }

    private Organization findOrganizationById(Long id) {
        return organizationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Organization not found with id: " + id));
    }

    private void validateSuperAdmin() {
        if (!authenticatedUserService.isSuperAdmin(authenticatedUserService.getCurrentUser())) {
            throw new AccessDeniedException("Access denied");
        }
    }

    private OrganizationResponse toResponse(Organization organization) {
        return OrganizationResponse.builder()
                .id(organization.getId())
                .organizationName(organization.getOrganizationName())
                .businessType(organization.getBusinessType())
                .sourceTemplateId(organization.getSourceTemplateId())
                .setupFinalized(organization.getSetupFinalized())
                .email(organization.getEmail())
                .phone(organization.getPhone())
                .address(organization.getAddress())
                .status(organization.getStatus())
                .createdAt(organization.getCreatedAt())
                .updatedAt(organization.getUpdatedAt())
                .build();
    }
}
