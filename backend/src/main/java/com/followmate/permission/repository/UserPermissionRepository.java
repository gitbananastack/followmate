package com.followmate.permission.repository;

import com.followmate.permission.entity.UserPermission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserPermissionRepository extends JpaRepository<UserPermission, Long> {

    List<UserPermission> findByUserId(Long userId);

    List<UserPermission> findByUserIdAndAllowedTrue(Long userId);

    Optional<UserPermission> findByUserIdAndPermissionId(Long userId, Long permissionId);
}
