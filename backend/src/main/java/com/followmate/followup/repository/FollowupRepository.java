package com.followmate.followup.repository;

import com.followmate.followup.entity.Followup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FollowupRepository extends JpaRepository<Followup, Long> {

    @Override
    List<Followup> findAll();

    List<Followup> findByLeadId(Long leadId);
}
