package com.axelfrache.questify.repository;

import com.axelfrache.questify.model.QuestTemplate;
import com.axelfrache.questify.model.User;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuestTemplateRepository extends JpaRepository<QuestTemplate, UUID> {
    List<QuestTemplate> findByUserOrderByCreatedAtDesc(User user);

    List<QuestTemplate> findByUserAndActiveTrue(User user);
}
