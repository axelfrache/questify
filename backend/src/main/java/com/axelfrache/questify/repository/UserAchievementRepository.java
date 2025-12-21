package com.axelfrache.questify.repository;

import com.axelfrache.questify.model.Achievement;
import com.axelfrache.questify.model.User;
import com.axelfrache.questify.model.UserAchievement;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserAchievementRepository extends JpaRepository<UserAchievement, UUID> {

  List<UserAchievement> findByUserOrderByUnlockedAtDesc(User user);

  boolean existsByUserAndAchievement(User user, Achievement achievement);
}
