package com.axelfrache.questify.progression.repository;

import com.axelfrache.questify.progression.model.Achievement;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AchievementRepository extends JpaRepository<Achievement, UUID> {}
