package com.followmate.setup.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class BusinessTemplateResponse {

    private Long id;
    private String templateName;
    private String businessType;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<BusinessTemplateFieldResponse> fields;
    private List<BusinessTemplateStageResponse> stages;
    private List<BusinessTemplateFieldResponse> leadFields;
    private List<BusinessTemplateStageResponse> pipelineStages;
}
