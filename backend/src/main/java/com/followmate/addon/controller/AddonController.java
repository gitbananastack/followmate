package com.followmate.addon.controller;

import com.followmate.addon.dto.AddonEnableRequest;
import com.followmate.addon.dto.AddonResponse;
import com.followmate.addon.dto.OrganizationAddonResponse;
import com.followmate.addon.service.AddonService;
import com.followmate.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AddonController {

    private final AddonService addonService;

    @GetMapping("/addons")
    public ResponseEntity<ApiResponse<List<AddonResponse>>> getAddons() {
        return ResponseEntity.ok(ApiResponse.success("Add-ons fetched successfully",
                addonService.getActiveAddons()));
    }

    @GetMapping("/organizations/{orgId}/addons")
    public ResponseEntity<ApiResponse<List<OrganizationAddonResponse>>> getOrganizationAddons(
            @PathVariable Long orgId
    ) {
        return ResponseEntity.ok(ApiResponse.success("Organization add-ons fetched successfully",
                addonService.getOrganizationAddons(orgId)));
    }

    @PostMapping("/organizations/{orgId}/addons/{addonId}/enable")
    public ResponseEntity<ApiResponse<OrganizationAddonResponse>> enableAddon(
            @PathVariable Long orgId,
            @PathVariable Long addonId,
            @Valid @RequestBody AddonEnableRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Add-on enabled successfully",
                addonService.enableAddon(orgId, addonId, request)));
    }

    @PostMapping("/organizations/{orgId}/addons/{addonId}/disable")
    public ResponseEntity<ApiResponse<OrganizationAddonResponse>> disableAddon(
            @PathVariable Long orgId,
            @PathVariable Long addonId
    ) {
        return ResponseEntity.ok(ApiResponse.success("Add-on disabled successfully",
                addonService.disableAddon(orgId, addonId)));
    }
}
