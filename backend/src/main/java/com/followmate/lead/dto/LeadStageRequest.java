package com.followmate.lead.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LeadStageRequest {

    @NotBlank(message = "Current stage is required")
    private String currentStage;
}
