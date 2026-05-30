package com.followmate.subscription.service;

import com.followmate.addon.service.AddonService;
import com.followmate.auth.entity.User;
import com.followmate.organization.repository.OrganizationRepository;
import com.followmate.security.AuthenticatedUserService;
import com.followmate.subscription.dto.FeatureResponse;
import com.followmate.subscription.dto.OrganizationFeaturesResponse;
import com.followmate.subscription.dto.OrganizationSubscriptionRequest;
import com.followmate.subscription.dto.OrganizationSubscriptionResponse;
import com.followmate.subscription.dto.SubscriptionPlanResponse;
import com.followmate.subscription.entity.FeatureMaster;
import com.followmate.subscription.entity.OrganizationSubscription;
import com.followmate.subscription.entity.PlanFeature;
import com.followmate.subscription.entity.SubscriptionPlan;
import com.followmate.subscription.repository.FeatureMasterRepository;
import com.followmate.subscription.repository.OrganizationSubscriptionRepository;
import com.followmate.subscription.repository.PlanFeatureRepository;
import com.followmate.subscription.repository.SubscriptionPlanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubscriptionService {

    private static final Set<String> VALID_STATUSES = Set.of("TRIAL", "ACTIVE", "EXPIRED", "CANCELLED");
    private static final List<String> ACTIVE_STATUSES = List.of("ACTIVE", "TRIAL");

    private final FeatureMasterRepository featureMasterRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final PlanFeatureRepository planFeatureRepository;
    private final OrganizationSubscriptionRepository organizationSubscriptionRepository;
    private final OrganizationRepository organizationRepository;
    private final AuthenticatedUserService authenticatedUserService;
    private final AddonService addonService;

    public List<FeatureResponse> getFeatures() {
        User currentUser = authenticatedUserService.getCurrentUser();
        if (!authenticatedUserService.isSuperAdmin(currentUser)) {
            throw new AccessDeniedException("Access denied");
        }

        return featureMasterRepository.findByActiveTrueOrderByFeatureCodeAsc()
                .stream()
                .map(this::toFeatureResponse)
                .toList();
    }

    public List<SubscriptionPlanResponse> getPlans() {
        User currentUser = authenticatedUserService.getCurrentUser();
        if (!authenticatedUserService.isSuperAdmin(currentUser)) {
            throw new AccessDeniedException("Access denied");
        }

        return subscriptionPlanRepository.findByActiveTrueOrderByIdAsc()
                .stream()
                .map(this::toPlanResponse)
                .toList();
    }

    public OrganizationSubscriptionResponse getOrganizationSubscription(Long organizationId) {
        validateReadOrganizationScope(organizationId);
        OrganizationSubscription subscription = findActiveSubscription(organizationId);
        return toSubscriptionResponse(subscription);
    }

    @Transactional
    public OrganizationSubscriptionResponse assignOrganizationSubscription(
            Long organizationId,
            OrganizationSubscriptionRequest request
    ) {
        User currentUser = authenticatedUserService.getCurrentUser();
        if (!authenticatedUserService.isSuperAdmin(currentUser)) {
            throw new AccessDeniedException("Access denied");
        }

        validateOrganization(organizationId);
        SubscriptionPlan plan = subscriptionPlanRepository.findById(request.getPlanId())
                .filter(subscriptionPlan -> Boolean.TRUE.equals(subscriptionPlan.getActive()))
                .orElseThrow(() -> new IllegalArgumentException("Subscription plan not found"));
        validateDates(request.getStartDate(), request.getExpiryDate());
        cancelCurrentSubscriptions(organizationId);

        OrganizationSubscription subscription = organizationSubscriptionRepository.save(OrganizationSubscription.builder()
                .organizationId(organizationId)
                .planId(plan.getId())
                .startDate(request.getStartDate())
                .expiryDate(request.getExpiryDate())
                .status("ACTIVE")
                .build());

        return toSubscriptionResponse(subscription);
    }

    public OrganizationFeaturesResponse getOrganizationFeatures(Long organizationId) {
        validateReadOrganizationScope(organizationId);
        OrganizationSubscription subscription = findLatestActiveSubscription(organizationId).orElse(null);
        return OrganizationFeaturesResponse.builder()
                .features(getOrganizationFeatureCodes(organizationId, subscription))
                .build();
    }

    private void validateReadOrganizationScope(Long organizationId) {
        User currentUser = authenticatedUserService.getCurrentUser();
        validateOrganization(organizationId);

        if (authenticatedUserService.isSuperAdmin(currentUser)) {
            return;
        }

        Long userOrganizationId = authenticatedUserService.requireOrganizationId(currentUser);
        if (!userOrganizationId.equals(organizationId)) {
            throw new AccessDeniedException("Access denied");
        }
    }

    private OrganizationSubscription findActiveSubscription(Long organizationId) {
        return findLatestActiveSubscription(organizationId)
                .orElseThrow(() -> new IllegalArgumentException("No active subscription found"));
    }

    private java.util.Optional<OrganizationSubscription> findLatestActiveSubscription(Long organizationId) {
        return organizationSubscriptionRepository
                .findFirstByOrganizationIdAndStatusInOrderByIdDesc(organizationId, ACTIVE_STATUSES)
                .filter(this::isWithinSubscriptionWindow);
    }

    private void cancelCurrentSubscriptions(Long organizationId) {
        List<OrganizationSubscription> currentSubscriptions = organizationSubscriptionRepository
                .findByOrganizationIdAndStatusInOrderByIdDesc(organizationId, ACTIVE_STATUSES);

        currentSubscriptions.forEach(subscription -> subscription.setStatus("CANCELLED"));
        organizationSubscriptionRepository.saveAll(currentSubscriptions);
    }

    private boolean isWithinSubscriptionWindow(OrganizationSubscription subscription) {
        LocalDate today = LocalDate.now();
        return !today.isBefore(subscription.getStartDate()) && !today.isAfter(subscription.getExpiryDate());
    }

    private void validateOrganization(Long organizationId) {
        if (!organizationRepository.existsById(organizationId)) {
            throw new IllegalArgumentException("Organization not found with id: " + organizationId);
        }
    }

    private String normalizeStatus(String status) {
        String normalizedStatus = status == null ? "" : status.trim().toUpperCase();
        if (!VALID_STATUSES.contains(normalizedStatus)) {
            throw new IllegalArgumentException("Invalid subscription status");
        }
        return normalizedStatus;
    }

    private void validateDates(LocalDate startDate, LocalDate expiryDate) {
        if (expiryDate.isBefore(startDate)) {
            throw new IllegalArgumentException("Expiry date must be after start date");
        }
    }

    private FeatureResponse toFeatureResponse(FeatureMaster feature) {
        return FeatureResponse.builder()
                .id(feature.getId())
                .featureCode(feature.getFeatureCode())
                .featureName(feature.getFeatureName())
                .description(feature.getDescription())
                .active(feature.getActive())
                .build();
    }

    private SubscriptionPlanResponse toPlanResponse(SubscriptionPlan plan) {
        return SubscriptionPlanResponse.builder()
                .id(plan.getId())
                .planCode(plan.getPlanCode())
                .planName(plan.getPlanName())
                .monthlyPrice(plan.getMonthlyPrice())
                .active(plan.getActive())
                .features(getEnabledFeatures(plan.getId()))
                .build();
    }

    private OrganizationSubscriptionResponse toSubscriptionResponse(OrganizationSubscription subscription) {
        SubscriptionPlan plan = subscriptionPlanRepository.findById(subscription.getPlanId())
                .orElseThrow(() -> new IllegalArgumentException("Subscription plan not found"));

        return OrganizationSubscriptionResponse.builder()
                .id(subscription.getId())
                .organizationId(subscription.getOrganizationId())
                .planId(plan.getId())
                .planCode(plan.getPlanCode())
                .planName(plan.getPlanName())
                .startDate(subscription.getStartDate())
                .expiryDate(subscription.getExpiryDate())
                .status(subscription.getStatus())
                .features(getOrganizationFeatureCodes(subscription.getOrganizationId(), subscription))
                .createdAt(subscription.getCreatedAt())
                .updatedAt(subscription.getUpdatedAt())
                .build();
    }

    private List<String> getOrganizationFeatureCodes(Long organizationId, OrganizationSubscription subscription) {
        Set<String> featureCodes = new LinkedHashSet<>();
        if (subscription != null) {
            featureCodes.addAll(getEnabledFeatures(subscription.getPlanId()));
        }
        featureCodes.addAll(addonService.getEnabledAddonFeatureCodes(organizationId));
        return featureCodes.stream().sorted().toList();
    }

    private List<String> getEnabledFeatures(Long planId) {
        Map<String, Boolean> activeFeatures = featureMasterRepository.findByActiveTrueOrderByFeatureCodeAsc()
                .stream()
                .collect(Collectors.toMap(FeatureMaster::getFeatureCode, FeatureMaster::getActive));

        return planFeatureRepository.findByPlanIdAndEnabledTrue(planId)
                .stream()
                .map(PlanFeature::getFeatureCode)
                .filter(activeFeatures::containsKey)
                .sorted()
                .toList();
    }
}
