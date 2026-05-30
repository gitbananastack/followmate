package com.followmate.organization.controller;

import com.followmate.common.ApiResponse;
import com.followmate.organization.dto.OrganizationEnrollmentRequest;
import com.followmate.organization.dto.OrganizationRequest;
import com.followmate.organization.dto.OrganizationResponse;
import com.followmate.organization.service.OrganizationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/organizations")
@RequiredArgsConstructor
public class OrganizationController {

    private final OrganizationService organizationService;

    @PostMapping
    public ResponseEntity<ApiResponse<OrganizationResponse>> createOrganization(
            @Valid @RequestBody OrganizationRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Organization created successfully",
                        organizationService.createOrganization(request)));
    }

    @PostMapping("/enroll")
    public ResponseEntity<ApiResponse<OrganizationResponse>> enrollOrganization(
            @Valid @RequestBody OrganizationEnrollmentRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Organization enrolled successfully",
                        organizationService.enrollOrganization(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<OrganizationResponse>>> getAllOrganizations() {
        return ResponseEntity.ok(ApiResponse.success("Organizations fetched successfully",
                organizationService.getAllOrganizations()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrganizationResponse>> getOrganizationById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Organization fetched successfully",
                organizationService.getOrganizationById(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<OrganizationResponse>> updateOrganization(
            @PathVariable Long id,
            @Valid @RequestBody OrganizationRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Organization updated successfully",
                organizationService.updateOrganization(id, request)));
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<ApiResponse<OrganizationResponse>> activateOrganization(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Organization activated successfully",
                organizationService.activateOrganization(id)));
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<ApiResponse<OrganizationResponse>> deactivateOrganization(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Organization deactivated successfully",
                organizationService.deactivateOrganization(id)));
    }

    @PatchMapping("/{id}/suspend")
    public ResponseEntity<ApiResponse<OrganizationResponse>> suspendOrganization(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Organization suspended successfully",
                organizationService.suspendOrganization(id)));
    }

}
