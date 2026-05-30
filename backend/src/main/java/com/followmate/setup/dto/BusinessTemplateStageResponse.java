package com.followmate.setup.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BusinessTemplateStageResponse {

    private Long id;
    private Long templateId;
    private String stageName;
    private Integer displayOrder;
    private Boolean active;
}
