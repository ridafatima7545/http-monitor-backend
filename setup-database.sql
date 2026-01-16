-- Create database for HTTP Monitor
-- Run this with: psql -U postgres -f setup-database.sql

-- Create the database
CREATE DATABASE http_monitor;

-- Connect to the database
\c http_monitor

-- The tables will be created automatically by TypeORM synchronize
-- This script just ensures the database exists

-- Verify
SELECT 'Database http_monitor created successfully!' AS status;
