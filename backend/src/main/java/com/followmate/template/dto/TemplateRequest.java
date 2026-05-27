package com.followmate.template.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TemplateRequest {

    @NotBlank(message = "Template name is required")
    @Size(max = 255, message = "Template name must not exceed 255 characters")
    private String templateName;

    @NotBlank(message = "Business type is required")
    @Size(max = 255, message = "Business type must not exceed 255 characters")
    private String businessType;

    @NotNull(message = "Active status is required")
    private Boolean active;
}
