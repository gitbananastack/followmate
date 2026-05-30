package com.followmate.user.service;

import com.followmate.auth.entity.User;
import com.followmate.auth.repository.UserRepository;
import com.followmate.user.dto.ChangePasswordRequest;
import com.followmate.user.dto.CurrentUserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserAccountService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public CurrentUserResponse getCurrentUser() {
        return toResponse(getAuthenticatedUser());
    }

    public void changePassword(ChangePasswordRequest request) {
        User user = getAuthenticatedUser();

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setForcePasswordChange(false);
        userRepository.save(user);
    }

    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AccessDeniedException("Authenticated user not found"));
    }

    private CurrentUserResponse toResponse(User user) {
        return CurrentUserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().getRoleName())
                .organizationId(user.getOrganizationId())
                .status(user.getStatus())
                .build();
    }
}
