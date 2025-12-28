# Data Model Reference

## 1. Core Entities

### User (`users/{uid}`)
*   **id**: String (Firebase UID)
*   **email**: String
*   **orgId**: String | null (Current active organization)
*   **orgRole**: Enum (`OWNER`, `ADMIN`, `MEMBER`, `NOT_IN_ORG`)
*   **isOnboarded**: Boolean

### Organization (`organizations/{orgId}`)
*   **id**: String (UUID)
*   **name**: String
*   **ownerId**: String (Reference to User)
*   **pendingOwnerId**: String | null (For ownership transfer)

### Member (`organizations/{orgId}/members/{userId}`)
*   **id**: String (User ID)
*   **role**: Enum
*   **status**: Enum (`ACTIVE`, `INACTIVE`)
*   **joinedAt**: Timestamp

### Subscription (`subscriptions/{subId}`)
*   **id**: String
*   **orgId**: String
*   **planId**: Enum (`FREE`, `PRO`, `ENTERPRISE`)
*   **status**: Enum (`active`, `past_due`, `canceled`)
*   **seats**: Number
*   **currentPeriodEnd**: Timestamp

### AuditLog (`audit_logs/{logId}`)
*   **id**: String
*   **orgId**: String
*   **actorId**: String
*   **action**: Enum (`member.invite`, `org.update`, etc.)
*   **metadata**: Map<String, Any>

## 2. Event System

### EventOutbox (`event_outbox/{id}`)
*   **id**: String
*   **eventName**: String (e.g., `invite.created`)
*   **payload**: JSON
*   **status**: Enum (`PENDING`, `PROCESSED`, `FAILED`)

## 3. Relationships
*   **User -> Org**: Many-to-One (Currently enforced as 1 active org, but model supports switching).
*   **Org -> Members**: One-to-Many (Sub-collection).
*   **Org -> Subscription**: One-to-One.
