package com.followmate.pipeline.controller;

import com.followmate.common.ApiResponse;
import com.followmate.pipeline.service.PipelineService;
import com.followmate.setup.dto.OrganizationPipelineStageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/pipeline")
@RequiredArgsConstructor
public class PipelineController {

    private final PipelineService pipelineService;

    @GetMapping("/stages")
    public ResponseEntity<ApiResponse<List<OrganizationPipelineStageResponse>>> getPipelineStages(
            @RequestParam(required = false) Long organizationId
    ) {
        return ResponseEntity.ok(ApiResponse.success("Pipeline stages fetched successfully",
                pipelineService.getPipelineStages(organizationId)));
    }
}
