package com.followmate.template.controller;

import com.followmate.common.ApiResponse;
import com.followmate.template.dto.TemplateFieldRequest;
import com.followmate.template.dto.TemplateFieldResponse;
import com.followmate.template.dto.TemplateRequest;
import com.followmate.template.dto.TemplateResponse;
import com.followmate.template.service.TemplateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/templates")
@RequiredArgsConstructor
public class TemplateController {

    private final TemplateService templateService;

    @PostMapping
    public ResponseEntity<ApiResponse<TemplateResponse>> createTemplate(@Valid @RequestBody TemplateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Template created successfully", templateService.createTemplate(request)));
    }

    @PostMapping("/{id}/fields")
    public ResponseEntity<ApiResponse<TemplateFieldResponse>> addFieldToTemplate(
            @PathVariable Long id,
            @Valid @RequestBody TemplateFieldRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Template field added successfully",
                        templateService.addFieldToTemplate(id, request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TemplateResponse>>> getAllTemplates() {
        return ResponseEntity.ok(ApiResponse.success("Templates fetched successfully",
                templateService.getAllTemplates()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TemplateResponse>> getTemplate(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Template fetched successfully",
                templateService.getTemplate(id)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTemplate(@PathVariable Long id) {
        templateService.deleteTemplate(id);
        return ResponseEntity.ok(ApiResponse.success("Template deleted successfully", null));
    }
}
