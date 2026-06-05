-- ============================================================
-- Dhaka Ladies Club Booking System - First Checkpoint Database
-- Purpose:
--   Calendar availability -> user books date + shift -> dummy payment
--   -> backend updates slot as booked -> UI calendar shows booked
--
-- MySQL Version Recommended: MySQL 8.0+
-- Run this full file in MySQL Workbench.
-- ============================================================

DROP DATABASE IF EXISTS dhaka_ladies_club_checkpoint;
CREATE DATABASE dhaka_ladies_club_checkpoint
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE dhaka_ladies_club_checkpoint;

-- Make sure InnoDB foreign keys work correctly.
SET FOREIGN_KEY_CHECKS = 0;

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
-- Stores login account information.
-- For checkpoint, both customer and admin users can stay here.
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
-- Customer profile connected with users.
-- One user can have one customer profile.
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
-- Even if checkpoint has one hall, keep this table for future
-- multi-hall scalability.
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
-- Stores Day Shift and Night Shift.
-- According to the PDF:
--   Day Shift:   1 PM - 5 PM
--   Night Shift: 6 PM - 12 AM
-- ============================================================

CREATE TABLE shifts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    sort_order INT UNSIGNED NOT NULL DEFAULT 0,

    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',

    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_shifts_name (name),
    INDEX idx_shifts_status_sort (status, sort_order)
) ENGINE=InnoDB;

-- ============================================================
-- 5. BOOKING_SLOTS
-- This is the calendar availability table.
--
-- One row = one hall + one date + one shift.
--
-- Example:
--   Main Hall + 2026-06-10 + Day Shift
--
-- Important:
--   UNIQUE(hall_id, shift_id, slot_date)
-- prevents duplicate slots.
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
    INDEX idx_booking_slots_shift (shift_id)
) ENGINE=InnoDB;

-- ============================================================
-- 6. BOOKINGS
-- Stores the actual booking record.
--
-- For checkpoint:
--   booking_status will normally become 'confirmed' immediately
--   after dummy payment success.
--
-- UNIQUE(booking_slot_id) prevents two bookings for same slot.
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

    event_title VARCHAR(150) NULL,
    event_type VARCHAR(100) NULL,
    guest_count INT UNSIGNED NULL,

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
    UNIQUE KEY uq_bookings_booking_slot_id (booking_slot_id),
    INDEX idx_bookings_customer_status (customer_id, booking_status),
    INDEX idx_bookings_status (booking_status),
    INDEX idx_bookings_booked_at (booked_at)
) ENGINE=InnoDB;

-- ============================================================
-- 7. PAYMENTS
-- For checkpoint, payment is dummy.
-- User clicks dummy payment success and the backend creates
-- a payment row with payment_method='dummy' and status='success'.
-- ============================================================

CREATE TABLE payments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    booking_id BIGINT UNSIGNED NOT NULL,

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
    INDEX idx_payments_paid_at (paid_at)
) ENGINE=InnoDB;

-- ============================================================
-- 8. ACTIVITY_LOGS
-- Optional but recommended.
-- Keeps backend proof of important actions:
--   booking_created, slot_booked, dummy_payment_success, etc.
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
-- CALENDAR VIEW
-- This view is useful for frontend calendar API.
-- Your API can SELECT from this view to show calendar availability.
-- ============================================================

CREATE OR REPLACE VIEW vw_calendar_slots AS
SELECT
    bs.id AS slot_id,
    bs.slot_date,
    bs.slot_status,

    h.id AS hall_id,
    h.name AS hall_name,
    h.slug AS hall_slug,

    s.id AS shift_id,
    s.name AS shift_name,
    s.start_time,
    s.end_time,
    s.sort_order,

    b.id AS booking_id,
    b.booking_no,
    b.booking_status,
    b.event_title,
    b.event_type,
    b.guest_count,
    b.total_amount
FROM booking_slots bs
JOIN halls h
    ON h.id = bs.hall_id
JOIN shifts s
    ON s.id = bs.shift_id
LEFT JOIN bookings b
    ON b.booking_slot_id = bs.id;

-- ============================================================
-- STORED PROCEDURE: Generate slots for a date range
-- This creates Day/Night slots for a hall between two dates.
-- Uses INSERT IGNORE so rerunning does not duplicate slots.
-- ============================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_generate_slots $$
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
            created_at,
            updated_at
        )
        SELECT
            p_hall_id,
            id,
            v_date,
            'available',
            NOW(),
            NOW()
        FROM shifts
        WHERE status = 'active';

        SET v_date = DATE_ADD(v_date, INTERVAL 1 DAY);

    END WHILE;
END $$

DELIMITER ;

-- ============================================================
-- STORED PROCEDURE: Create dummy booking safely
--
-- This is the safest checkpoint booking flow:
--   1. Start transaction
--   2. Lock selected booking slot using FOR UPDATE
--   3. Check slot is available
--   4. Create booking
--   5. Create dummy payment
--   6. Mark slot as booked
--   7. Add activity log
--   8. Commit
--
-- If the slot is already booked, MySQL throws an error.
-- ============================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_create_dummy_booking $$
CREATE PROCEDURE sp_create_dummy_booking(
    IN p_user_id BIGINT UNSIGNED,
    IN p_booking_slot_id BIGINT UNSIGNED,
    IN p_event_title VARCHAR(150),
    IN p_event_type VARCHAR(100),
    IN p_guest_count INT UNSIGNED,
    IN p_total_amount DECIMAL(12,2)
)
BEGIN
    DECLARE v_customer_id BIGINT UNSIGNED;
    DECLARE v_slot_status VARCHAR(50);
    DECLARE v_booking_id BIGINT UNSIGNED;
    DECLARE v_booking_no VARCHAR(50);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    SELECT id
    INTO v_customer_id
    FROM customers
    WHERE user_id = p_user_id
    LIMIT 1;

    IF v_customer_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Customer profile not found for this user.';
    END IF;

    SELECT slot_status
    INTO v_slot_status
    FROM booking_slots
    WHERE id = p_booking_slot_id
    FOR UPDATE;

    IF v_slot_status IS NULL OR v_slot_status <> 'available' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'This slot is not available. Please choose another slot.';
    END IF;

    SET v_booking_no = CONCAT(
        'BKG-',
        DATE_FORMAT(NOW(), '%Y%m%d%H%i%s'),
        '-S',
        LPAD(p_booking_slot_id, 5, '0')
    );

    INSERT INTO bookings (
        booking_no,
        customer_id,
        booking_slot_id,
        booking_status,
        booking_source,
        event_title,
        event_type,
        guest_count,
        total_amount,
        booked_at,
        created_at,
        updated_at
    )
    VALUES (
        v_booking_no,
        v_customer_id,
        p_booking_slot_id,
        'confirmed',
        'online',
        p_event_title,
        p_event_type,
        p_guest_count,
        p_total_amount,
        NOW(),
        NOW(),
        NOW()
    );

    SET v_booking_id = LAST_INSERT_ID();

    INSERT INTO payments (
        booking_id,
        payment_method,
        payment_status,
        amount,
        transaction_reference,
        paid_at,
        created_at,
        updated_at
    )
    VALUES (
        v_booking_id,
        'dummy',
        'success',
        p_total_amount,
        CONCAT('DUMMY-', v_booking_no),
        NOW(),
        NOW(),
        NOW()
    );

    UPDATE booking_slots
    SET
        slot_status = 'booked',
        updated_at = NOW()
    WHERE id = p_booking_slot_id;

    INSERT INTO activity_logs (
        user_id,
        action,
        module_name,
        entity_type,
        entity_id,
        old_values,
        new_values,
        created_at
    )
    VALUES (
        p_user_id,
        'booking_created_with_dummy_payment',
        'booking',
        'booking',
        v_booking_id,
        NULL,
        JSON_OBJECT(
            'booking_id', v_booking_id,
            'booking_no', v_booking_no,
            'booking_slot_id', p_booking_slot_id,
            'payment_method', 'dummy',
            'payment_status', 'success',
            'slot_status', 'booked'
        ),
        NOW()
    );

    COMMIT;

    SELECT
        b.id AS booking_id,
        b.booking_no,
        b.booking_status,
        bs.slot_date,
        h.name AS hall_name,
        s.name AS shift_name,
        bs.slot_status,
        p.payment_method,
        p.payment_status,
        p.amount
    FROM bookings b
    JOIN booking_slots bs ON bs.id = b.booking_slot_id
    JOIN halls h ON h.id = bs.hall_id
    JOIN shifts s ON s.id = bs.shift_id
    JOIN payments p ON p.booking_id = b.id
    WHERE b.id = v_booking_id;

END $$

DELIMITER ;

-- ============================================================
-- DUMMY DATA
-- ============================================================

-- Users
-- Passwords are demo hashes/placeholders only.
-- In real app, use Laravel/PHP password_hash().
INSERT INTO users (
    name,
    email,
    phone,
    password_hash,
    user_type,
    status,
    email_verified_at,
    phone_verified_at
)
VALUES
(
    'System Admin',
    'admin@dhakaladiesclub.test',
    '01700000001',
    '$2y$10$dummyAdminPasswordHashForCheckpointOnly',
    'admin',
    'active',
    NOW(),
    NOW()
),
(
    'Nusrat Jahan',
    'nusrat.customer@test.com',
    '01700000002',
    '$2y$10$dummyCustomerPasswordHashForCheckpointOnly',
    'customer',
    'active',
    NOW(),
    NOW()
),
(
    'Farhana Rahman',
    'farhana.customer@test.com',
    '01700000003',
    '$2y$10$dummyCustomerPasswordHashForCheckpointOnly',
    'customer',
    'active',
    NOW(),
    NOW()
);

-- Customers
INSERT INTO customers (
    user_id,
    customer_code,
    address,
    nid_or_passport
)
VALUES
(
    2,
    'CUST-0001',
    'Gulshan, Dhaka',
    'NID-1000000001'
),
(
    3,
    'CUST-0002',
    'Banani, Dhaka',
    'NID-1000000002'
);

-- Hall
INSERT INTO halls (
    name,
    slug,
    description,
    capacity,
    status
)
VALUES
(
    'Main Hall',
    'main-hall',
    'Primary booking hall for Dhaka Ladies Club events.',
    500,
    'active'
);

-- Shifts
INSERT INTO shifts (
    name,
    start_time,
    end_time,
    sort_order,
    status
)
VALUES
(
    'Day Shift',
    '13:00:00',
    '17:00:00',
    1,
    'active'
),
(
    'Night Shift',
    '18:00:00',
    '23:59:59',
    2,
    'active'
);

-- Generate calendar slots for June 2026.
CALL sp_generate_slots(1, '2026-06-01', '2026-06-30');

-- Generate a few July 2026 slots too, useful for frontend testing.
CALL sp_generate_slots(1, '2026-07-01', '2026-07-07');

-- ============================================================
-- CREATE SOME DUMMY BOOKINGS
-- These demonstrate booked slots in the calendar.
-- ============================================================

-- Dummy booking 1:
-- Customer: Nusrat Jahan
-- Date: 2026-06-10
-- Shift: Night Shift
CALL sp_create_dummy_booking(
    2,
    (
        SELECT slot_id
        FROM vw_calendar_slots
        WHERE hall_id = 1
          AND slot_date = '2026-06-10'
          AND shift_name = 'Night Shift'
        LIMIT 1
    ),
    'Wedding Reception',
    'Wedding',
    350,
    50000.00
);

-- Dummy booking 2:
-- Customer: Farhana Rahman
-- Date: 2026-06-15
-- Shift: Day Shift
CALL sp_create_dummy_booking(
    3,
    (
        SELECT slot_id
        FROM vw_calendar_slots
        WHERE hall_id = 1
          AND slot_date = '2026-06-15'
          AND shift_name = 'Day Shift'
        LIMIT 1
    ),
    'Corporate Seminar',
    'Seminar',
    180,
    35000.00
);

-- Block one slot to show unavailable/blocked state in UI.
UPDATE booking_slots
SET slot_status = 'blocked'
WHERE hall_id = 1
  AND slot_date = '2026-06-20'
  AND shift_id = (
      SELECT id FROM shifts WHERE name = 'Day Shift' LIMIT 1
  );

INSERT INTO activity_logs (
    user_id,
    action,
    module_name,
    entity_type,
    entity_id,
    old_values,
    new_values
)
VALUES (
    1,
    'slot_blocked',
    'booking_slot',
    'booking_slot',
    (
        SELECT id
        FROM booking_slots
        WHERE hall_id = 1
          AND slot_date = '2026-06-20'
          AND shift_id = (SELECT id FROM shifts WHERE name = 'Day Shift' LIMIT 1)
        LIMIT 1
    ),
    JSON_OBJECT('slot_status', 'available'),
    JSON_OBJECT('slot_status', 'blocked', 'reason', 'Maintenance / internal hold')
);

-- ============================================================
-- USEFUL TEST QUERIES
-- You can run these after the script.
-- ============================================================

-- 1. Calendar availability for June 2026
SELECT
    slot_date,
    hall_name,
    shift_name,
    start_time,
    end_time,
    slot_status,
    booking_no,
    event_title,
    booking_status
FROM vw_calendar_slots
WHERE hall_id = 1
  AND slot_date BETWEEN '2026-06-01' AND '2026-06-30'
ORDER BY slot_date, sort_order;

-- 2. See all bookings with payment
SELECT
    b.id AS booking_id,
    b.booking_no,
    u.name AS customer_name,
    bs.slot_date,
    h.name AS hall_name,
    s.name AS shift_name,
    b.booking_status,
    p.payment_method,
    p.payment_status,
    p.amount
FROM bookings b
JOIN customers c ON c.id = b.customer_id
JOIN users u ON u.id = c.user_id
JOIN booking_slots bs ON bs.id = b.booking_slot_id
JOIN halls h ON h.id = bs.hall_id
JOIN shifts s ON s.id = bs.shift_id
LEFT JOIN payments p ON p.booking_id = b.id
ORDER BY b.id;

-- 3. Example: create a new booking from API/backend logic
-- First find an available slot:
-- SELECT * FROM vw_calendar_slots
-- WHERE slot_date = '2026-06-12'
--   AND shift_name = 'Day Shift';

-- Then use the slot_id from the result:
-- CALL sp_create_dummy_booking(
--     2,
--     23,
--     'Birthday Program',
--     'Birthday',
--     120,
--     25000.00
-- );

-- 4. Count statuses for UI testing
SELECT
    slot_status,
    COUNT(*) AS total_slots
FROM booking_slots
GROUP BY slot_status
ORDER BY slot_status;
