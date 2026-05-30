package com.followmate.subscription.service;

import com.followmate.subscription.entity.FeatureMaster;
import com.followmate.subscription.entity.PlanFeature;
import com.followmate.subscription.entity.SubscriptionPlan;
import com.followmate.subscription.repository.FeatureMasterRepository;
import com.followmate.subscription.repository.PlanFeatureRepository;
import com.followmate.subscription.repository.SubscriptionPlanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class SubscriptionSeedDataLoader implements CommandLineRunner {

    private static final List<String> ALL_FEATURES = List.of(
            "LEADS",
            "PIPELINE",
            "FOLLOWUPS",
            "CSV_IMPORT",
            "REPORTS",
            "WHATSAPP_CONNECTOR",
            "FACEBOOK_CONNECTOR",
            "INSTAGRAM_CONNECTOR"
    );

    private final FeatureMasterRepository featureMasterRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final PlanFeatureRepository planFeatureRepository;

    @Override
    public void run(String... args) {
        seedFeatures();
        Map<String, SubscriptionPlan> plans = seedPlans();
        seedPlanFeatures(plans);
    }

    private void seedFeatures() {
        featureSeeds().forEach(featureSeed -> {
            if (!featureMasterRepository.existsByFeatureCode(featureSeed.featureCode())) {
                featureMasterRepository.save(FeatureMaster.builder()
                        .featureCode(featureSeed.featureCode())
                        .featureName(featureSeed.featureName())
                        .description(featureSeed.description())
                        .active(true)
                        .build());
            }
        });
    }

    private Map<String, SubscriptionPlan> seedPlans() {
        planSeeds().forEach(planSeed -> {
            if (!subscriptionPlanRepository.existsByPlanCode(planSeed.planCode())) {
                subscriptionPlanRepository.save(SubscriptionPlan.builder()
                        .planCode(planSeed.planCode())
                        .planName(planSeed.planName())
                        .monthlyPrice(planSeed.monthlyPrice())
                        .active(true)
                        .build());
            }
        });

        return subscriptionPlanRepository.findAll()
                .stream()
                .collect(java.util.stream.Collectors.toMap(SubscriptionPlan::getPlanCode, plan -> plan));
    }

    private void seedPlanFeatures(Map<String, SubscriptionPlan> plans) {
        planFeatureSeeds().forEach((planCode, features) -> {
            SubscriptionPlan plan = plans.get(planCode);
            if (plan == null) {
                return;
            }

            features.forEach(featureCode -> {
                PlanFeature planFeature = planFeatureRepository
                        .findByPlanIdAndFeatureCode(plan.getId(), featureCode)
                        .orElseGet(() -> PlanFeature.builder()
                            .planId(plan.getId())
                            .featureCode(featureCode)
                            .build());

                if (!Boolean.TRUE.equals(planFeature.getEnabled())) {
                    planFeature.setEnabled(true);
                }

                planFeatureRepository.save(planFeature);
            });
        });
    }

    private List<FeatureSeed> featureSeeds() {
        return List.of(
                new FeatureSeed("LEADS", "Leads", "Create and manage leads"),
                new FeatureSeed("PIPELINE", "Pipeline", "Track leads through pipeline stages"),
                new FeatureSeed("FOLLOWUPS", "Follow-ups", "Manage lead follow-ups"),
                new FeatureSeed("CSV_IMPORT", "CSV Import", "Bulk import leads from CSV files"),
                new FeatureSeed("REPORTS", "Reports", "View business reports"),
                new FeatureSeed("WHATSAPP_CONNECTOR", "WhatsApp Connector", "Connect WhatsApp messaging"),
                new FeatureSeed("FACEBOOK_CONNECTOR", "Facebook Connector", "Connect Facebook lead sources"),
                new FeatureSeed("INSTAGRAM_CONNECTOR", "Instagram Connector", "Connect Instagram lead sources")
        );
    }

    private List<PlanSeed> planSeeds() {
        return List.of(
                new PlanSeed("STARTER", "Starter", new BigDecimal("999.00")),
                new PlanSeed("GROWTH", "Growth", new BigDecimal("2499.00")),
                new PlanSeed("PRO", "Pro", new BigDecimal("4999.00")),
                new PlanSeed("ENTERPRISE", "Enterprise", new BigDecimal("0.00"))
        );
    }

    private Map<String, List<String>> planFeatureSeeds() {
        return Map.of(
                "STARTER", List.of("LEADS", "PIPELINE", "FOLLOWUPS"),
                "GROWTH", List.of("LEADS", "PIPELINE", "FOLLOWUPS", "CSV_IMPORT", "REPORTS"),
                "PRO", List.of("LEADS", "PIPELINE", "FOLLOWUPS", "CSV_IMPORT", "REPORTS",
                        "WHATSAPP_CONNECTOR", "FACEBOOK_CONNECTOR", "INSTAGRAM_CONNECTOR"),
                "ENTERPRISE", ALL_FEATURES
        );
    }

    private record FeatureSeed(String featureCode, String featureName, String description) {
    }

    private record PlanSeed(String planCode, String planName, BigDecimal monthlyPrice) {
    }
}
