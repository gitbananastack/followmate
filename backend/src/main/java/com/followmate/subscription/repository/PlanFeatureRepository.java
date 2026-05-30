package com.followmate.subscription.repository;

import com.followmate.subscription.entity.PlanFeature;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PlanFeatureRepository extends JpaRepository<PlanFeature, Long> {

    List<PlanFeature> findByPlanIdAndEnabledTrue(Long planId);

    Optional<PlanFeature> findByPlanIdAndFeatureCode(Long planId, String featureCode);

    boolean existsByPlanIdAndFeatureCodeAndEnabledTrue(Long planId, String featureCode);
}
