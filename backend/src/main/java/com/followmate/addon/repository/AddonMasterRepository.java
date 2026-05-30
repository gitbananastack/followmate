package com.followmate.addon.repository;

import com.followmate.addon.entity.AddonMaster;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AddonMasterRepository extends JpaRepository<AddonMaster, Long> {

    Optional<AddonMaster> findByAddonCode(String addonCode);

    boolean existsByAddonCode(String addonCode);

    List<AddonMaster> findByActiveTrueOrderByAddonNameAsc();
}
