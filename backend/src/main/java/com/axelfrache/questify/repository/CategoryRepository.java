package com.axelfrache.questify.repository;

import com.axelfrache.questify.model.Category;
import com.axelfrache.questify.model.User;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoryRepository extends JpaRepository<Category, UUID> {

  List<Category> findByUserIsNull();

  List<Category> findByUser(User user);

  @Query("SELECT c FROM Category c WHERE c.user IS NULL OR c.user = :user ORDER BY c.name")
  List<Category> findAllForUser(User user);

  boolean existsByNameAndUserIsNull(String name);

  void deleteAllByUser(User user);
}
