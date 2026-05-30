package com.followmate.template.controller;

import com.followmate.common.ApiResponse;
import com.followmate.template.dto.TemplateFieldRequest;
import com.followmate.template.dto.TemplateFieldResponse;
import com.followmate.template.dto.TemplateRequest;
import com.followmate.template.dto.TemplateResponse;
import com.followmate.template.service.TemplateService;
import com.followmate.security.RequirePermission;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/templates")
@RequiredArgsConstructor
public class TemplateController {

    private final TemplateService templateService;

    @PostMapping
    @RequirePermission("SETTINGS_VIEW")
    public ResponseEntity<ApiResponse<TemplateResponse>> createTemplate(@Valid @RequestBody TemplateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Template created successfully", templateService.createTemplate(request)));
    }

    @PostMapping("/{id}/fields")
    @RequirePermission("SETTINGS_VIEW")
    public ResponseEntity<ApiResponse<TemplateFieldResponse>> addFieldToTemplate(
            @PathVariable Long id,
            @Valid @RequestBody TemplateFieldRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Template field added successfully",
                        templateService.addFieldToTemplate(id, request)));
    }

    @GetMapping
    @RequirePermission("SETTINGS_VIEW")
    public ResponseEntity<ApiResponse<List<TemplateResponse>>> getAllTemplates() {
        return ResponseEntity.ok(ApiResponse.success("Templates fetched successfully",
                templateService.getAllTemplates()));
    }

    @GetMapping("/{id}")
    @RequirePermission("SETTINGS_VIEW")
    public ResponseEntity<ApiResponse<TemplateResponse>> getTemplate(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Template fetched successfully",
                templateService.getTemplate(id)));
    }

    @PutMapping("/fields/{fieldId}")
    @RequirePermission("SETTINGS_VIEW")
    public ResponseEntity<ApiResponse<TemplateFieldResponse>> updateTemplateField(
            @PathVariable Long fieldId,
            @Valid @RequestBody TemplateFieldRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Template field updated successfully",
                templateService.updateTemplateField(fieldId, request)));
    }

    @DeleteMapping("/fields/{fieldId}")
    @RequirePermission("SETTINGS_VIEW")
    public ResponseEntity<ApiResponse<Void>> deleteTemplateField(@PathVariable Long fieldId) {
        templateService.deleteTemplateField(fieldId);
        return ResponseEntity.ok(ApiResponse.success("Template field deleted successfully", null));
    }

    @PatchMapping("/{id}/status")
    @RequirePermission("SETTINGS_VIEW")
    public ResponseEntity<ApiResponse<TemplateResponse>> updateTemplateStatus(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Boolean> request
    ) {
        Boolean active = request == null ? null : request.get("active");
        return ResponseEntity.ok(ApiResponse.success("Template status updated successfully",
                templateService.updateTemplateStatus(id, active)));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("SETTINGS_VIEW")
    public ResponseEntity<ApiResponse<Void>> deleteTemplate(@PathVariable Long id) {
        templateService.deleteTemplate(id);
        return ResponseEntity.ok(ApiResponse.success("Template deleted successfully", null));
    }
}
