package com.followmate.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.followmate.auth.entity.User;
import com.followmate.auth.repository.UserRepository;
import com.followmate.common.ApiResponse;
import com.followmate.permission.service.PermissionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
@RequiredArgsConstructor
public class PermissionInterceptor implements HandlerInterceptor {

    private static final String SUPER_ADMIN_ROLE = "SUPER_ADMIN";
    private static final String ORG_ADMIN_ROLE = "ORG_ADMIN";

    private final UserRepository userRepository;
    private final PermissionService permissionService;
    private final ObjectMapper objectMapper;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {
        if (!(handler instanceof HandlerMethod handlerMethod)) {
            return true;
        }

        RequirePermission requirePermission = handlerMethod.getMethodAnnotation(RequirePermission.class);
        if (requirePermission == null) {
            return true;
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            writeAccessDenied(response);
            return false;
        }

        User user = userRepository.findByEmail(authentication.getName()).orElse(null);
        if (user == null) {
            writeAccessDenied(response);
            return false;
        }

        String role = user.getRole().getRoleName();
        if (SUPER_ADMIN_ROLE.equals(role) || ORG_ADMIN_ROLE.equals(role)) {
            return true;
        }

        if (permissionService.getEffectivePermissionCodes(user).contains(requirePermission.value())) {
            return true;
        }

        writeAccessDenied(response);
        return false;
    }

    private void writeAccessDenied(HttpServletResponse response) throws Exception {
        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getWriter(), ApiResponse.failure("Access denied"));
    }
}
