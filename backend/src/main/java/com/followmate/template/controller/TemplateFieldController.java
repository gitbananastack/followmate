package com.followmate.template.controller;

import com.followmate.common.ApiResponse;
import com.followmate.template.dto.TemplateFieldRequest;
import com.followmate.template.dto.TemplateFieldResponse;
import com.followmate.template.service.TemplateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/template-fields")
@RequiredArgsConstructor
public class TemplateFieldController {

    private final TemplateService templateService;

    @PutMapping("/{fieldId}")
    public ResponseEntity<ApiResponse<TemplateFieldResponse>> updateTemplateField(
            @PathVariable Long fieldId,
            @Valid @RequestBody TemplateFieldRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Template field updated successfully",
                templateService.updateTemplateField(fieldId, request)));
    }

    @DeleteMapping("/{fieldId}")
    public ResponseEntity<ApiResponse<Void>> deleteTemplateField(@PathVariable Long fieldId) {
        templateService.deleteTemplateField(fieldId);
        return ResponseEntity.ok(ApiResponse.success("Template field deleted successfully", null));
    }
}
