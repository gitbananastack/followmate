package com.followmate.template.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TemplateFieldRequest {

    @NotBlank(message = "Field name is required")
    @Size(max = 255, message = "Field name must not exceed 255 characters")
    private String fieldName;

    @NotBlank(message = "Field label is required")
    @Size(max = 255, message = "Field label must not exceed 255 characters")
    private String fieldLabel;

    @NotBlank(message = "Field type is required")
    @Pattern(
            regexp = "TEXT|NUMBER|DATE|DROPDOWN|CHECKBOX|TEXTAREA|EMAIL|PHONE",
            message = "Field type must be one of TEXT, NUMBER, DATE, DROPDOWN, CHECKBOX, TEXTAREA, EMAIL, PHONE"
    )
    private String fieldType;

    @NotNull(message = "Mandatory flag is required")
    private Boolean mandatory;

    @NotNull(message = "Display order is required")
    @Min(value = 1, message = "Display order must be at least 1")
    private Integer displayOrder;

    @Size(max = 2000, message = "Dropdown options must not exceed 2000 characters")
    private String dropdownOptions;
}
