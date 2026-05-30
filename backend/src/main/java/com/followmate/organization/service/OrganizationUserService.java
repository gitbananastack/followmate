package com.followmate.organization.service;

import com.followmate.auth.entity.Role;
import com.followmate.auth.entity.User;
import com.followmate.auth.repository.RoleRepository;
import com.followmate.auth.repository.UserRepository;
import com.followmate.organization.dto.OrganizationUserRequest;
import com.followmate.organization.dto.OrganizationUserResponse;
import com.followmate.organization.dto.ResetPasswordRequest;
import com.followmate.organization.repository.OrganizationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class OrganizationUserService {

    private static final String ACTIVE_STATUS = "ACTIVE";
    private static final String INACTIVE_STATUS = "INACTIVE";
    private static final String SUPER_ADMIN_ROLE = "SUPER_ADMIN";
    private static final String ORG_ADMIN_ROLE = "ORG_ADMIN";
    private static final String STAFF_ROLE = "STAFF";
    private static final Set<String> SUPER_ADMIN_ALLOWED_ROLES = Set.of(ORG_ADMIN_ROLE, STAFF_ROLE);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final OrganizationRepository organizationRepository;
    private final PasswordEncoder passwordEncoder;

    public OrganizationUserResponse createOrganizationUser(Long organizationId, OrganizationUserRequest request) {
        User currentUser = getCurrentUser();
        String requestedRole = normalizeRole(request.getRole());

        validateOrganization(organizationId);
        validateCreatePermission(currentUser, organizationId, requestedRole);
        validateEmailIsUnique(request.getEmail());

        Role role = roleRepository.findByRoleName(requestedRole)
                .orElseThrow(() -> new IllegalArgumentException("Invalid role: " + requestedRole));

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .status(ACTIVE_STATUS)
                .forcePasswordChange(SUPER_ADMIN_ROLE.equals(currentUser.getRole().getRoleName())
                        && ORG_ADMIN_ROLE.equals(requestedRole))
                .organizationId(organizationId)
                .role(role)
                .build();

        return toResponse(userRepository.save(user));
    }

    public List<OrganizationUserResponse> getOrganizationUsers(Long organizationId) {
        User currentUser = getCurrentUser();

        validateOrganization(organizationId);
        validateManagePermission(currentUser, organizationId);

        return userRepository.findByOrganizationId(organizationId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public OrganizationUserResponse deactivateOrganizationUser(Long organizationId, Long userId) {
        return updateOrganizationUserStatus(organizationId, userId, INACTIVE_STATUS);
    }

    public OrganizationUserResponse activateOrganizationUser(Long organizationId, Long userId) {
        return updateOrganizationUserStatus(organizationId, userId, ACTIVE_STATUS);
    }

    private OrganizationUserResponse updateOrganizationUserStatus(Long organizationId, Long userId, String status) {
        User loggedInUser = getCurrentUser();

        validateOrganization(organizationId);

        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        validateActivationPermission(loggedInUser, organizationId, targetUser);

        targetUser.setStatus(status);
        return toResponse(userRepository.save(targetUser));
    }

    public OrganizationUserResponse resetOrganizationUserPassword(
            Long organizationId,
            Long userId,
            ResetPasswordRequest request
    ) {
        User currentUser = getCurrentUser();

        validateOrganization(organizationId);

        User targetUser = userRepository.findByOrganizationIdAndId(organizationId, userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        validateResetPasswordPermission(currentUser, organizationId, targetUser);

        targetUser.setPassword(passwordEncoder.encode(request.getNewPassword()));
        return toResponse(userRepository.save(targetUser));
    }

    private void validateCreatePermission(User currentUser, Long organizationId, String requestedRole) {
        String currentRole = currentUser.getRole().getRoleName();

        if (SUPER_ADMIN_ROLE.equals(currentRole)) {
            if (!SUPER_ADMIN_ALLOWED_ROLES.contains(requestedRole)) {
                throw new AccessDeniedException("SUPER_ADMIN can create only ORG_ADMIN or STAFF users");
            }
            return;
        }

        if (ORG_ADMIN_ROLE.equals(currentRole)) {
            if (!STAFF_ROLE.equals(requestedRole)) {
                throw new AccessDeniedException("ORG_ADMIN can create only STAFF users");
            }

            if (!organizationId.equals(currentUser.getOrganizationId())) {
                throw new AccessDeniedException("ORG_ADMIN can create users only inside own organization");
            }
            return;
        }

        throw new AccessDeniedException("STAFF cannot create users");
    }

    private void validateManagePermission(User currentUser, Long organizationId) {
        String currentRole = currentUser.getRole().getRoleName();

        if (SUPER_ADMIN_ROLE.equals(currentRole)) {
            return;
        }

        if (ORG_ADMIN_ROLE.equals(currentRole) && organizationId.equals(currentUser.getOrganizationId())) {
            return;
        }

        throw new AccessDeniedException("You are not allowed to manage organization users");
    }

    private void validateResetPasswordPermission(User currentUser, Long organizationId, User targetUser) {
        String currentRole = currentUser.getRole().getRoleName();
        String targetRole = targetUser.getRole().getRoleName();

        if (SUPER_ADMIN_ROLE.equals(targetRole)) {
            throw new AccessDeniedException("SUPER_ADMIN password cannot be reset from organization user management");
        }

        if (SUPER_ADMIN_ROLE.equals(currentRole)) {
            return;
        }

        if (ORG_ADMIN_ROLE.equals(currentRole)) {
            if (!organizationId.equals(currentUser.getOrganizationId())) {
                throw new AccessDeniedException("ORG_ADMIN can reset passwords only inside own organization");
            }

            if (!STAFF_ROLE.equals(targetRole)) {
                throw new AccessDeniedException("ORG_ADMIN can reset only STAFF passwords");
            }
            return;
        }

        throw new AccessDeniedException("STAFF cannot reset passwords");
    }

    private void validateActivationPermission(User loggedInUser, Long organizationId, User targetUser) {
        String loggedInRole = loggedInUser.getRole().getRoleName();
        String targetRole = targetUser.getRole().getRoleName();

        if (SUPER_ADMIN_ROLE.equals(loggedInRole)) {
            if (!organizationId.equals(targetUser.getOrganizationId())) {
                throw new AccessDeniedException("Access denied");
            }

            if (ORG_ADMIN_ROLE.equals(targetRole) || STAFF_ROLE.equals(targetRole)) {
                return;
            }

            throw new AccessDeniedException("Access denied");
        }

        if (ORG_ADMIN_ROLE.equals(loggedInRole)) {
            if (!organizationId.equals(loggedInUser.getOrganizationId())) {
                throw new AccessDeniedException("Access denied");
            }

            if (STAFF_ROLE.equals(targetRole)
                    && organizationId.equals(targetUser.getOrganizationId())
                    && loggedInUser.getOrganizationId().equals(targetUser.getOrganizationId())) {
                return;
            }

            throw new AccessDeniedException("Access denied");
        }

        throw new AccessDeniedException("Access denied");
    }

    private void validateOrganization(Long organizationId) {
        if (!organizationRepository.existsById(organizationId)) {
            throw new RuntimeException("Organization not found with id: " + organizationId);
        }
    }

    private void validateEmailIsUnique(String email) {
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already exists");
        }
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AccessDeniedException("Authenticated user not found"));
    }

    private String normalizeRole(String role) {
        return role == null ? "" : role.trim().toUpperCase();
    }

    private OrganizationUserResponse toResponse(User user) {
        return OrganizationUserResponse.builder()
                .id(user.getId())
                .organizationId(user.getOrganizationId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().getRoleName())
                .status(user.getStatus())
                .build();
    }
}
