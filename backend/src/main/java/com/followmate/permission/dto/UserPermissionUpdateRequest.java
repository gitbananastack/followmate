package com.followmate.permission.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class UserPermissionUpdateRequest {

    @Valid
    @NotEmpty(message = "Permissions are required")
    private List<UserPermissionItemRequest> permissions;
}
