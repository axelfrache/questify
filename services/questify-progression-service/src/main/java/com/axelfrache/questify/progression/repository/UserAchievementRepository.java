package com.axelfrache.questify.progression.repository;

import com.axelfrache.questify.progression.model.Achievement;
import com.axelfrache.questify.progression.model.UserAchievement;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserAchievementRepository extends JpaRepository<UserAchievement, UUID> {

  boolean existsByUserIdAndAchievement(UUID userId, Achievement achievement);

  List<UserAchievement> findByUserIdOrderByUnlockedAtDesc(UUID userId);

  void deleteByUserId(UUID userId);
}
