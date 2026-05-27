package com.followmate.workflow.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WorkflowStageRequest {

    @NotBlank(message = "Stage name is required")
    @Size(max = 255, message = "Stage name must not exceed 255 characters")
    private String stageName;

    @NotNull(message = "Display order is required")
    @Min(value = 1, message = "Display order must be at least 1")
    private Integer displayOrder;

    @NotNull(message = "Active status is required")
    private Boolean active;
}
