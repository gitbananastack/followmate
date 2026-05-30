package com.followmate.setup.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OrganizationLeadFieldRequest {

    @NotBlank(message = "Field name is required")
    private String fieldName;

    @NotBlank(message = "Field label is required")
    private String fieldLabel;

    @NotBlank(message = "Field type is required")
    private String fieldType;

    @NotNull(message = "Mandatory flag is required")
    private Boolean mandatory;

    @NotNull(message = "Display order is required")
    private Integer displayOrder;

    private String dropdownOptions;

    private Boolean active;
}
