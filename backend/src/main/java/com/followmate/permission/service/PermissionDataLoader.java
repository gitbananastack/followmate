package com.followmate.permission.service;

import com.followmate.permission.entity.Permission;
import com.followmate.permission.repository.PermissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Order(2)
@RequiredArgsConstructor
public class PermissionDataLoader implements CommandLineRunner {

    private final PermissionRepository permissionRepository;

    @Override
    public void run(String... args) {
        defaultPermissions().forEach(permissionSeed -> {
            if (!permissionRepository.existsByPermissionCode(permissionSeed.permissionCode())) {
                permissionRepository.save(Permission.builder()
                        .permissionCode(permissionSeed.permissionCode())
                        .permissionName(permissionSeed.permissionName())
                        .category(permissionSeed.category())
                        .active(true)
                        .build());
            }
        });
    }

    private List<PermissionSeed> defaultPermissions() {
        return List.of(
                new PermissionSeed("DASHBOARD_VIEW", "View Dashboard", "Dashboard"),
                new PermissionSeed("PIPELINE_VIEW", "View Pipeline", "Pipeline"),
                new PermissionSeed("LEAD_VIEW", "View Leads", "Leads"),
                new PermissionSeed("LEAD_CREATE", "Create Leads", "Leads"),
                new PermissionSeed("LEAD_EDIT", "Edit Leads", "Leads"),
                new PermissionSeed("LEAD_DELETE", "Delete Leads", "Leads"),
                new PermissionSeed("FOLLOWUP_VIEW", "View Follow-ups", "Follow-ups"),
                new PermissionSeed("FOLLOWUP_CREATE", "Create Follow-ups", "Follow-ups"),
                new PermissionSeed("FOLLOWUP_COMPLETE", "Complete Follow-ups", "Follow-ups"),
                new PermissionSeed("REPORT_VIEW", "View Reports", "Reports"),
                new PermissionSeed("SETTINGS_VIEW", "View Settings", "Settings"),
                new PermissionSeed("USER_MANAGE", "Manage Users", "Users"),
                new PermissionSeed("ARTWORK_VIEW", "View Artwork", "Artwork"),
                new PermissionSeed("ARTWORK_MANAGE", "Manage Artwork", "Artwork"),
                new PermissionSeed("CSV_IMPORT", "Import CSV", "Import"),
                new PermissionSeed("CONNECTOR_VIEW", "View Connectors", "Connectors")
        );
    }

    private record PermissionSeed(String permissionCode, String permissionName, String category) {
    }
}
