package com.axelfrache.questify.repository;

import com.axelfrache.questify.model.Quest;
import com.axelfrache.questify.model.QuestStatus;
import com.axelfrache.questify.model.User;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface QuestRepository extends JpaRepository<Quest, UUID> {

  List<Quest> findByUserOrderByCreatedAtDesc(User user);

  List<Quest> findByUserAndStatusOrderByCreatedAtDesc(User user, QuestStatus status);
}
