package com.followmate.subscription.repository;

import com.followmate.subscription.entity.OrganizationSubscription;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OrganizationSubscriptionRepository extends JpaRepository<OrganizationSubscription, Long> {

    List<OrganizationSubscription> findByOrganizationIdOrderByStartDateDesc(Long organizationId);

    List<OrganizationSubscription> findByOrganizationIdAndStatusInOrderByIdDesc(
            Long organizationId,
            List<String> statuses
    );

    Optional<OrganizationSubscription> findFirstByOrganizationIdAndStatusInOrderByIdDesc(
            Long organizationId,
            List<String> statuses
    );
}
