package com.followmate.permission.service;

import com.followmate.auth.entity.User;
import com.followmate.auth.repository.UserRepository;
import com.followmate.permission.dto.PermissionResponse;
import com.followmate.permission.dto.UserPermissionItemRequest;
import com.followmate.permission.dto.UserPermissionResponse;
import com.followmate.permission.dto.UserPermissionUpdateRequest;
import com.followmate.permission.entity.Permission;
import com.followmate.permission.entity.UserPermission;
import com.followmate.permission.repository.PermissionRepository;
import com.followmate.permission.repository.UserPermissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PermissionService {

    private static final String SUPER_ADMIN_ROLE = "SUPER_ADMIN";
    private static final String ORG_ADMIN_ROLE = "ORG_ADMIN";
    private static final String STAFF_ROLE = "STAFF";

    private final PermissionRepository permissionRepository;
    private final UserPermissionRepository userPermissionRepository;
    private final UserRepository userRepository;

    public List<PermissionResponse> getAllPermissions() {
        return permissionRepository.findByActiveTrueOrderByPermissionCodeAsc()
                .stream()
                .map(this::toPermissionResponse)
                .toList();
    }

    public List<String> getEffectivePermissionCodes(User user) {
        String role = user.getRole().getRoleName();

        if (SUPER_ADMIN_ROLE.equals(role) || ORG_ADMIN_ROLE.equals(role)) {
            return permissionRepository.findByActiveTrueOrderByPermissionCodeAsc()
                    .stream()
                    .map(Permission::getPermissionCode)
                    .toList();
        }

        return userPermissionRepository.findByUserIdAndAllowedTrue(user.getId())
                .stream()
                .map(UserPermission::getPermissionId)
                .collect(Collectors.collectingAndThen(Collectors.toSet(), permissionRepository::findAllById))
                .stream()
                .filter(permission -> Boolean.TRUE.equals(permission.getActive()))
                .map(Permission::getPermissionCode)
                .sorted()
                .toList();
    }

    public List<UserPermissionResponse> getUserPermissions(Long userId) {
        User currentUser = getCurrentUser();
        User targetUser = getUser(userId);

        validateViewPermission(currentUser, targetUser);
        return buildUserPermissionResponses(targetUser);
    }

    @Transactional
    public List<UserPermissionResponse> updateUserPermissions(Long userId, UserPermissionUpdateRequest request) {
        User currentUser = getCurrentUser();
        User targetUser = getUser(userId);

        validateUpdatePermission(currentUser, targetUser);

        Map<String, Permission> permissionsByCode = permissionRepository.findByActiveTrueOrderByPermissionCodeAsc()
                .stream()
                .collect(Collectors.toMap(Permission::getPermissionCode, Function.identity()));

        for (UserPermissionItemRequest item : request.getPermissions()) {
            String permissionCode = normalizePermissionCode(item.getPermissionCode());
            Permission permission = permissionsByCode.get(permissionCode);
            if (permission == null) {
                throw new IllegalArgumentException("Invalid permission code: " + permissionCode);
            }

            UserPermission userPermission = userPermissionRepository
                    .findByUserIdAndPermissionId(targetUser.getId(), permission.getId())
                    .orElseGet(() -> UserPermission.builder()
                            .userId(targetUser.getId())
                            .permissionId(permission.getId())
                            .build());
            userPermission.setAllowed(item.getAllowed());
            userPermissionRepository.save(userPermission);
        }

        return buildUserPermissionResponses(targetUser);
    }

    private List<UserPermissionResponse> buildUserPermissionResponses(User user) {
        String role = user.getRole().getRoleName();
        List<Permission> permissions = permissionRepository.findByActiveTrueOrderByPermissionCodeAsc();

        if (SUPER_ADMIN_ROLE.equals(role) || ORG_ADMIN_ROLE.equals(role)) {
            return permissions.stream()
                    .map(permission -> toUserPermissionResponse(permission, true))
                    .toList();
        }

        Map<Long, Boolean> allowedByPermissionId = userPermissionRepository.findByUserId(user.getId())
                .stream()
                .collect(Collectors.toMap(UserPermission::getPermissionId, UserPermission::getAllowed));

        return permissions.stream()
                .map(permission -> toUserPermissionResponse(permission,
                        Boolean.TRUE.equals(allowedByPermissionId.get(permission.getId()))))
                .toList();
    }

    private void validateViewPermission(User currentUser, User targetUser) {
        String currentRole = currentUser.getRole().getRoleName();

        if (SUPER_ADMIN_ROLE.equals(currentRole)) {
            return;
        }

        if (ORG_ADMIN_ROLE.equals(currentRole)
                && currentUser.getOrganizationId() != null
                && currentUser.getOrganizationId().equals(targetUser.getOrganizationId())) {
            return;
        }

        if (currentUser.getId().equals(targetUser.getId())) {
            return;
        }

        throw new AccessDeniedException("You are not allowed to view these permissions");
    }

    private void validateUpdatePermission(User currentUser, User targetUser) {
        String currentRole = currentUser.getRole().getRoleName();
        String targetRole = targetUser.getRole().getRoleName();

        if (STAFF_ROLE.equals(currentRole)) {
            throw new AccessDeniedException("STAFF cannot update permissions");
        }

        if (SUPER_ADMIN_ROLE.equals(currentRole)) {
            return;
        }

        if (ORG_ADMIN_ROLE.equals(currentRole)) {
            if (SUPER_ADMIN_ROLE.equals(targetRole)) {
                throw new AccessDeniedException("ORG_ADMIN cannot update SUPER_ADMIN permissions");
            }

            if (!STAFF_ROLE.equals(targetRole)) {
                throw new AccessDeniedException("ORG_ADMIN can update only STAFF permissions");
            }

            if (currentUser.getOrganizationId() == null
                    || !currentUser.getOrganizationId().equals(targetUser.getOrganizationId())) {
                throw new AccessDeniedException("ORG_ADMIN can update permissions only inside own organization");
            }
            return;
        }

        throw new AccessDeniedException("You are not allowed to update permissions");
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AccessDeniedException("Authenticated user not found"));
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
    }

    private String normalizePermissionCode(String permissionCode) {
        return permissionCode == null ? "" : permissionCode.trim().toUpperCase();
    }

    private PermissionResponse toPermissionResponse(Permission permission) {
        return PermissionResponse.builder()
                .id(permission.getId())
                .permissionCode(permission.getPermissionCode())
                .permissionName(permission.getPermissionName())
                .category(permission.getCategory())
                .active(permission.getActive())
                .build();
    }

    private UserPermissionResponse toUserPermissionResponse(Permission permission, Boolean allowed) {
        return UserPermissionResponse.builder()
                .permissionCode(permission.getPermissionCode())
                .permissionName(permission.getPermissionName())
                .category(permission.getCategory())
                .allowed(allowed)
                .build();
    }
}
