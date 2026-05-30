package com.followmate.pipeline.service;

import com.followmate.auth.entity.User;
import com.followmate.organization.repository.OrganizationRepository;
import com.followmate.security.AuthenticatedUserService;
import com.followmate.setup.dto.OrganizationPipelineStageResponse;
import com.followmate.setup.entity.OrganizationPipelineStage;
import com.followmate.setup.repository.OrganizationPipelineStageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PipelineService {

    private final OrganizationPipelineStageRepository organizationPipelineStageRepository;
    private final OrganizationRepository organizationRepository;
    private final AuthenticatedUserService authenticatedUserService;

    public List<OrganizationPipelineStageResponse> getPipelineStages(Long requestedOrganizationId) {
        Long organizationId = resolveOrganizationId(requestedOrganizationId);
        validateOrganization(organizationId);

        return organizationPipelineStageRepository
                .findByOrganizationIdAndActiveTrueOrderByDisplayOrderAsc(organizationId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private Long resolveOrganizationId(Long requestedOrganizationId) {
        User currentUser = authenticatedUserService.getCurrentUser();

        if (authenticatedUserService.isSuperAdmin(currentUser)) {
            if (requestedOrganizationId == null) {
                throw new IllegalArgumentException("Organization id is required");
            }

            return requestedOrganizationId;
        }

        return authenticatedUserService.requireOrganizationId(currentUser);
    }

    private void validateOrganization(Long organizationId) {
        if (!organizationRepository.existsById(organizationId)) {
            throw new RuntimeException("Organization not found with id: " + organizationId);
        }
    }

    private OrganizationPipelineStageResponse toResponse(OrganizationPipelineStage stage) {
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
