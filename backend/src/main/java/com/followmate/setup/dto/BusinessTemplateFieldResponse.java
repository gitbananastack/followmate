package com.followmate.setup.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BusinessTemplateFieldResponse {

    private Long id;
    private Long templateId;
    private String fieldName;
    private String fieldLabel;
    private String fieldType;
    private Boolean mandatory;
    private Integer displayOrder;
    private String dropdownOptions;
    private Boolean active;
}
