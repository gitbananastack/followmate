package com.followmate.template.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TemplateFieldResponse {

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
