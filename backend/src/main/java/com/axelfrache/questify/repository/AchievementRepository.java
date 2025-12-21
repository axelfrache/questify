package com.axelfrache.questify.repository;

import com.axelfrache.questify.model.Achievement;
import com.axelfrache.questify.model.AchievementType;
import com.axelfrache.questify.model.Category;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AchievementRepository extends JpaRepository<Achievement, UUID> {

  Optional<Achievement> findByCode(String code);

  List<Achievement> findByType(AchievementType type);

  List<Achievement> findByCategory(Category category);

  boolean existsByCode(String code);
}
