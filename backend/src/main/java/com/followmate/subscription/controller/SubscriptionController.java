package com.followmate.subscription.controller;

import com.followmate.common.ApiResponse;
import com.followmate.subscription.dto.FeatureResponse;
import com.followmate.subscription.dto.OrganizationFeaturesResponse;
import com.followmate.subscription.dto.OrganizationSubscriptionRequest;
import com.followmate.subscription.dto.OrganizationSubscriptionResponse;
import com.followmate.subscription.dto.SubscriptionPlanResponse;
import com.followmate.subscription.service.SubscriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    @GetMapping("/features")
    public ResponseEntity<ApiResponse<List<FeatureResponse>>> getFeatures() {
        return ResponseEntity.ok(ApiResponse.success("Features fetched successfully",
                subscriptionService.getFeatures()));
    }

    @GetMapping("/subscription/plans")
    public ResponseEntity<ApiResponse<List<SubscriptionPlanResponse>>> getPlans() {
        return ResponseEntity.ok(ApiResponse.success("Subscription plans fetched successfully",
                subscriptionService.getPlans()));
    }

    @GetMapping("/organizations/{orgId}/subscription")
    public ResponseEntity<ApiResponse<OrganizationSubscriptionResponse>> getOrganizationSubscription(
            @PathVariable Long orgId
    ) {
        return ResponseEntity.ok(ApiResponse.success("Organization subscription fetched successfully",
                subscriptionService.getOrganizationSubscription(orgId)));
    }

    @PostMapping("/organizations/{orgId}/subscription")
    public ResponseEntity<ApiResponse<OrganizationSubscriptionResponse>> assignOrganizationSubscription(
            @PathVariable Long orgId,
            @Valid @RequestBody OrganizationSubscriptionRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Organization subscription saved successfully",
                        subscriptionService.assignOrganizationSubscription(orgId, request)));
    }

    @GetMapping("/organizations/{orgId}/features")
    public ResponseEntity<ApiResponse<OrganizationFeaturesResponse>> getOrganizationFeatures(
            @PathVariable Long orgId
    ) {
        return ResponseEntity.ok(ApiResponse.success("Organization features fetched successfully",
                subscriptionService.getOrganizationFeatures(orgId)));
    }
}
