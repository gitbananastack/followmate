package com.followmate.permission.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserPermissionItemRequest {

    @NotBlank(message = "Permission code is required")
    private String permissionCode;

    @NotNull(message = "Allowed value is required")
    private Boolean allowed;
}
