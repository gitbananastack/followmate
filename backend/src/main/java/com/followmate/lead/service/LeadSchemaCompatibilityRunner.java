package com.followmate.lead.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class LeadSchemaCompatibilityRunner implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        makeColumnNullable("template_id");
        makeColumnNullable("workflow_id");
    }

    private void makeColumnNullable(String columnName) {
        try {
            Integer notNullableCount = jdbcTemplate.queryForObject(
                    """
                    SELECT COUNT(*)
                    FROM information_schema.COLUMNS
                    WHERE TABLE_SCHEMA = DATABASE()
                      AND TABLE_NAME = 'leads'
                      AND COLUMN_NAME = ?
                      AND IS_NULLABLE = 'NO'
                    """,
                    Integer.class,
                    columnName
            );

            if (notNullableCount != null && notNullableCount > 0) {
                jdbcTemplate.execute("ALTER TABLE leads MODIFY COLUMN " + columnName + " BIGINT NULL");
            }
        } catch (RuntimeException ex) {
            log.warn("Unable to relax leads.{} nullability automatically: {}", columnName, ex.getMessage());
        }
    }
}
