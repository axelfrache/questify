package com.axelfrache.questify.admin.controller;

import com.axelfrache.questify.admin.dto.UpdateRoleRequest;
import com.axelfrache.questify.admin.dto.UpdateStatusRequest;
import com.axelfrache.questify.admin.dto.UserSummaryResponse;
import com.axelfrache.questify.admin.service.AdminUserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@Validated
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public Page<UserSummaryResponse> listUsers(
        @RequestParam(required = false) String search,
        @RequestParam(defaultValue = "0") @Min(0) int page,
        @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return adminUserService.listUsers(search, page, size);
    }

    @GetMapping("/{id}")
    public UserSummaryResponse getUser(@PathVariable UUID id) {
        return adminUserService.getUser(id);
    }

    @PatchMapping("/{id}/role")
    public UserSummaryResponse updateRole(
        @PathVariable UUID id,
        @Valid @RequestBody UpdateRoleRequest request) {
        return adminUserService.updateRole(id, request.role());
    }

    @PatchMapping("/{id}/status")
    public UserSummaryResponse updateStatus(
        @PathVariable UUID id,
        @Valid @RequestBody UpdateStatusRequest request) {
        return adminUserService.updateStatus(id, request.enabled());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable UUID id) {
        adminUserService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
