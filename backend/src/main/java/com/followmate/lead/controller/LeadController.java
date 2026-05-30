package com.followmate.lead.controller;

import com.followmate.common.ApiResponse;
import com.followmate.lead.dto.LeadFieldsUpdateRequest;
import com.followmate.lead.dto.LeadNoteRequest;
import com.followmate.lead.dto.LeadRequest;
import com.followmate.lead.dto.LeadResponse;
import com.followmate.lead.dto.LeadStageRequest;
import com.followmate.lead.service.LeadService;
import com.followmate.security.RoleAuthorizationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Validated
@RestController
@RequestMapping("/api/leads")
@RequiredArgsConstructor
public class LeadController {

    private final LeadService leadService;
    private final RoleAuthorizationService roleAuthorizationService;

    @PostMapping
    public ResponseEntity<ApiResponse<LeadResponse>> createLead(@Valid @RequestBody LeadRequest request) {
        roleAuthorizationService.requireOrgAdmin();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Lead created successfully", leadService.createLead(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<LeadResponse>>> getAllLeads(
            @RequestParam(required = false) Long organizationId
    ) {
        roleAuthorizationService.requireBusinessUser();
        return ResponseEntity.ok(ApiResponse.success("Leads fetched successfully",
                leadService.getAllLeads(organizationId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<LeadResponse>> getLeadById(@PathVariable Long id) {
        roleAuthorizationService.requireBusinessUser();
        return ResponseEntity.ok(ApiResponse.success("Lead fetched successfully", leadService.getLeadById(id)));
    }

    @PutMapping("/{id}/stage")
    public ResponseEntity<ApiResponse<LeadResponse>> updateLeadStage(
            @PathVariable Long id,
            @Valid @RequestBody LeadStageRequest request
    ) {
        roleAuthorizationService.requireBusinessUser();
        return ResponseEntity.ok(ApiResponse.success("Lead stage updated successfully",
                leadService.updateLeadStage(id, request.getCurrentStage())));
    }

    @PutMapping("/{id}/fields")
    public ResponseEntity<ApiResponse<LeadResponse>> updateLeadFields(
            @PathVariable Long id,
            @Valid @RequestBody LeadFieldsUpdateRequest request
    ) {
        roleAuthorizationService.requireBusinessUser();
        return ResponseEntity.ok(ApiResponse.success("Lead fields updated successfully",
                leadService.updateLeadFields(id, request.getFields())));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteLead(@PathVariable Long id) {
        roleAuthorizationService.requireOrgAdmin();
        leadService.deleteLead(id);
        return ResponseEntity.ok(ApiResponse.success("Lead deleted successfully", null));
    }

    @PostMapping("/{id}/notes")
    public ResponseEntity<ApiResponse<LeadResponse>> addNoteToLead(
            @PathVariable Long id,
            @Valid @RequestBody LeadNoteRequest request
    ) {
        roleAuthorizationService.requireBusinessUser();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Lead note added successfully", leadService.addNoteToLead(id, request)));
    }
}
