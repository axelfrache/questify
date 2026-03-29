package com.axelfrache.questify.admin.service;

import com.axelfrache.questify.admin.dto.UserSummaryResponse;
import com.axelfrache.questify.admin.messaging.AdminEventPublisher;
import com.axelfrache.questify.admin.model.UserSnapshot;
import com.axelfrache.questify.admin.repository.UserSnapshotRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminUserService {

    private final UserSnapshotRepository userSnapshotRepository;
    private final AdminEventPublisher adminEventPublisher;

    public Page<UserSummaryResponse> listUsers(String search, int page, int size) {
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        var results = (search == null || search.isBlank())
            ? userSnapshotRepository.findAll(pageable)
            : userSnapshotRepository.findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCase(search, search, pageable);
        return results.map(this::toResponse);
    }

    public UserSummaryResponse getUser(UUID id) {
        return userSnapshotRepository.findById(id)
            .map(this::toResponse)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    @Transactional
    public UserSummaryResponse updateRole(UUID userId, String newRole) {
        var snapshot = userSnapshotRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        snapshot.setRole(newRole);
        var saved = userSnapshotRepository.save(snapshot);
        adminEventPublisher.publishRoleChanged(userId, newRole);
        log.info("Role updated for userId={} to {}", userId, newRole);
        return toResponse(saved);
    }

    @Transactional
    public UserSummaryResponse updateStatus(UUID userId, boolean enabled) {
        var snapshot = userSnapshotRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        snapshot.setEnabled(enabled);
        var saved = userSnapshotRepository.save(snapshot);
        adminEventPublisher.publishStatusChanged(userId, enabled);
        log.info("Status updated for userId={} to enabled={}", userId, enabled);
        return toResponse(saved);
    }

    @Transactional
    public void deleteUser(UUID userId) {
        if (!userSnapshotRepository.existsById(userId)) {
            return;
        }
        userSnapshotRepository.deleteById(userId);
        adminEventPublisher.publishUserDeleted(userId);
        log.info("Deleted user snapshot for userId={}", userId);
    }

    private UserSummaryResponse toResponse(UserSnapshot s) {
        return new UserSummaryResponse(s.getId(), s.getUsername(), s.getEmail(), s.getRole(), s.isEnabled(), s.getCreatedAt());
    }
}
