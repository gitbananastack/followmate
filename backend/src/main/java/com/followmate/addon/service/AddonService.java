package com.followmate.addon.service;

import com.followmate.addon.dto.AddonEnableRequest;
import com.followmate.addon.dto.AddonResponse;
import com.followmate.addon.dto.OrganizationAddonResponse;
import com.followmate.addon.entity.AddonMaster;
import com.followmate.addon.entity.OrganizationAddon;
import com.followmate.addon.repository.AddonMasterRepository;
import com.followmate.addon.repository.OrganizationAddonRepository;
import com.followmate.auth.entity.User;
import com.followmate.organization.repository.OrganizationRepository;
import com.followmate.security.AuthenticatedUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AddonService {

    private final AddonMasterRepository addonMasterRepository;
    private final OrganizationAddonRepository organizationAddonRepository;
    private final OrganizationRepository organizationRepository;
    private final AuthenticatedUserService authenticatedUserService;

    public List<AddonResponse> getActiveAddons() {
        User currentUser = authenticatedUserService.getCurrentUser();
        if (!authenticatedUserService.isSuperAdmin(currentUser)) {
            throw new AccessDeniedException("Access denied");
        }

        return addonMasterRepository.findByActiveTrueOrderByAddonNameAsc()
                .stream()
                .map(this::toAddonResponse)
                .toList();
    }

    public List<OrganizationAddonResponse> getOrganizationAddons(Long organizationId) {
        User currentUser = authenticatedUserService.getCurrentUser();
        validateOrganization(organizationId);

        if (authenticatedUserService.isSuperAdmin(currentUser)) {
            return getAllOrganizationAddonStates(organizationId);
        }

        String role = currentUser.getRole().getRoleName();
        if (!AuthenticatedUserService.ORG_ADMIN_ROLE.equals(role)) {
            throw new AccessDeniedException("Access denied");
        }

        Long userOrganizationId = authenticatedUserService.requireOrganizationId(currentUser);
        if (!userOrganizationId.equals(organizationId)) {
            throw new AccessDeniedException("Access denied");
        }

        return getCurrentlyEnabledOrganizationAddons(organizationId);
    }

    @Transactional
    public OrganizationAddonResponse enableAddon(Long organizationId, Long addonId, AddonEnableRequest request) {
        requireSuperAdmin();
        validateOrganization(organizationId);
        validateDates(request.getStartDate(), request.getExpiryDate());
        AddonMaster addon = findActiveAddon(addonId);

        OrganizationAddon organizationAddon = organizationAddonRepository
                .findByOrganizationIdAndAddonId(organizationId, addonId)
                .orElseGet(() -> OrganizationAddon.builder()
                        .organizationId(organizationId)
                        .addonId(addonId)
                        .build());

        organizationAddon.setEnabled(true);
        organizationAddon.setStartDate(request.getStartDate());
        organizationAddon.setExpiryDate(request.getExpiryDate());

        return toOrganizationAddonResponse(organizationAddonRepository.save(organizationAddon), addon);
    }

    @Transactional
    public OrganizationAddonResponse disableAddon(Long organizationId, Long addonId) {
        requireSuperAdmin();
        validateOrganization(organizationId);
        AddonMaster addon = findActiveAddon(addonId);
        OrganizationAddon organizationAddon = organizationAddonRepository
                .findByOrganizationIdAndAddonId(organizationId, addonId)
                .orElseThrow(() -> new IllegalArgumentException("Organization add-on not found"));

        organizationAddon.setEnabled(false);
        return toOrganizationAddonResponse(organizationAddonRepository.save(organizationAddon), addon);
    }

    public List<String> getEnabledAddonFeatureCodes(Long organizationId) {
        LocalDate today = LocalDate.now();
        Map<Long, AddonMaster> activeAddonsById = addonMasterRepository.findByActiveTrueOrderByAddonNameAsc()
                .stream()
                .collect(Collectors.toMap(AddonMaster::getId, Function.identity()));

        return organizationAddonRepository.findByOrganizationIdAndEnabledTrue(organizationId)
                .stream()
                .filter(addon -> isWithinAddonWindow(addon, today))
                .map(addon -> activeAddonsById.get(addon.getAddonId()))
                .filter(addon -> addon != null)
                .map(AddonMaster::getFeatureCode)
                .distinct()
                .sorted()
                .toList();
    }

    public boolean hasEnabledAddonFeature(Long organizationId, String featureCode) {
        return getEnabledAddonFeatureCodes(organizationId).contains(featureCode);
    }

    private List<OrganizationAddonResponse> getAllOrganizationAddonStates(Long organizationId) {
        Map<Long, OrganizationAddon> orgAddonsByAddonId = organizationAddonRepository.findByOrganizationId(organizationId)
                .stream()
                .collect(Collectors.toMap(OrganizationAddon::getAddonId, Function.identity()));

        return addonMasterRepository.findByActiveTrueOrderByAddonNameAsc()
                .stream()
                .map(addon -> toOrganizationAddonResponse(orgAddonsByAddonId.get(addon.getId()), addon, organizationId))
                .toList();
    }

    private List<OrganizationAddonResponse> getCurrentlyEnabledOrganizationAddons(Long organizationId) {
        LocalDate today = LocalDate.now();
        Map<Long, AddonMaster> activeAddonsById = addonMasterRepository.findByActiveTrueOrderByAddonNameAsc()
                .stream()
                .collect(Collectors.toMap(AddonMaster::getId, Function.identity()));

        return organizationAddonRepository.findByOrganizationIdAndEnabledTrue(organizationId)
                .stream()
                .filter(addon -> isWithinAddonWindow(addon, today))
                .map(addon -> toOrganizationAddonResponse(addon, activeAddonsById.get(addon.getAddonId())))
                .filter(response -> response.getAddonId() != null)
                .toList();
    }

    private void requireSuperAdmin() {
        if (!authenticatedUserService.isSuperAdmin(authenticatedUserService.getCurrentUser())) {
            throw new AccessDeniedException("Access denied");
        }
    }

    private AddonMaster findActiveAddon(Long addonId) {
        return addonMasterRepository.findById(addonId)
                .filter(addon -> Boolean.TRUE.equals(addon.getActive()))
                .orElseThrow(() -> new IllegalArgumentException("Add-on not found"));
    }

    private void validateOrganization(Long organizationId) {
        if (!organizationRepository.existsById(organizationId)) {
            throw new IllegalArgumentException("Organization not found with id: " + organizationId);
        }
    }

    private void validateDates(LocalDate startDate, LocalDate expiryDate) {
        if (expiryDate.isBefore(startDate)) {
            throw new IllegalArgumentException("Expiry date must be after start date");
        }
    }

    private boolean isWithinAddonWindow(OrganizationAddon addon, LocalDate today) {
        return !today.isBefore(addon.getStartDate()) && !today.isAfter(addon.getExpiryDate());
    }

    private AddonResponse toAddonResponse(AddonMaster addon) {
        return AddonResponse.builder()
                .id(addon.getId())
                .addonCode(addon.getAddonCode())
                .addonName(addon.getAddonName())
                .description(addon.getDescription())
                .monthlyPrice(addon.getMonthlyPrice())
                .featureCode(addon.getFeatureCode())
                .active(addon.getActive())
                .build();
    }

    private OrganizationAddonResponse toOrganizationAddonResponse(OrganizationAddon organizationAddon, AddonMaster addon) {
        return toOrganizationAddonResponse(organizationAddon, addon, organizationAddon.getOrganizationId());
    }

    private OrganizationAddonResponse toOrganizationAddonResponse(
            OrganizationAddon organizationAddon,
            AddonMaster addon,
            Long organizationId
    ) {
        if (addon == null) {
            return OrganizationAddonResponse.builder().build();
        }

        return OrganizationAddonResponse.builder()
                .organizationAddonId(organizationAddon == null ? null : organizationAddon.getId())
                .organizationId(organizationId)
                .addonId(addon.getId())
                .addonCode(addon.getAddonCode())
                .addonName(addon.getAddonName())
                .description(addon.getDescription())
                .monthlyPrice(addon.getMonthlyPrice())
                .featureCode(addon.getFeatureCode())
                .enabled(organizationAddon != null && Boolean.TRUE.equals(organizationAddon.getEnabled()))
                .startDate(organizationAddon == null ? null : organizationAddon.getStartDate())
                .expiryDate(organizationAddon == null ? null : organizationAddon.getExpiryDate())
                .build();
    }
}
