package com.followmate.addon.repository;

import com.followmate.addon.entity.OrganizationAddon;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OrganizationAddonRepository extends JpaRepository<OrganizationAddon, Long> {

    List<OrganizationAddon> findByOrganizationId(Long organizationId);

    List<OrganizationAddon> findByOrganizationIdAndEnabledTrue(Long organizationId);

    Optional<OrganizationAddon> findByOrganizationIdAndAddonId(Long organizationId, Long addonId);
}
