package com.followmate.organization.controller;

import com.followmate.common.ApiResponse;
import com.followmate.organization.dto.OrganizationUserRequest;
import com.followmate.organization.dto.OrganizationUserResponse;
import com.followmate.organization.dto.ResetPasswordRequest;
import com.followmate.organization.service.OrganizationUserService;
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
@RequestMapping("/api/organizations/{organizationId}/users")
@RequiredArgsConstructor
public class OrganizationUserController {

    private final OrganizationUserService organizationUserService;

    @PostMapping
    public ResponseEntity<ApiResponse<OrganizationUserResponse>> createOrganizationUser(
            @PathVariable Long organizationId,
            @Valid @RequestBody OrganizationUserRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Organization user created successfully",
                        organizationUserService.createOrganizationUser(organizationId, request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<OrganizationUserResponse>>> getOrganizationUsers(
            @PathVariable Long organizationId
    ) {
        return ResponseEntity.ok(ApiResponse.success("Organization users fetched successfully",
                organizationUserService.getOrganizationUsers(organizationId)));
    }

    @PatchMapping("/{userId}/deactivate")
    public ResponseEntity<ApiResponse<OrganizationUserResponse>> deactivateOrganizationUser(
            @PathVariable Long organizationId,
            @PathVariable Long userId
    ) {
        return ResponseEntity.ok(ApiResponse.success("Organization user deactivated successfully",
                organizationUserService.deactivateOrganizationUser(organizationId, userId)));
    }

    @PatchMapping("/{userId}/activate")
    public ResponseEntity<ApiResponse<OrganizationUserResponse>> activateOrganizationUser(
            @PathVariable Long organizationId,
            @PathVariable Long userId
    ) {
        return ResponseEntity.ok(ApiResponse.success("Organization user activated successfully",
                organizationUserService.activateOrganizationUser(organizationId, userId)));
    }

    @PutMapping("/{userId}/reset-password")
    public ResponseEntity<ApiResponse<OrganizationUserResponse>> resetOrganizationUserPassword(
            @PathVariable Long organizationId,
            @PathVariable Long userId,
            @Valid @RequestBody ResetPasswordRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Organization user password reset successfully",
                organizationUserService.resetOrganizationUserPassword(organizationId, userId, request)));
    }
}
