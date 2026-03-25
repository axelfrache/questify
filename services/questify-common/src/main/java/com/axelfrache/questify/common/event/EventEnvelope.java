package com.axelfrache.questify.common.event;

import java.time.Instant;
import java.util.UUID;

public record EventEnvelope<T>(
    UUID eventId, String type, int version, Instant timestamp, UUID userId, T payload) {}
