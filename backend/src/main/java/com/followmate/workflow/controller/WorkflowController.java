package com.followmate.workflow.controller;

import com.followmate.common.ApiResponse;
import com.followmate.workflow.dto.WorkflowRequest;
import com.followmate.workflow.dto.WorkflowResponse;
import com.followmate.workflow.dto.WorkflowStageRequest;
import com.followmate.workflow.dto.WorkflowStageResponse;
import com.followmate.workflow.service.WorkflowService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Validated
@RestController
@RequestMapping("/api/workflows")
@RequiredArgsConstructor
public class WorkflowController {

    private final WorkflowService workflowService;

    @PostMapping
    public ResponseEntity<ApiResponse<WorkflowResponse>> createWorkflow(
            @Valid @RequestBody WorkflowRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Workflow created successfully",
                        workflowService.createWorkflow(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<WorkflowResponse>>> getAllWorkflows() {
        return ResponseEntity.ok(ApiResponse.success("Workflows fetched successfully",
                workflowService.getAllWorkflows()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<WorkflowResponse>> getWorkflow(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Workflow fetched successfully",
                workflowService.getWorkflow(id)));
    }

    @PostMapping("/{id}/stages")
    public ResponseEntity<ApiResponse<WorkflowStageResponse>> addStageToWorkflow(
            @PathVariable Long id,
            @Valid @RequestBody WorkflowStageRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Workflow stage added successfully",
                        workflowService.addStageToWorkflow(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteWorkflow(@PathVariable Long id) {
        workflowService.deleteWorkflow(id);
        return ResponseEntity.ok(ApiResponse.success("Workflow deleted successfully", null));
    }
}
