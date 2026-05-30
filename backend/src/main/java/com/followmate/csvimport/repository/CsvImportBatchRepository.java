package com.followmate.csvimport.repository;

import com.followmate.csvimport.entity.CsvImportBatch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CsvImportBatchRepository extends JpaRepository<CsvImportBatch, Long> {

    List<CsvImportBatch> findByOrganizationIdOrderByCreatedAtDesc(Long organizationId);

    Optional<CsvImportBatch> findByIdAndOrganizationId(Long id, Long organizationId);
}
