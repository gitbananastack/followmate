package com.followmate.auth.service;

import com.followmate.auth.entity.Role;
import com.followmate.auth.entity.User;
import com.followmate.auth.repository.RoleRepository;
import com.followmate.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DataLoader implements CommandLineRunner {

    private static final String DEFAULT_ADMIN_EMAIL = "admin@followmate.com";

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        List.of("SUPER_ADMIN", "ORG_ADMIN", "STAFF")
                .forEach(roleName -> roleRepository.findByRoleName(roleName)
                        .orElseGet(() -> roleRepository.save(Role.builder().roleName(roleName).build())));

        Role superAdminRole = roleRepository.findByRoleName("SUPER_ADMIN")
                .orElseThrow(() -> new IllegalStateException("SUPER_ADMIN role was not created"));

        if (!userRepository.existsByEmail(DEFAULT_ADMIN_EMAIL)) {
            userRepository.save(User.builder()
                    .name("Super Admin")
                    .email(DEFAULT_ADMIN_EMAIL)
                    .password(passwordEncoder.encode("admin123"))
                    .status("ACTIVE")
                    .role(superAdminRole)
                    .build());
        }
    }
}
