package com.followmate.workflow.service;

import com.followmate.workflow.dto.WorkflowRequest;
import com.followmate.workflow.dto.WorkflowResponse;
import com.followmate.workflow.dto.WorkflowStageRequest;
import com.followmate.workflow.dto.WorkflowStageResponse;
import com.followmate.workflow.entity.WorkflowMaster;
import com.followmate.workflow.entity.WorkflowStage;
import com.followmate.workflow.repository.WorkflowMasterRepository;
import com.followmate.workflow.repository.WorkflowStageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WorkflowService {

    private final WorkflowMasterRepository workflowMasterRepository;
    private final WorkflowStageRepository workflowStageRepository;

    public WorkflowResponse createWorkflow(WorkflowRequest request) {
        WorkflowMaster workflow = WorkflowMaster.builder()
                .workflowName(request.getWorkflowName())
                .businessType(request.getBusinessType())
                .active(request.getActive())
                .build();

        return toResponse(workflowMasterRepository.save(workflow));
    }

    public List<WorkflowResponse> getAllWorkflows() {
        return workflowMasterRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public WorkflowResponse getWorkflow(Long id) {
        return toResponse(findWorkflowById(id));
    }

    public WorkflowStageResponse addStageToWorkflow(Long id, WorkflowStageRequest request) {
        WorkflowMaster workflow = findWorkflowById(id);
        WorkflowStage stage = WorkflowStage.builder()
                .workflowId(workflow.getId())
                .stageName(request.getStageName())
                .displayOrder(request.getDisplayOrder())
                .active(request.getActive())
                .build();

        return toStageResponse(workflowStageRepository.save(stage));
    }

    @Transactional
    public void deleteWorkflow(Long id) {
        WorkflowMaster workflow = findWorkflowById(id);
        workflowStageRepository.deleteByWorkflowId(workflow.getId());
        workflowMasterRepository.delete(workflow);
    }

    private WorkflowMaster findWorkflowById(Long id) {
        return workflowMasterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Workflow not found with id: " + id));
    }

    private WorkflowResponse toResponse(WorkflowMaster workflow) {
        List<WorkflowStageResponse> stages = workflowStageRepository
                .findByWorkflowIdOrderByDisplayOrderAsc(workflow.getId())
                .stream()
                .map(this::toStageResponse)
                .toList();

        return WorkflowResponse.builder()
                .id(workflow.getId())
                .workflowName(workflow.getWorkflowName())
                .businessType(workflow.getBusinessType())
                .active(workflow.getActive())
                .createdAt(workflow.getCreatedAt())
                .updatedAt(workflow.getUpdatedAt())
                .stages(stages)
                .build();
    }

    private WorkflowStageResponse toStageResponse(WorkflowStage stage) {
        return WorkflowStageResponse.builder()
                .id(stage.getId())
                .workflowId(stage.getWorkflowId())
                .stageName(stage.getStageName())
                .displayOrder(stage.getDisplayOrder())
                .active(stage.getActive())
                .build();
    }
}
