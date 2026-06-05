-- ============================================================
-- Dhaka Ladies Club Booking Management System
-- Latest Clean Database Schema with June-December Available Slots
--
-- Purpose:
--   Calendar slot availability -> booking information -> 10-minute hold
--   -> dummy payment -> confirmed booking -> congratulations page.
--
-- Notes:
--   - This file contains full schema plus required master calendar data.
--   - No dummy users/customers/bookings/payments are inserted.
--   - It creates Main Hall, Day/Night shifts, and available slots from June to December 2026.
--   - Shift price is stored in shifts.price.
--   - Frontend amount must display the backend/database price.
--   - Backend must calculate final amount from shifts.price, not frontend input.
-- ============================================================

DROP DATABASE IF EXISTS dhaka_ladies_club_checkpoint;
CREATE DATABASE dhaka_ladies_club_checkpoint
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE dhaka_ladies_club_checkpoint;

SET FOREIGN_KEY_CHECKS = 0;

DROP VIEW IF EXISTS vw_calendar_slots;
DROP PROCEDURE IF EXISTS sp_generate_slots;
DROP PROCEDURE IF EXISTS sp_release_expired_holds;

DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS booking_slots;
DROP TABLE IF EXISTS shifts;
DROP TABLE IF EXISTS halls;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- 1. USERS
-- Stores account records for customers/admins.
-- ============================================================

CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(30) NULL,
    password_hash VARCHAR(255) NOT NULL,

    user_type ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
    status ENUM('active', 'inactive', 'blocked') NOT NULL DEFAULT 'active',

    email_verified_at TIMESTAMP NULL,
    phone_verified_at TIMESTAMP NULL,

    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_users_email (email),
    UNIQUE KEY uq_users_phone (phone),
    INDEX idx_users_type_status (user_type, status)
) ENGINE=InnoDB;

-- ============================================================
-- 2. CUSTOMERS
-- Customer profile connected to users.
-- ============================================================

CREATE TABLE customers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NOT NULL,
    customer_code VARCHAR(50) NOT NULL,

    address TEXT NULL,
    nid_or_passport VARCHAR(100) NULL,

    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_customers_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    UNIQUE KEY uq_customers_user_id (user_id),
    UNIQUE KEY uq_customers_customer_code (customer_code)
) ENGINE=InnoDB;

-- ============================================================
-- 3. HALLS
-- Venue/hall list. Current project may have one active Main Hall.
-- ============================================================

CREATE TABLE halls (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) NOT NULL,
    description TEXT NULL,
    capacity INT UNSIGNED NULL,

    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',

    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_halls_slug (slug),
    INDEX idx_halls_status (status)
) ENGINE=InnoDB;

-- ============================================================
-- 4. SHIFTS
-- Stores Day Shift/Night Shift and fixed shift price.
-- Current project price: 125,000 taka per shift.
-- ============================================================

CREATE TABLE shifts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    sort_order INT UNSIGNED NOT NULL DEFAULT 0,

    price DECIMAL(12,2) NOT NULL DEFAULT 125000.00,

    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',

    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_shifts_name (name),
    INDEX idx_shifts_status_sort (status, sort_order),
    INDEX idx_shifts_price (price)
) ENGINE=InnoDB;

-- ============================================================
-- 5. BOOKING_SLOTS
-- Calendar availability table.
--
-- One row = one hall + one date + one shift.
--
-- slot_status:
--   available             = can be selected
--   payment_in_progress   = held for 10 minutes after Proceed to Payment
--   booked                = confirmed after payment
--   blocked               = manually unavailable/internal block
--
-- hold_* columns support the 10-minute payment session.
-- ============================================================

CREATE TABLE booking_slots (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    hall_id BIGINT UNSIGNED NOT NULL,
    shift_id BIGINT UNSIGNED NOT NULL,
    slot_date DATE NOT NULL,

    slot_status ENUM(
        'available',
        'payment_in_progress',
        'booked',
        'blocked'
    ) NOT NULL DEFAULT 'available',

    hold_token VARCHAR(100) NULL,
    hold_expires_at TIMESTAMP NULL,
    hold_booking_id BIGINT UNSIGNED NULL,

    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_booking_slots_hall
        FOREIGN KEY (hall_id) REFERENCES halls(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_booking_slots_shift
        FOREIGN KEY (shift_id) REFERENCES shifts(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    UNIQUE KEY uq_booking_slots_hall_shift_date (hall_id, shift_id, slot_date),
    INDEX idx_booking_slots_date_status (slot_date, slot_status),
    INDEX idx_booking_slots_hall_date (hall_id, slot_date),
    INDEX idx_booking_slots_shift (shift_id),
    INDEX idx_booking_slots_hold (hold_booking_id, hold_token),
    INDEX idx_booking_slots_hold_expiry (slot_status, hold_expires_at)
) ENGINE=InnoDB;

-- ============================================================
-- 6. BOOKINGS
-- Stores booking records.
--
-- booking_status:
--   pending    = created when slot is held
--   confirmed  = payment successful
--   cancelled  = hold expired/cancelled
--
-- event_details was added later for detailed event description.
-- total_amount is the final backend-confirmed amount snapshot.
--
-- Important:
--   No UNIQUE constraint on booking_slot_id, because old cancelled
--   test/history rows may exist while the slot becomes available again.
--   Double booking prevention is handled by booking_slots.slot_status
--   with transaction + lockForUpdate in backend.
-- ============================================================

CREATE TABLE bookings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    booking_no VARCHAR(50) NOT NULL,

    customer_id BIGINT UNSIGNED NOT NULL,
    booking_slot_id BIGINT UNSIGNED NOT NULL,

    booking_status ENUM(
        'pending',
        'confirmed',
        'cancelled'
    ) NOT NULL DEFAULT 'pending',

    booking_source ENUM('online', 'offline') NOT NULL DEFAULT 'online',

    event_title VARCHAR(150) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_details TEXT NULL,
    guest_count INT UNSIGNED NOT NULL,

    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,

    booked_at TIMESTAMP NULL,

    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_bookings_customer
        FOREIGN KEY (customer_id) REFERENCES customers(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_bookings_slot
        FOREIGN KEY (booking_slot_id) REFERENCES booking_slots(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    UNIQUE KEY uq_bookings_booking_no (booking_no),
    INDEX idx_bookings_booking_slot_id (booking_slot_id),
    INDEX idx_bookings_customer_status (customer_id, booking_status),
    INDEX idx_bookings_status (booking_status),
    INDEX idx_bookings_booked_at (booked_at)
) ENGINE=InnoDB;

-- Add hold booking foreign key after bookings table exists.
ALTER TABLE booking_slots
    ADD CONSTRAINT fk_booking_slots_hold_booking
    FOREIGN KEY (hold_booking_id) REFERENCES bookings(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

-- ============================================================
-- 7. PAYMENTS
-- Dummy payment table.
--
-- Security:
--   - Full card number is never stored.
--   - CVV is never stored.
--   - Only cardholder name, last 4 digits, billing address,
--     amount, transaction reference, method/status, and paid time are stored.
-- ============================================================

CREATE TABLE payments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    booking_id BIGINT UNSIGNED NOT NULL,

    cardholder_name VARCHAR(150) NULL,
    card_last_four CHAR(4) NULL,
    billing_address VARCHAR(255) NULL,

    payment_method ENUM(
        'dummy',
        'sslcommerz',
        'bank_transfer'
    ) NOT NULL DEFAULT 'dummy',

    payment_status ENUM(
        'pending',
        'success',
        'failed'
    ) NOT NULL DEFAULT 'pending',

    amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    transaction_reference VARCHAR(150) NULL,

    paid_at TIMESTAMP NULL,

    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_payments_booking
        FOREIGN KEY (booking_id) REFERENCES bookings(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    UNIQUE KEY uq_payments_booking_id (booking_id),
    UNIQUE KEY uq_payments_transaction_reference (transaction_reference),
    INDEX idx_payments_booking_status (booking_id, payment_status),
    INDEX idx_payments_paid_at (paid_at),
    INDEX idx_payments_card_last_four (card_last_four)
) ENGINE=InnoDB;

-- ============================================================
-- 8. ACTIVITY_LOGS
-- Optional operational audit log.
-- ============================================================

CREATE TABLE activity_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NULL,

    action VARCHAR(100) NOT NULL,
    module_name VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id BIGINT UNSIGNED NOT NULL,

    old_values JSON NULL,
    new_values JSON NULL,

    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(255) NULL,

    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_activity_logs_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    INDEX idx_activity_logs_user (user_id),
    INDEX idx_activity_logs_module_action (module_name, action),
    INDEX idx_activity_logs_entity (entity_type, entity_id),
    INDEX idx_activity_logs_created_at (created_at)
) ENGINE=InnoDB;

-- ============================================================
-- VIEW: vw_calendar_slots
-- Useful for checking calendar data manually.
-- The Laravel CalendarSlotController may query tables directly,
-- but this view reflects the latest schema.
-- ============================================================

CREATE OR REPLACE VIEW vw_calendar_slots AS
SELECT
    bs.id AS slot_id,
    bs.slot_date,
    bs.slot_status,
    bs.hold_expires_at,
    bs.hold_booking_id,

    h.id AS hall_id,
    h.name AS hall_name,
    h.slug AS hall_slug,
    h.capacity AS hall_capacity,

    s.id AS shift_id,
    s.name AS shift_name,
    s.start_time,
    s.end_time,
    s.sort_order,
    s.price AS shift_price,
    s.price AS price,

    b.id AS booking_id,
    b.booking_no,
    b.booking_status,
    b.booking_source,
    b.event_title,
    b.event_type,
    b.event_details,
    b.guest_count,
    b.total_amount AS booking_total_amount,
    b.booked_at,

    p.id AS payment_id,
    p.payment_method,
    p.payment_status,
    p.amount AS paid_amount,
    p.transaction_reference,
    p.paid_at
FROM booking_slots bs
JOIN halls h
    ON h.id = bs.hall_id
JOIN shifts s
    ON s.id = bs.shift_id
LEFT JOIN bookings b
    ON b.id = bs.hold_booking_id
    OR (
        b.booking_slot_id = bs.id
        AND b.booking_status = 'confirmed'
    )
LEFT JOIN payments p
    ON p.booking_id = b.id;

-- ============================================================
-- PROCEDURE: sp_generate_slots
-- Generate active-shift slots for a hall and date range.
-- No dummy booking/user data is inserted by this procedure.
-- ============================================================

DELIMITER $$

CREATE PROCEDURE sp_generate_slots(
    IN p_hall_id BIGINT UNSIGNED,
    IN p_start_date DATE,
    IN p_end_date DATE
)
BEGIN
    DECLARE v_date DATE;

    SET v_date = p_start_date;

    WHILE v_date <= p_end_date DO

        INSERT IGNORE INTO booking_slots (
            hall_id,
            shift_id,
            slot_date,
            slot_status,
            hold_token,
            hold_expires_at,
            hold_booking_id,
            created_at,
            updated_at
        )
        SELECT
            p_hall_id,
            id,
            v_date,
            'available',
            NULL,
            NULL,
            NULL,
            NOW(),
            NOW()
        FROM shifts
        WHERE status = 'active';

        SET v_date = DATE_ADD(v_date, INTERVAL 1 DAY);

    END WHILE;
END $$

-- ============================================================
-- PROCEDURE: sp_release_expired_holds
-- Optional database helper for manually releasing expired holds.
-- Laravel already handles this in CalendarSlotController.
-- ============================================================

CREATE PROCEDURE sp_release_expired_holds()
BEGIN
    UPDATE booking_slots
    SET
        slot_status = 'available',
        hold_token = NULL,
        hold_expires_at = NULL,
        hold_booking_id = NULL,
        updated_at = NOW()
    WHERE slot_status = 'payment_in_progress'
      AND hold_expires_at IS NOT NULL
      AND hold_expires_at <= NOW();

    UPDATE bookings b
    LEFT JOIN booking_slots bs
        ON bs.hold_booking_id = b.id
    SET
        b.booking_status = 'cancelled',
        b.updated_at = NOW()
    WHERE b.booking_status = 'pending'
      AND b.booked_at IS NULL
      AND bs.id IS NULL;
END $$

DELIMITER ;

-- ============================================================
-- REQUIRED MASTER CALENDAR DATA
-- ============================================================
-- This section is required for the website calendar to work immediately
-- after importing the SQL on a new device.
--
-- No dummy users/customers/bookings/payments are inserted.
-- These are operational master records only:
--   - Main Hall
--   - Day Shift and Night Shift
--   - All slots available from 2026-06-01 to 2026-12-31
-- ============================================================

INSERT INTO halls (id, name, slug, description, capacity, status, created_at, updated_at)
VALUES
(1, 'Main Hall', 'main-hall', 'Primary booking hall.', 500, 'active', NOW(), NOW());

INSERT INTO shifts (id, name, start_time, end_time, sort_order, price, status, created_at, updated_at)
VALUES
(1, 'Day Shift', '13:00:00', '17:00:00', 1, 125000.00, 'active', NOW(), NOW()),
(2, 'Night Shift', '18:00:00', '23:59:59', 2, 125000.00, 'active', NOW(), NOW());

CALL sp_generate_slots(1, '2026-06-01', '2026-12-31');

-- Expected generated booking slots:
--   214 days x 2 shifts = 428 available booking_slots rows.
--
-- Check after import:
--   SELECT slot_status, COUNT(*) FROM booking_slots GROUP BY slot_status;
-- ============================================================
