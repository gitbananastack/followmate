package com.followmate.setup.controller;

import com.followmate.common.ApiResponse;
import com.followmate.setup.dto.OrganizationLeadFieldRequest;
import com.followmate.setup.dto.OrganizationPipelineStageRequest;
import com.followmate.setup.dto.OrganizationSetupResponse;
import com.followmate.setup.service.OrganizationSetupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/organizations")
@RequiredArgsConstructor
public class OrganizationSetupController {

    private final OrganizationSetupService organizationSetupService;

    @GetMapping("/{organizationId}/setup")
    public ResponseEntity<ApiResponse<OrganizationSetupResponse>> getOrganizationSetup(
            @PathVariable Long organizationId
    ) {
        return ResponseEntity.ok(ApiResponse.success("Organization setup fetched successfully",
                organizationSetupService.getOrganizationSetup(organizationId)));
    }

    @GetMapping("/{organizationId}/effective-setup")
    public ResponseEntity<ApiResponse<OrganizationSetupResponse>> getEffectiveOrganizationSetup(
            @PathVariable Long organizationId
    ) {
        return ResponseEntity.ok(ApiResponse.success("Organization effective setup fetched successfully",
                organizationSetupService.getEffectiveOrganizationSetup(organizationId)));
    }

    @PutMapping("/{organizationId}/lead-fields")
    public ResponseEntity<ApiResponse<OrganizationSetupResponse>> updateLeadFields(
            @PathVariable Long organizationId,
            @RequestParam(defaultValue = "false") boolean override,
            @Valid @RequestBody List<OrganizationLeadFieldRequest> request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Organization lead fields updated successfully",
                organizationSetupService.updateLeadFields(organizationId, request, override)));
    }

    @PutMapping("/{organizationId}/pipeline-stages")
    public ResponseEntity<ApiResponse<OrganizationSetupResponse>> updatePipelineStages(
            @PathVariable Long organizationId,
            @RequestParam(defaultValue = "false") boolean override,
            @Valid @RequestBody List<OrganizationPipelineStageRequest> request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Organization pipeline stages updated successfully",
                organizationSetupService.updatePipelineStages(organizationId, request, override)));
    }

    @PatchMapping("/{organizationId}/finalize-setup")
    public ResponseEntity<ApiResponse<OrganizationSetupResponse>> finalizeSetup(
            @PathVariable Long organizationId
    ) {
        return ResponseEntity.ok(ApiResponse.success("Organization setup finalized successfully",
                organizationSetupService.finalizeSetup(organizationId)));
    }
}
