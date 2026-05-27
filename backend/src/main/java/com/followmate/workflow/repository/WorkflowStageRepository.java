package com.followmate.workflow.repository;

import com.followmate.workflow.entity.WorkflowStage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WorkflowStageRepository extends JpaRepository<WorkflowStage, Long> {

    List<WorkflowStage> findByWorkflowIdOrderByDisplayOrderAsc(Long workflowId);

    void deleteByWorkflowId(Long workflowId);
}
