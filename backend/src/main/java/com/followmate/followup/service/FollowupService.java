package com.followmate.followup.service;

import com.followmate.auth.entity.User;
import com.followmate.followup.dto.FollowupRequest;
import com.followmate.followup.dto.FollowupResponse;
import com.followmate.followup.entity.Followup;
import com.followmate.followup.repository.FollowupRepository;
import com.followmate.lead.entity.Lead;
import com.followmate.lead.repository.LeadRepository;
import com.followmate.security.AuthenticatedUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FollowupService {

    private static final String PENDING_STATUS = "PENDING";
    private static final String COMPLETED_STATUS = "COMPLETED";

    private final FollowupRepository followupRepository;
    private final LeadRepository leadRepository;
    private final AuthenticatedUserService authenticatedUserService;

    public FollowupResponse createFollowup(FollowupRequest request) {
        Lead lead = findAccessibleLeadById(request.getLeadId());

        Followup followup = Followup.builder()
                .leadId(lead.getId())
                .followupDate(request.getFollowupDate())
                .remarks(request.getRemarks())
                .status(resolveStatus(request.getStatus()))
                .build();

        return toResponse(followupRepository.save(followup));
    }

    public List<FollowupResponse> getFollowupsByLeadId(Long leadId) {
        findAccessibleLeadById(leadId);
        return followupRepository.findByLeadId(leadId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<FollowupResponse> getAllFollowups() {
        User currentUser = authenticatedUserService.getCurrentUser();
        List<Followup> followups;

        if (authenticatedUserService.isSuperAdmin(currentUser)) {
            followups = followupRepository.findAll();
        } else {
            List<Long> leadIds = leadRepository
                    .findByOrganizationId(authenticatedUserService.requireOrganizationId(currentUser))
                    .stream()
                    .map(Lead::getId)
                    .toList();
            followups = leadIds.isEmpty() ? List.of() : followupRepository.findByLeadIdIn(leadIds);
        }

        return followups
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public FollowupResponse markComplete(Long id) {
        Followup followup = findAccessibleFollowupById(id);
        followup.setStatus(COMPLETED_STATUS);
        return toResponse(followupRepository.save(followup));
    }

    public FollowupResponse rescheduleFollowup(Long id, FollowupRequest request) {
        Followup followup = findAccessibleFollowupById(id);
        followup.setFollowupDate(request.getFollowupDate());
        followup.setRemarks(request.getRemarks());
        followup.setStatus(resolveStatus(request.getStatus()));
        return toResponse(followupRepository.save(followup));
    }

    private Followup findFollowupById(Long id) {
        return followupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Follow-up not found with id: " + id));
    }

    private Lead findAccessibleLeadById(Long leadId) {
        User currentUser = authenticatedUserService.getCurrentUser();

        if (authenticatedUserService.isSuperAdmin(currentUser)) {
            return leadRepository.findById(leadId)
                    .orElseThrow(() -> new RuntimeException("Lead not found with id: " + leadId));
        }

        return leadRepository
                .findByIdAndOrganizationId(leadId, authenticatedUserService.requireOrganizationId(currentUser))
                .orElseThrow(() -> new AccessDeniedException("Access denied"));
    }

    private Followup findAccessibleFollowupById(Long id) {
        Followup followup = findFollowupById(id);
        findAccessibleLeadById(followup.getLeadId());
        return followup;
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
