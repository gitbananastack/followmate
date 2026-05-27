package com.followmate.workflow.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WorkflowRequest {

    @NotBlank(message = "Workflow name is required")
    @Size(max = 255, message = "Workflow name must not exceed 255 characters")
    private String workflowName;

    @NotBlank(message = "Business type is required")
    @Size(max = 255, message = "Business type must not exceed 255 characters")
    private String businessType;

    @NotNull(message = "Active status is required")
    private Boolean active;
}
