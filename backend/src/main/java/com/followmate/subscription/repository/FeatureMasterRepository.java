package com.followmate.subscription.repository;

import com.followmate.subscription.entity.FeatureMaster;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FeatureMasterRepository extends JpaRepository<FeatureMaster, Long> {

    Optional<FeatureMaster> findByFeatureCode(String featureCode);

    boolean existsByFeatureCode(String featureCode);

    List<FeatureMaster> findByActiveTrueOrderByFeatureCodeAsc();
}
