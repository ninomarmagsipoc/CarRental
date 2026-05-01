import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import '../Css/profile.css';

function Profile() {
    const [user, setUser] = useState(null);

    const [origFirstName, setOrigFirstName] = useState("");
    const [origLastName, setOrigLastName] = useState("");

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState(""); 
    const [confirmPassword, setConfirmPassword] = useState("");

    const [preview, setPreview] = useState(null);
    const [file, setFile] = useState(null);

    const [errors, setErrors] = useState({});

    // UI Toggle States (Para tago ang form daan)
    const [showNameForm, setShowNameForm] = useState(false);
    const [showPassForm, setShowPassForm] = useState(false);

    // OTP States
    const [otpCode, setOtpCode] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [message, setMessage] = useState("");

    const navigate = useNavigate();

    const validateForm = () => {
        let newErrors = {};
        const nameRegex = /^[A-Za-z\s]+$/;

        if (showNameForm) {
            if (!nameRegex.test(firstName)) {
                newErrors.firstName = "First name should contain letters only.";
            }
            if (!nameRegex.test(lastName)) {
                newErrors.lastName = "Last name should contain letters only.";
            }
        }

        if (showPassForm && newPassword) {
            if (newPassword.length < 6) {
                newErrors.password = "Password must be at least 6 characters.";
            }
            if (newPassword !== confirmPassword) {
                newErrors.confirmPassword = "Passwords do not match.";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    useEffect(() => {
        const loadData = () => {
            const storedUser = JSON.parse(localStorage.getItem("user"));
            if (storedUser) {
                setUser(storedUser);

                const imgPath = storedUser.profileImage || storedUser.ProfileImage;
                if (imgPath && !imgPath.startsWith('http')) {
                    setPreview(`https://localhost:7263${imgPath}`);
                } else {
                    setPreview(imgPath);
                }

                setFirstName(storedUser.firstName || "");
                setOrigFirstName(storedUser.firstName || "");
                setLastName(storedUser.lastName || "");
                setOrigLastName(storedUser.lastName || "");
            } else {
                navigate("/");
            }
        };

        loadData();

        window.addEventListener("profileUpdated", loadData);
        return () => window.removeEventListener("profileUpdated", loadData);
    }, [navigate]);

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
        }
    };

    const uploadProfile = async () => {
        if (!file) return user?.profileImage || user?.ProfileImage;
        try {
            const formData = new FormData();
            formData.append("UserId", user.userId || user.Id || user.id);
            formData.append("File", file);

            const res = await fetch("https://localhost:7263/api/auth/upload-profile", {
                method: "POST",
                body: formData
            });

            const data = await res.json();
            if (!res.ok) {
                setMessage(data.message || "Image upload failed");
                return user?.profileImage || user?.ProfileImage;
            }
            return data.data.imageUrl;
        } catch (err) {
            console.error("ERROR:", err);
            return user?.profileImage || user?.ProfileImage;
        }
    };

    const handleSendOtp = async () => {
        try {
            setMessage("Sending OTP...");
            const res = await fetch(`https://localhost:7263/api/auth/send-otp?email=${user.email || user.Email}`, {
                method: 'POST'
            });
            if (res.ok) {
                setOtpSent(true);
                setMessage("OTP sent to your email! Please check your inbox.");
            } else {
                setMessage("Failed to send OTP.");
            }
        } catch (error) {
            setMessage("Error sending OTP.");
        }
    };

    const handleSave = async () => {
        if (!validateForm()) {
            setMessage("Please fix the errors before saving.");
            return;
        }

        setMessage("Saving changes...");
        let finalImageUrl = user.profileImage || user.ProfileImage;

        if (file) {
            finalImageUrl = await uploadProfile();
        }

        const isTextEdited = firstName !== origFirstName || lastName !== origLastName || newPassword.trim() !== "";

        if (isTextEdited) {
            if (!otpCode) {
                setMessage("Please enter the OTP code to confirm your new name/password.");
                return;
            }

            const requestData = {
                userId: user.userId || user.Id || user.id,
                email: user.email || user.Email,
                firstName: firstName !== origFirstName ? firstName : "",
                lastName: lastName !== origLastName ? lastName : "",
                currentPassword: currentPassword,
                newPassword: newPassword,
                otpCode: otpCode
            };

            try {
                const res = await fetch('https://localhost:7263/api/auth/update-profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestData)
                });
                const data = await res.json();

                if (!res.ok) {
                    setMessage("Error updating details: " + data.Message);
                    return; 
                }
            } catch (error) {
                setMessage("Error connecting to server.");
                return;
            }
        }

        const updatedUser = {
            ...user,
            firstName: firstName,
            lastName: lastName,
            FirstName: firstName,
            LastName: lastName,
            name: `${firstName} ${lastName}`,
            profileImage: finalImageUrl,
            ProfileImage: finalImageUrl
        };

        localStorage.setItem("user", JSON.stringify(updatedUser));
        window.dispatchEvent(new Event("profileUpdated"));

        setMessage("Profile updated successfully!");
        setOrigFirstName(firstName);
        setOrigLastName(lastName);
        
        // Reset and hide forms
        setShowNameForm(false);
        setShowPassForm(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setOtpSent(false);
        setOtpCode("");
        setFile(null);
    };

    const handleCancelName = () => {
        setFirstName(origFirstName);
        setLastName(origLastName);
        setShowNameForm(false);
        setErrors((prev) => ({ ...prev, firstName: null, lastName: null }));
    };

    const handleCancelPass = () => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowPassForm(false);
        setErrors((prev) => ({ ...prev, password: null, confirmPassword: null }));
    };

    if (!user) return <div className="settings-loading">Loading...</div>;

    const isTextEdited = firstName !== origFirstName || lastName !== origLastName || newPassword.trim() !== "";
    const hasChanges = isTextEdited || file !== null;

    return (
        <div className="settings-page-wrapper">
            <div className="settings-container">
                
                <div className="settings-header">
                    <h1>Account Settings</h1>
                    <p>Manage your profile information and security.</p>
                </div>

                {message && (
                    <div className={`settings-alert ${message.includes("Error") || message.includes("Failed") || message.includes("Please enter") ? 'alert-error' : 'alert-success'}`}>
                        {message}
                    </div>
                )}

                <div className="settings-content">
                    <div className="settings-sidebar">
                        <div className="settings-avatar-wrapper">
                            {preview ? (
                                <img
                                    src={preview} 
                                    className="settings-avatar"
                                    alt="Profile"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        setPreview(null); 
                                    }}
                                />
                            ) : (
                                <div className="settings-avatar-placeholder">
                                    {origFirstName?.charAt(0)}{origLastName?.charAt(0)}
                                </div>
                            )}
                        </div>
                        <label htmlFor="file-upload" className="settings-upload-btn">
                            Change Picture
                        </label>
                        <input id="file-upload" type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                    </div>

                   
                    <div className="settings-form">
                        
                        
                        <div className="form-section-title" style={{ marginTop: 0 }}>Personal Information</div>
                        
                       
                        <div className="info-display-row">
                            <div className="info-text">
                                <label>Email Address</label>
                                <p>{user.email || user.Email}</p>
                            </div>
                        </div>

                       
                        {!showNameForm ? (
                            <div className="info-display-row">
                                <div className="info-text">
                                    <label>Full Name</label>
                                    <p>{origFirstName} {origLastName}</p>
                                </div>
                                <button className="btn-edit-toggle" onClick={() => setShowNameForm(true)}>Edit Name</button>
                            </div>
                        ) : (
                            <div className="edit-box">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>First Name</label>
                                        <input
                                            type="text"
                                            className="settings-input"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                        />
                                        {errors.firstName && <span className="settings-error">{errors.firstName}</span>}
                                    </div>
                                    <div className="form-group">
                                        <label>Last Name</label>
                                        <input
                                            type="text"
                                            className="settings-input"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                        />
                                        {errors.lastName && <span className="settings-error">{errors.lastName}</span>}
                                    </div>
                                </div>
                                <div className="edit-box-actions">
                                    <button className="btn-cancel" onClick={handleCancelName}>Cancel</button>
                                </div>
                            </div>
                        )}

                       
                        <div className="form-section-title">Security</div>

                        
                        {!showPassForm ? (
                            <div className="info-display-row">
                                <div className="info-text">
                                    <label>Password</label>
                                    <p>••••••••</p>
                                </div>
                                <button className="btn-edit-toggle" onClick={() => setShowPassForm(true)}>Change Password</button>
                            </div>
                        ) : (
                            <div className="edit-box">
                                <div className="form-group full-width">
                                    <label>Current Password</label>
                                    <input
                                        type="password"
                                        className="settings-input"
                                        placeholder="Enter current password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>New Password</label>
                                        <input
                                            type="password"
                                            className="settings-input"
                                            placeholder="Enter new password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                        />
                                        {errors.password && <span className="settings-error">{errors.password}</span>}
                                    </div>
                                    <div className="form-group">
                                        <label>Confirm Password</label>
                                        <input
                                            type="password"
                                            className="settings-input"
                                            placeholder="Re-type new password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                        {errors.confirmPassword && <span className="settings-error">{errors.confirmPassword}</span>}
                                    </div>
                                </div>
                                <div className="edit-box-actions">
                                    <button className="btn-cancel" onClick={handleCancelPass}>Cancel</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

               
                {hasChanges && (
                    <div className="settings-actions">
                        {!isTextEdited && file && (
                            <button className="settings-btn btn-primary" onClick={handleSave}>
                                Save Profile Picture
                            </button>
                        )}

                        {isTextEdited && !otpSent && (
                            <div className="settings-otp-box">
                                <p>You are updating sensitive information. Verification is required.</p>
                                <button className="settings-btn btn-primary" onClick={handleSendOtp}>
                                    Request OTP to Save
                                </button>
                            </div>
                        )}

                        {isTextEdited && otpSent && (
                            <div className="settings-otp-box verify-box">
                                <label>Enter OTP Code sent to your email:</label>
                                <div className="otp-input-group">
                                    <input
                                        type="text"
                                        className="settings-input"
                                        placeholder="E.g. 123456"
                                        value={otpCode}
                                        onChange={(e) => setOtpCode(e.target.value)}
                                    />
                                    <button className="settings-btn btn-success" onClick={handleSave}>
                                        Verify & Save
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}

export default Profile;