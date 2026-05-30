package com.followmate.setup.repository;

import com.followmate.setup.entity.BusinessTemplateMaster;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BusinessTemplateMasterRepository extends JpaRepository<BusinessTemplateMaster, Long> {

    Optional<BusinessTemplateMaster> findByBusinessTypeAndActiveTrue(String businessType);
}
