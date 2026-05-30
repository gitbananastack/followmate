package com.followmate.subscription.service;

import com.followmate.addon.service.AddonService;
import com.followmate.subscription.entity.OrganizationSubscription;
import com.followmate.subscription.repository.OrganizationSubscriptionRepository;
import com.followmate.subscription.repository.PlanFeatureRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FeatureAccessService {

    private static final List<String> ACTIVE_STATUSES = List.of("ACTIVE", "TRIAL");

    private final OrganizationSubscriptionRepository organizationSubscriptionRepository;
    private final PlanFeatureRepository planFeatureRepository;
    private final AddonService addonService;

    public boolean hasFeature(Long organizationId, String featureCode) {
        if (organizationId == null || !StringUtils.hasText(featureCode)) {
            return false;
        }

        String normalizedFeatureCode = featureCode.trim().toUpperCase();
        boolean planHasFeature = organizationSubscriptionRepository
                .findFirstByOrganizationIdAndStatusInOrderByIdDesc(organizationId, ACTIVE_STATUSES)
                .filter(this::isWithinSubscriptionWindow)
                .map(subscription -> planFeatureRepository.existsByPlanIdAndFeatureCodeAndEnabledTrue(
                        subscription.getPlanId(),
                        normalizedFeatureCode
                ))
                .orElse(false);

        return planHasFeature || addonService.hasEnabledAddonFeature(organizationId, normalizedFeatureCode);
    }

    private boolean isWithinSubscriptionWindow(OrganizationSubscription subscription) {
        LocalDate today = LocalDate.now();
        return !today.isBefore(subscription.getStartDate()) && !today.isAfter(subscription.getExpiryDate());
    }
}
