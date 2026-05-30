package com.followmate.followup.controller;

import com.followmate.common.ApiResponse;
import com.followmate.followup.dto.FollowupRequest;
import com.followmate.followup.dto.FollowupResponse;
import com.followmate.followup.service.FollowupService;
import com.followmate.security.RoleAuthorizationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Validated
@RestController
@RequestMapping("/api/followups")
@RequiredArgsConstructor
public class FollowupController {

    private final FollowupService followupService;
    private final RoleAuthorizationService roleAuthorizationService;

    @PostMapping
    public ResponseEntity<ApiResponse<FollowupResponse>> createFollowup(
            @Valid @RequestBody FollowupRequest request
    ) {
        roleAuthorizationService.requireOrgAdmin();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Followup created successfully",
                        followupService.createFollowup(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<FollowupResponse>>> getAllFollowups() {
        roleAuthorizationService.requireBusinessUser();
        return ResponseEntity.ok(ApiResponse.success("Followups fetched successfully",
                followupService.getAllFollowups()));
    }

    @GetMapping("/lead/{leadId}")
    public ResponseEntity<ApiResponse<List<FollowupResponse>>> getFollowupsByLeadId(@PathVariable Long leadId) {
        roleAuthorizationService.requireBusinessUser();
        return ResponseEntity.ok(ApiResponse.success("Followups fetched successfully",
                followupService.getFollowupsByLeadId(leadId)));
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<ApiResponse<FollowupResponse>> markComplete(@PathVariable Long id) {
        roleAuthorizationService.requireBusinessUser();
        return ResponseEntity.ok(ApiResponse.success("Followup marked as completed successfully",
                followupService.markComplete(id)));
    }

    @PutMapping("/{id}/reschedule")
    public ResponseEntity<ApiResponse<FollowupResponse>> rescheduleFollowup(
            @PathVariable Long id,
            @Valid @RequestBody FollowupRequest request
    ) {
        roleAuthorizationService.requireBusinessUser();
        return ResponseEntity.ok(ApiResponse.success("Followup rescheduled successfully",
                followupService.rescheduleFollowup(id, request)));
    }
}
