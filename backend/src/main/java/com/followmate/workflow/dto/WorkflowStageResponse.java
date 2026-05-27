package com.followmate.workflow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowStageResponse {

    private Long id;
    private Long workflowId;
    private String stageName;
    private Integer displayOrder;
    private Boolean active;
}
