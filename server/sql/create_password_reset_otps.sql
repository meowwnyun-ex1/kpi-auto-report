-- Password Reset OTP Table
-- Stores one-time passwords for password change verification

CREATE TABLE password_reset_otps (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    otp_hash NVARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    used BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    
    CONSTRAINT FK_password_reset_otps_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX IX_password_reset_otps_user ON password_reset_otps(user_id);
CREATE INDEX IX_password_reset_otps_expires ON password_reset_otps(expires_at);

-- Grant permissions (adjust as needed for your environment)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON password_reset_otps TO [your_user];
