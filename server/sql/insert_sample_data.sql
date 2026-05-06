-- Insert/Replace Sample Data for KPI Categories, Subcategories, and Measurements
-- This script will replace existing data with sample data

-- Insert/Replace Categories
MERGE INTO kpi_categories AS target
USING (VALUES
    ('safety', 'Safety', '#DC2626', 1, 1),
    ('quality', 'Quality', '#16A34A', 2, 1),
    ('delivery', 'Delivery', '#2563EB', 3, 1),
    ('compliance', 'Compliance', '#9333EA', 4, 1),
    ('hr', 'HR', '#EA580C', 5, 1),
    ('attractive', 'Attractive', '#DB2777', 6, 1),
    ('environment', 'Environment', '#0D9488', 7, 1),
    ('cost', 'Cost', '#4F46E5', 8, 1)
) AS source ([key], name, color, sort_order, is_active)
ON target.[key] = source.[key]
WHEN MATCHED THEN
    UPDATE SET name = source.name, color = source.color, sort_order = source.sort_order, is_active = source.is_active
WHEN NOT MATCHED THEN
    INSERT ([key], name, color, sort_order, is_active)
    VALUES (source.[key], source.name, source.color, source.sort_order, source.is_active);

-- Insert/Replace Subcategories
-- First delete existing measurements to handle foreign key constraints
DELETE FROM kpi_measurements;
-- Then delete existing subcategories
DELETE FROM kpi_measurement_sub_categories;

-- Insert Subcategories for Safety
DECLARE @safety_id INT;
SELECT @safety_id = id FROM kpi_categories WHERE [key] = 'safety';

INSERT INTO kpi_measurement_sub_categories (category_id, name, description, sort_order, is_active)
VALUES
    (@safety_id, 'Safety Training', 'Safety training programs and certifications', 1, 1),
    (@safety_id, 'Safety Incidents', 'Workplace safety incidents and accidents', 2, 1),
    (@safety_id, 'Safety Audits', 'Safety audit results and compliance', 3, 1);

-- Insert Subcategories for Quality
DECLARE @quality_id INT;
SELECT @quality_id = id FROM kpi_categories WHERE [key] = 'quality';

INSERT INTO kpi_measurement_sub_categories (category_id, name, description, sort_order, is_active)
VALUES
    (@quality_id, 'Quality Control', 'Quality control measures and inspections', 1, 1),
    (@quality_id, 'Customer Satisfaction', 'Customer feedback and satisfaction metrics', 2, 1),
    (@quality_id, 'Defect Rate', 'Product defect rates and quality issues', 3, 1);

-- Insert Subcategories for Delivery
DECLARE @delivery_id INT;
SELECT @delivery_id = id FROM kpi_categories WHERE [key] = 'delivery';

INSERT INTO kpi_measurement_sub_categories (category_id, name, description, sort_order, is_active)
VALUES
    (@delivery_id, 'On-Time Delivery', 'On-time delivery performance metrics', 1, 1),
    (@delivery_id, 'Lead Time', 'Production and delivery lead times', 2, 1),
    (@delivery_id, 'Inventory', 'Inventory management and turnover', 3, 1);

-- Insert Subcategories for Cost
DECLARE @cost_id INT;
SELECT @cost_id = id FROM kpi_categories WHERE [key] = 'cost';

INSERT INTO kpi_measurement_sub_categories (category_id, name, description, sort_order, is_active)
VALUES
    (@cost_id, 'Production Cost', 'Production cost reduction and efficiency', 1, 1),
    (@cost_id, 'Material Cost', 'Material cost optimization', 2, 1),
    (@cost_id, 'Overhead Cost', 'Overhead cost management', 3, 1);

-- Insert Subcategories for HR
DECLARE @hr_id INT;
SELECT @hr_id = id FROM kpi_categories WHERE [key] = 'hr';

INSERT INTO kpi_measurement_sub_categories (category_id, name, description, sort_order, is_active)
VALUES
    (@hr_id, 'Training', 'Employee training and development', 1, 1),
    (@hr_id, 'Retention', 'Employee retention and engagement', 2, 1),
    (@hr_id, 'Recruitment', 'Recruitment efficiency and time-to-hire', 3, 1);

-- Insert Subcategories for Environment
DECLARE @env_id INT;
SELECT @env_id = id FROM kpi_categories WHERE [key] = 'environment';

INSERT INTO kpi_measurement_sub_categories (category_id, name, description, sort_order, is_active)
VALUES
    (@env_id, 'Energy Consumption', 'Energy usage and efficiency', 1, 1),
    (@env_id, 'Waste Management', 'Waste reduction and recycling', 2, 1),
    (@env_id, 'Carbon Footprint', 'Carbon emissions and environmental impact', 3, 1);

-- Insert Subcategories for Compliance
DECLARE @compliance_id INT;
SELECT @compliance_id = id FROM kpi_categories WHERE [key] = 'compliance';

INSERT INTO kpi_measurement_sub_categories (category_id, name, description, sort_order, is_active)
VALUES
    (@compliance_id, 'Regulatory Compliance', 'Regulatory compliance status', 1, 1),
    (@compliance_id, 'Internal Audit', 'Internal audit findings and compliance', 2, 1);

-- Insert Subcategories for Attractive
DECLARE @attractive_id INT;
SELECT @attractive_id = id FROM kpi_categories WHERE [key] = 'attractive';

INSERT INTO kpi_measurement_sub_categories (category_id, name, description, sort_order, is_active)
VALUES
    (@attractive_id, 'Workplace Environment', 'Workplace attractiveness and environment', 1, 1),
    (@attractive_id, 'Employee Benefits', 'Employee benefits and perks', 2, 1);

-- Insert/Replace Measurements
-- Get subcategory IDs with category filter to ensure correct matches
DECLARE @safety_training_id INT, @safety_incidents_id INT;
SELECT @safety_training_id = id FROM kpi_measurement_sub_categories WHERE name = 'Safety Training' AND category_id = @safety_id;
SELECT @safety_incidents_id = id FROM kpi_measurement_sub_categories WHERE name = 'Safety Incidents' AND category_id = @safety_id;

DECLARE @quality_control_id INT, @customer_sat_id INT;
SELECT @quality_control_id = id FROM kpi_measurement_sub_categories WHERE name = 'Quality Control' AND category_id = @quality_id;
SELECT @customer_sat_id = id FROM kpi_measurement_sub_categories WHERE name = 'Customer Satisfaction' AND category_id = @quality_id;

DECLARE @ontime_delivery_id INT, @lead_time_id INT;
SELECT @ontime_delivery_id = id FROM kpi_measurement_sub_categories WHERE name = 'On-Time Delivery' AND category_id = @delivery_id;
SELECT @lead_time_id = id FROM kpi_measurement_sub_categories WHERE name = 'Lead Time' AND category_id = @delivery_id;

-- Insert Measurements (only if subcategory IDs are found)
IF @safety_training_id IS NOT NULL
BEGIN
    INSERT INTO kpi_measurements (category_id, sub_category_id, name, measurement, unit, main, main_relate, main_department_id, description_of_target, is_active)
    VALUES (@safety_id, @safety_training_id, 'Training Hours', 'Training Hours per Employee', 'hours', 'All', 'All', 'All', 'Average safety training hours per employee per year', 1);
END

IF @safety_incidents_id IS NOT NULL
BEGIN
    INSERT INTO kpi_measurements (category_id, sub_category_id, name, measurement, unit, main, main_relate, main_department_id, description_of_target, is_active)
    VALUES (@safety_id, @safety_incidents_id, 'Lost Time Injury', 'Lost Time Injury Rate', 'cases', 'All', 'All', 'All', 'Number of lost time injuries per year', 1);
END

IF @quality_control_id IS NOT NULL
BEGIN
    INSERT INTO kpi_measurements (category_id, sub_category_id, name, measurement, unit, main, main_relate, main_department_id, description_of_target, is_active)
    VALUES (@quality_id, @quality_control_id, 'First Pass Yield', 'First Pass Yield', '%', 'All', 'All', 'All', 'Percentage of products passing quality inspection on first attempt', 1);
END

IF @customer_sat_id IS NOT NULL
BEGIN
    INSERT INTO kpi_measurements (category_id, sub_category_id, name, measurement, unit, main, main_relate, main_department_id, description_of_target, is_active)
    VALUES (@quality_id, @customer_sat_id, 'Customer Satisfaction', 'Customer Satisfaction Score', 'score', 'All', 'All', 'All', 'Customer satisfaction survey score', 1);
END

IF @ontime_delivery_id IS NOT NULL
BEGIN
    INSERT INTO kpi_measurements (category_id, sub_category_id, name, measurement, unit, main, main_relate, main_department_id, description_of_target, is_active)
    VALUES (@delivery_id, @ontime_delivery_id, 'On-Time Delivery', 'On-Time Delivery Rate', '%', 'All', 'All', 'All', 'Percentage of orders delivered on time', 1);
END

IF @lead_time_id IS NOT NULL
BEGIN
    INSERT INTO kpi_measurements (category_id, sub_category_id, name, measurement, unit, main, main_relate, main_department_id, description_of_target, is_active)
    VALUES (@delivery_id, @lead_time_id, 'Lead Time', 'Average Lead Time', 'days', 'All', 'All', 'All', 'Average time from order to delivery', 1);
END

PRINT 'Sample data replaced successfully';
