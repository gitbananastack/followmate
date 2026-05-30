package com.followmate.setup.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class OrganizationLeadFieldResponse {

    private Long id;
    private Long organizationId;
    private String fieldName;
    private String fieldLabel;
    private String fieldType;
    private Boolean mandatory;
    private Integer displayOrder;
    private String dropdownOptions;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
