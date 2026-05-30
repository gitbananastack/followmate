package com.followmate.setup.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class OrganizationSetupResponse {

    private Long organizationId;
    private String organizationName;
    private String businessType;
    private String status;
    private Boolean setupFinalized;
    private Long sourceTemplateId;
    private List<OrganizationLeadFieldResponse> leadFields;
    private List<OrganizationPipelineStageResponse> pipelineStages;
}
