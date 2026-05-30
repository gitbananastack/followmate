package com.followmate.permission.repository;

import com.followmate.permission.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PermissionRepository extends JpaRepository<Permission, Long> {

    Optional<Permission> findByPermissionCode(String permissionCode);

    boolean existsByPermissionCode(String permissionCode);

    List<Permission> findByActiveTrueOrderByPermissionCodeAsc();
}
