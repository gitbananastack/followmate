package com.followmate.csvimport.repository;

import com.followmate.csvimport.entity.CsvImportError;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CsvImportErrorRepository extends JpaRepository<CsvImportError, Long> {

    List<CsvImportError> findByBatchIdOrderByRowNumberAsc(Long batchId);
}
