package com.followmate.followup.service;

import com.followmate.followup.dto.FollowupRequest;
import com.followmate.followup.dto.FollowupResponse;
import com.followmate.followup.entity.Followup;
import com.followmate.followup.repository.FollowupRepository;
import com.followmate.lead.repository.LeadRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FollowupService {

    private static final String PENDING_STATUS = "PENDING";
    private static final String COMPLETED_STATUS = "COMPLETED";

    private final FollowupRepository followupRepository;
    private final LeadRepository leadRepository;

    public FollowupResponse createFollowup(FollowupRequest request) {
        validateLead(request.getLeadId());

        Followup followup = Followup.builder()
                .leadId(request.getLeadId())
                .followupDate(request.getFollowupDate())
                .remarks(request.getRemarks())
                .status(resolveStatus(request.getStatus()))
                .build();

        return toResponse(followupRepository.save(followup));
    }

    public List<FollowupResponse> getFollowupsByLeadId(Long leadId) {
        return followupRepository.findByLeadId(leadId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<FollowupResponse> getAllFollowups() {
        return followupRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public FollowupResponse markComplete(Long id) {
        Followup followup = findFollowupById(id);
        followup.setStatus(COMPLETED_STATUS);
        return toResponse(followupRepository.save(followup));
    }

    public FollowupResponse rescheduleFollowup(Long id, FollowupRequest request) {
        Followup followup = findFollowupById(id);
        followup.setFollowupDate(request.getFollowupDate());
        followup.setRemarks(request.getRemarks());
        followup.setStatus(resolveStatus(request.getStatus()));
        return toResponse(followupRepository.save(followup));
    }

    private void validateLead(Long leadId) {
        if (!leadRepository.existsById(leadId)) {
            throw new RuntimeException("Lead not found with id: " + leadId);
        }
    }

    private Followup findFollowupById(Long id) {
        return followupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Follow-up not found with id: " + id));
    }

    private String resolveStatus(String status) {
        if (status == null || status.isBlank()) {
            return PENDING_STATUS;
        }

        return status.trim();
    }

    private FollowupResponse toResponse(Followup followup) {
        return FollowupResponse.builder()
                .id(followup.getId())
                .leadId(followup.getLeadId())
                .followupDate(followup.getFollowupDate())
                .remarks(followup.getRemarks())
                .status(followup.getStatus())
                .createdAt(followup.getCreatedAt())
                .updatedAt(followup.getUpdatedAt())
                .build();
    }
}
