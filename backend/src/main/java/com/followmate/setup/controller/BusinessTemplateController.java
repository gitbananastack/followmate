package com.followmate.setup.controller;

import com.followmate.common.ApiResponse;
import com.followmate.setup.dto.BusinessTemplateResponse;
import com.followmate.setup.service.BusinessTemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/business-templates")
@RequiredArgsConstructor
public class BusinessTemplateController {

    private final BusinessTemplateService businessTemplateService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<BusinessTemplateResponse>>> getBusinessTemplates(
            @RequestParam(required = false) String businessType
    ) {
        return ResponseEntity.ok(ApiResponse.success("Business templates fetched successfully",
                businessTemplateService.getBusinessTemplates(businessType)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BusinessTemplateResponse>> getBusinessTemplate(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Business template fetched successfully",
                businessTemplateService.getBusinessTemplate(id)));
    }
}
