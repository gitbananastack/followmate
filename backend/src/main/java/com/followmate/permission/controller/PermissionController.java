package com.followmate.permission.controller;

import com.followmate.common.ApiResponse;
import com.followmate.permission.dto.PermissionResponse;
import com.followmate.permission.dto.UserPermissionResponse;
import com.followmate.permission.dto.UserPermissionUpdateRequest;
import com.followmate.permission.service.PermissionService;
import com.followmate.security.RequirePermission;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PermissionController {

    private final PermissionService permissionService;

    @GetMapping("/permissions")
    @RequirePermission("USER_MANAGE")
    public ResponseEntity<ApiResponse<List<PermissionResponse>>> getAllPermissions() {
        return ResponseEntity.ok(ApiResponse.success("Permissions fetched successfully",
                permissionService.getAllPermissions()));
    }

    @GetMapping("/users/{userId}/permissions")
    @RequirePermission("USER_MANAGE")
    public ResponseEntity<ApiResponse<List<UserPermissionResponse>>> getUserPermissions(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success("User permissions fetched successfully",
                permissionService.getUserPermissions(userId)));
    }

    @PutMapping("/users/{userId}/permissions")
    @RequirePermission("USER_MANAGE")
    public ResponseEntity<ApiResponse<List<UserPermissionResponse>>> updateUserPermissions(
            @PathVariable Long userId,
            @Valid @RequestBody UserPermissionUpdateRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("User permissions updated successfully",
                permissionService.updateUserPermissions(userId, request)));
    }
}
