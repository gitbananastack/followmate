package com.followmate.setup.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OrganizationPipelineStageRequest {

    @NotBlank(message = "Stage name is required")
    private String stageName;

    @NotNull(message = "Display order is required")
    private Integer displayOrder;

    private Boolean active;
}
