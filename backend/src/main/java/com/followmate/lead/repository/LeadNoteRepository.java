package com.followmate.lead.repository;

import com.followmate.lead.entity.LeadNote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LeadNoteRepository extends JpaRepository<LeadNote, Long> {

    List<LeadNote> findByLeadIdOrderByCreatedAtDesc(Long leadId);

    void deleteByLeadId(Long leadId);
}
