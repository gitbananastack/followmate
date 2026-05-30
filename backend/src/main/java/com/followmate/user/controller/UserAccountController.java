package com.followmate.user.controller;

import com.followmate.common.ApiResponse;
import com.followmate.user.dto.ChangePasswordRequest;
import com.followmate.user.dto.CurrentUserResponse;
import com.followmate.user.service.UserAccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class UserAccountController {

    private final UserAccountService userAccountService;

    @GetMapping("/api/me")
    public ResponseEntity<ApiResponse<CurrentUserResponse>> getCurrentUser() {
        return ResponseEntity.ok(ApiResponse.success("Current user fetched successfully",
                userAccountService.getCurrentUser()));
    }

    @PutMapping("/api/users/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        userAccountService.changePassword(request);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully", null));
    }
}
