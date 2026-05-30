package com.followmate.security;

import com.followmate.auth.entity.User;
import com.followmate.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthenticatedUserService {

    public static final String SUPER_ADMIN_ROLE = "SUPER_ADMIN";
    public static final String ORG_ADMIN_ROLE = "ORG_ADMIN";
    public static final String STAFF_ROLE = "STAFF";

    private final UserRepository userRepository;

    public User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AccessDeniedException("Access denied"));
    }

    public boolean isSuperAdmin(User user) {
        return SUPER_ADMIN_ROLE.equals(user.getRole().getRoleName());
    }

    public Long requireOrganizationId(User user) {
        if (user.getOrganizationId() == null) {
            throw new AccessDeniedException("Access denied");
        }

        return user.getOrganizationId();
    }
}
