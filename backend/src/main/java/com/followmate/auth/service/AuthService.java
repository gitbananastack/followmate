package com.followmate.auth.service;

import com.followmate.auth.dto.LoginRequest;
import com.followmate.auth.dto.LoginResponse;
import com.followmate.auth.entity.User;
import com.followmate.auth.repository.UserRepository;
import com.followmate.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String ACTIVE_STATUS = "ACTIVE";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        if (!ACTIVE_STATUS.equalsIgnoreCase(user.getStatus())) {
            throw new BadCredentialsException("User account is not active");
        }

        return LoginResponse.builder()
                .token(jwtUtil.generateToken(user))
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().getRoleName())
                .organizationId(user.getOrganizationId())
                .forcePasswordChange(Boolean.TRUE.equals(user.getForcePasswordChange()))
                .build();
    }
}
