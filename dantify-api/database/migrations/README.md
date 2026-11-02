# Dantify remaining Laravel migration scripts

Contains 24 migrations for the remaining tables from the supplied PostgreSQL schema, converted to Laravel Schema Builder syntax for MySQL. `roles` and `users` are excluded because those migrations already exist in your project.

## Installation
1. Back up your project/database.
2. Copy these 24 PHP files to `database/migrations/`.
3. Check that your `roles` and `users` migrations run before these. If their timestamps sort later than `2026_10_13_000003`, rename these files to later timestamps while preserving numeric order.
4. If any of these migrations already exist in your project, do not add a duplicate; compare and merge the schema instead.
5. Run `php artisan migrate:status`, then `php artisan migrate`.

## Tables included
clinics, insurance_providers, appointment_status, services, communication_types, dentists, patients, dentist_clinics, appointments, appointment_services, bills, treatment_plans, bill_services, treatment_plan_services, payments, prescriptions, medical_history, xrays_and_images, documents, feedbacks, prescription_items, lab_works, communication_logs, audit_logs.

## Source-schema decisions
- `appointment_status.code` is included because the supplied INSERTs use it.
- `appointments.appointment_status_id` gets a foreign key to `appointment_status.id`.
- `clinics.user_id` is omitted because it appears in sample INSERTs but not in the table definition.
- `lab_works.xrays_and_images_id` is omitted as redundant with `result_image_id`; `result_image_id` is nullable and uses `ON DELETE SET NULL`.
- `bills.balance_amount` is a stored generated column. If the installed MySQL/MariaDB version rejects it, use a regular decimal field and calculate it in application logic.
- MySQL versions vary in CHECK constraint enforcement; validate positive quantities and feedback ratings in application logic too.
- `communication_types` follows the source definition and has no timestamps.

Do not run `php artisan migrate:fresh` unless you intend to drop all tables and data.
