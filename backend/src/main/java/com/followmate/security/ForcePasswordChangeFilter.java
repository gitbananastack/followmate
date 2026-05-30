package com.followmate.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.followmate.auth.entity.User;
import com.followmate.auth.repository.UserRepository;
import com.followmate.common.ApiResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class ForcePasswordChangeFilter extends OncePerRequestFilter {

    private static final String LOGIN_PATH = "/api/auth/login";
    private static final String CHANGE_PASSWORD_PATH = "/api/users/change-password";

    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        if (isAllowedPath(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            filterChain.doFilter(request, response);
            return;
        }

        User user = userRepository.findByEmail(authentication.getName()).orElse(null);
        if (user != null && Boolean.TRUE.equals(user.getForcePasswordChange())) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            objectMapper.writeValue(response.getWriter(), ApiResponse.failure("Password change required"));
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean isAllowedPath(HttpServletRequest request) {
        return "OPTIONS".equalsIgnoreCase(request.getMethod())
                || LOGIN_PATH.equals(request.getRequestURI())
                || CHANGE_PASSWORD_PATH.equals(request.getRequestURI());
    }
}
