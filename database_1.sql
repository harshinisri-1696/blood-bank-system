-- =============================================
-- BLOOD BANK MANAGEMENT SYSTEM - DATABASE SETUP
-- =============================================

-- Drop database if exists (be careful with this!)
DROP DATABASE IF EXISTS blood_bank;

-- Create new database
CREATE DATABASE blood_bank;
USE blood_bank;

-- =============================================
-- TABLE 1: DONORS
-- =============================================
CREATE TABLE donors (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT 'Unique donor ID',
    name VARCHAR(100) NOT NULL COMMENT 'Donor full name',
    age INT NOT NULL CHECK (age >= 16 AND age <= 100) COMMENT 'Donor age',
    blood_group VARCHAR(5) NOT NULL COMMENT 'Blood group (A+, A-, B+, B-, O+, O-, AB+, AB-)',
    phone VARCHAR(15) NOT NULL COMMENT 'Contact number',
    address VARCHAR(200) COMMENT 'Residential address',
    last_donation_date DATE COMMENT 'Date of last blood donation',
    donation_count INT DEFAULT 1 COMMENT 'Total number of donations',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Registration date',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update date'
);

-- =============================================
-- TABLE 2: BLOOD REQUESTS
-- =============================================
CREATE TABLE blood_requests (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT 'Unique request ID',
    patient_name VARCHAR(100) NOT NULL COMMENT 'Patient name',
    blood_group VARCHAR(5) NOT NULL COMMENT 'Required blood group',
    quantity INT NOT NULL COMMENT 'Number of units required',
    hospital_name VARCHAR(150) COMMENT 'Hospital name',
    contact_phone VARCHAR(15) NOT NULL COMMENT 'Contact number for request',
    urgency VARCHAR(20) DEFAULT 'Normal' COMMENT 'Urgency level: Normal, High, Critical',
    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Request submission date',
    status VARCHAR(20) DEFAULT 'Pending' COMMENT 'Request status: Pending, Completed, Cancelled'
);

-- =============================================
-- TABLE 3: DONATION HISTORY
-- =============================================
CREATE TABLE donation_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    donor_id INT NOT NULL,
    donation_date DATE NOT NULL,
    blood_group VARCHAR(5) NOT NULL,
    quantity INT DEFAULT 1,
    hospital_name VARCHAR(150),
    notes TEXT,
    FOREIGN KEY (donor_id) REFERENCES donors(id) ON DELETE CASCADE
);

-- =============================================
-- INSERT SAMPLE DATA
-- =============================================

-- Insert donors
INSERT INTO donors (name, age, blood_group, phone, address, last_donation_date, donation_count) VALUES
('John Doe', 28, 'A+', '9876543210', '123 Main St, New York, NY 10001', '2024-01-15', 3),
('Sarah Smith', 24, 'O+', '9876543211', '456 Oak Ave, Los Angeles, CA 90001', '2024-02-10', 2),
('Mike Johnson', 32, 'B+', '9876543212', '789 Pine St, Chicago, IL 60601', '2024-01-20', 4),
('Emma Wilson', 27, 'AB+', '9876543213', '321 Elm St, Houston, TX 77001', '2024-02-01', 1),
('Robert Brown', 35, 'O-', '9876543214', '654 Maple Dr, Phoenix, AZ 85001', '2024-01-25', 5),
('Lisa Anderson', 29, 'A-', '9876543215', '987 Cedar Ln, Philadelphia, PA 19101', '2024-02-05', 2),
('David Taylor', 31, 'B-', '9876543216', '147 Birch Rd, San Antonio, TX 78201', '2024-01-30', 3),
('Maria Garcia', 26, 'AB-', '9876543217', '258 Walnut St, San Diego, CA 92101', '2024-02-12', 1),
('James Wilson', 34, 'O+', '9876543218', '369 Spruce Ave, Dallas, TX 75201', '2024-01-18', 4),
('Patricia Lee', 30, 'A+', '9876543219', '741 Cherry Blv, San Jose, CA 95101', '2024-02-08', 2);

-- Insert blood requests
INSERT INTO blood_requests (patient_name, blood_group, quantity, hospital_name, contact_phone, urgency) VALUES
('Alice Johnson', 'A+', 2, 'City General Hospital', '9876543220', 'High'),
('Bob Williams', 'O+', 3, 'Medical Center Hospital', '9876543221', 'Normal'),
('Carol Davis', 'B+', 1, 'St. Marys Hospital', '9876543222', 'Critical'),
('David Miller', 'AB+', 2, 'University Hospital', '9876543223', 'High'),
('Emma Brown', 'O-', 2, 'Childrens Hospital', '9876543224', 'Critical'),
('Frank Thomas', 'A-', 1, 'Community Hospital', '9876543225', 'Normal'),
('Grace Martinez', 'B-', 3, 'Regional Medical Center', '9876543226', 'High'),
('Henry Garcia', 'AB-', 1, 'Memorial Hospital', '9876543227', 'Normal');

-- Insert donation history
INSERT INTO donation_history (donor_id, donation_date, blood_group, quantity, hospital_name) VALUES
(1, '2024-01-15', 'A+', 1, 'City Blood Bank'),
(2, '2024-02-10', 'O+', 1, 'Red Cross Center'),
(3, '2024-01-20', 'B+', 1, 'Community Blood Center'),
(4, '2024-02-01', 'AB+', 1, 'City Blood Bank'),
(5, '2024-01-25', 'O-', 1, 'Memorial Hospital'),
(1, '2023-11-10', 'A+', 1, 'City Blood Bank'),
(3, '2023-12-15', 'B+', 1, 'Community Blood Center');

-- =============================================
-- CREATE VIEWS FOR EASY QUERYING
-- =============================================

-- View 1: Active donors (donated within last 6 months)
CREATE VIEW active_donors AS
SELECT id, name, age, blood_group, phone, last_donation_date, donation_count
FROM donors
WHERE last_donation_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH);

-- View 2: Blood group availability summary
CREATE VIEW blood_group_availability AS
SELECT 
    blood_group,
    COUNT(*) as total_donors,
    SUM(CASE WHEN last_donation_date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) THEN 1 ELSE 0 END) as active_donors
FROM donors
GROUP BY blood_group
ORDER BY blood_group;

-- View 3: Pending requests with urgency
CREATE VIEW pending_requests AS
SELECT 
    id,
    patient_name,
    blood_group,
    quantity,
    hospital_name,
    urgency,
    request_date
FROM blood_requests
WHERE status = 'Pending'
ORDER BY 
    CASE urgency 
        WHEN 'Critical' THEN 1
        WHEN 'High' THEN 2
        ELSE 3
    END,
    request_date ASC;

-- =============================================
-- CREATE INDEXES FOR BETTER PERFORMANCE
-- =============================================
CREATE INDEX idx_donors_blood_group ON donors(blood_group);
CREATE INDEX idx_donors_last_donation ON donors(last_donation_date);
CREATE INDEX idx_requests_blood_group ON blood_requests(blood_group);
CREATE INDEX idx_requests_status ON blood_requests(status);
CREATE INDEX idx_donation_history_donor ON donation_history(donor_id);

-- =============================================
-- CREATE STORED PROCEDURES
-- =============================================

-- Procedure to add a new donation
DELIMITER //
CREATE PROCEDURE AddDonation(
    IN p_donor_id INT,
    IN p_donation_date DATE
)
BEGIN
    DECLARE v_blood_group VARCHAR(5);
    
    -- Get donor's blood group
    SELECT blood_group INTO v_blood_group FROM donors WHERE id = p_donor_id;
    
    -- Insert donation record
    INSERT INTO donation_history (donor_id, donation_date, blood_group)
    VALUES (p_donor_id, p_donation_date, v_blood_group);
    
    -- Update donor's last donation date and count
    UPDATE donors 
    SET 
        last_donation_date = p_donation_date,
        donation_count = donation_count + 1
    WHERE id = p_donor_id;
END//
DELIMITER ;

-- =============================================
-- QUERIES TO VERIFY SETUP
-- =============================================

-- Show all tables
SHOW TABLES;

-- Count records in each table
SELECT 'Donors' as Table_Name, COUNT(*) as Record_Count FROM donors
UNION ALL
SELECT 'Blood Requests', COUNT(*) FROM blood_requests
UNION ALL
SELECT 'Donation History', COUNT(*) FROM donation_history;

-- Display sample data
SELECT '=== SAMPLE DONORS ===' as '';
SELECT * FROM donors LIMIT 5;

SELECT '=== SAMPLE BLOOD REQUESTS ===' as '';
SELECT * FROM blood_requests LIMIT 5;

SELECT '=== BLOOD GROUP AVAILABILITY ===' as '';
SELECT * FROM blood_group_availability;

SELECT '=== PENDING REQUESTS ===' as '';
SELECT * FROM pending_requests;

-- =============================================
-- END OF SETUP
-- =============================================
SELECT 'Database setup completed successfully!' as Status;