package com.followmate.lead.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class LeadRequest {

    private Long organizationId;

    private Long templateId;

    private Long workflowId;

    @Valid
    @NotEmpty(message = "Lead fields are required")
    private List<LeadFieldRequest> fields;
}
