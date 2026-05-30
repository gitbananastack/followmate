package com.followmate.organization.dto;

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
public class OrganizationUserResponse {

    private Long id;
    private Long organizationId;
    private String name;
    private String email;
    private String role;
    private String status;
}
