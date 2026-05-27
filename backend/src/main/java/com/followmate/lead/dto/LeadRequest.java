package com.followmate.lead.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class LeadRequest {

    @NotNull(message = "Organization id is required")
    private Long organizationId;

    @NotNull(message = "Template id is required")
    private Long templateId;

    @NotNull(message = "Workflow id is required")
    private Long workflowId;

    @Valid
    @NotEmpty(message = "Lead fields are required")
    private List<LeadFieldRequest> fields;
}
