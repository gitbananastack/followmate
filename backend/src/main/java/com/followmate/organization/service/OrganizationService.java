package com.followmate.organization.service;

import com.followmate.organization.dto.OrganizationRequest;
import com.followmate.organization.dto.OrganizationResponse;
import com.followmate.organization.entity.Organization;
import com.followmate.organization.repository.OrganizationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OrganizationService {

    private static final String ACTIVE_STATUS = "ACTIVE";
    private static final String INACTIVE_STATUS = "INACTIVE";

    private final OrganizationRepository organizationRepository;

    public OrganizationResponse createOrganization(OrganizationRequest request) {
        Organization organization = Organization.builder()
                .organizationName(request.getOrganizationName())
                .businessType(request.getBusinessType())
                .email(request.getEmail())
                .phone(request.getPhone())
                .address(request.getAddress())
                .status(ACTIVE_STATUS)
                .build();

        return toResponse(organizationRepository.save(organization));
    }

    public List<OrganizationResponse> getAllOrganizations() {
        return organizationRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public OrganizationResponse getOrganizationById(Long id) {
        return toResponse(findOrganizationById(id));
    }

    public OrganizationResponse updateOrganization(Long id, OrganizationRequest request) {
        Organization organization = findOrganizationById(id);
        organization.setOrganizationName(request.getOrganizationName());
        organization.setBusinessType(request.getBusinessType());
        organization.setEmail(request.getEmail());
        organization.setPhone(request.getPhone());
        organization.setAddress(request.getAddress());

        return toResponse(organizationRepository.save(organization));
    }

    public OrganizationResponse activateOrganization(Long id) {
        Organization organization = findOrganizationById(id);
        organization.setStatus(ACTIVE_STATUS);
        return toResponse(organizationRepository.save(organization));
    }

    public OrganizationResponse deactivateOrganization(Long id) {
        Organization organization = findOrganizationById(id);
        organization.setStatus(INACTIVE_STATUS);
        return toResponse(organizationRepository.save(organization));
    }

    private Organization findOrganizationById(Long id) {
        return organizationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Organization not found with id: " + id));
    }

    private OrganizationResponse toResponse(Organization organization) {
        return OrganizationResponse.builder()
                .id(organization.getId())
                .organizationName(organization.getOrganizationName())
                .businessType(organization.getBusinessType())
                .email(organization.getEmail())
                .phone(organization.getPhone())
                .address(organization.getAddress())
                .status(organization.getStatus())
                .createdAt(organization.getCreatedAt())
                .updatedAt(organization.getUpdatedAt())
                .build();
    }
}
