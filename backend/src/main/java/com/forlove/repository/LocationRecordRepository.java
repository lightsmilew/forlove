package com.forlove.repository;

import com.forlove.entity.LocationRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LocationRecordRepository extends JpaRepository<LocationRecord, Long> {
    List<LocationRecord> findAllByOrderByRecordedAtDesc();
    List<LocationRecord> findByUsernameOrderByRecordedAtDesc(String username);
}
