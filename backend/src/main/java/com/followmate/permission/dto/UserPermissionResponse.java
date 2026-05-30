package com.followmate.permission.dto;

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
public class UserPermissionResponse {

    private String permissionCode;
    private String permissionName;
    private String category;
    private Boolean allowed;
}
