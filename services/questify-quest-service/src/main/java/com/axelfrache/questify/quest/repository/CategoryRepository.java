package com.axelfrache.questify.quest.repository;

import com.axelfrache.questify.quest.model.Category;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoryRepository extends JpaRepository<Category, UUID> {

  List<Category> findByUserIdIsNull();

  List<Category> findByUserId(UUID userId);

  @Query("SELECT c FROM Category c WHERE c.userId IS NULL OR c.userId = :userId ORDER BY c.name")
  List<Category> findAllForUser(@Param("userId") UUID userId);

  boolean existsByUserIdAndNameIgnoreCase(UUID userId, String name);

  @Query(
      "SELECT c FROM Category c WHERE (c.userId = :userId OR c.userId IS NULL)"
          + " AND LOWER(c.name) = LOWER(:name) ORDER BY c.userId DESC")
  List<Category> findAccessibleByName(@Param("userId") UUID userId, @Param("name") String name);

  List<Category> findBySourceIsNull();

  void deleteByUserId(UUID userId);
}
