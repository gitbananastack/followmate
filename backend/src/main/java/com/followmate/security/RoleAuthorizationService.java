package com.followmate.security;

import com.followmate.auth.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RoleAuthorizationService {

    private final AuthenticatedUserService authenticatedUserService;

    public User requireSuperAdmin() {
        User user = authenticatedUserService.getCurrentUser();
        if (!authenticatedUserService.isSuperAdmin(user)) {
            throw new AccessDeniedException("Access denied");
        }
        return user;
    }

    public User requireOrgAdmin() {
        User user = authenticatedUserService.getCurrentUser();
        if (!AuthenticatedUserService.ORG_ADMIN_ROLE.equals(user.getRole().getRoleName())) {
            throw new AccessDeniedException("Access denied");
        }
        authenticatedUserService.requireOrganizationId(user);
        return user;
    }

    public User requireBusinessUser() {
        User user = authenticatedUserService.getCurrentUser();
        String role = user.getRole().getRoleName();
        if (!AuthenticatedUserService.ORG_ADMIN_ROLE.equals(role)
                && !AuthenticatedUserService.STAFF_ROLE.equals(role)) {
            throw new AccessDeniedException("Access denied");
        }
        authenticatedUserService.requireOrganizationId(user);
        return user;
    }
}
