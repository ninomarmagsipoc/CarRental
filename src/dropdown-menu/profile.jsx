import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import '../Css/profile.css'; // Make sure this CSS file is updated below!

function Profile() {
    const [user, setUser] = useState(null);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [preview, setPreview] = useState(null);
    const [file, setFile] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Load user data on mount
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (storedUser) {
            setUser(storedUser);
            // Split name if needed
            const names = storedUser.name?.split(" ") || [];
            setFirstName(storedUser.firstName || storedUser.FirstName || "");
            setLastName(storedUser.lastName  || "");
        }else {
            navigate("/");
        }
    }, [navigate]);

    // Handle image preview
    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
        }
    };

    // Upload image
    const uploadProfile = async () => {
        if (!file) return user?.profileImage;

        try {
            console.log("Uploading..."); // Debug
            const formData = new FormData();
            formData.append("UserId", user.userId);
            formData.append("File", file);

            const res = await fetch("https://localhost:7263/api/auth/upload-profile", {
                method: "POST",
                body: formData
            });

            console.log("Response received:", res); // Debug
            const data = await res.json();
            console.log("Data:", data); // Debug

            if (!res.ok) {
                alert(data.message || "Upload failed");
                return user.profileImage;
            }

            return data.data.imageUrl;

        } catch (err) {
            console.error("ERROR:", err);
            alert("Something went wrong!");
            return user.profileImage;
        }
    };

    // Save profile changes
    const handleSave = async () => {
        let imageUrl = user.profileImage;

        if (file) {
            imageUrl = await uploadProfile();
        }

        const updatedUser = {
            ...user,
            name: `${firstName} ${lastName}`,
            profileImage: imageUrl
        };

        localStorage.setItem("user", JSON.stringify(updatedUser));
        window.dispatchEvent(new Event("profileUpdated")); // Optional: Update Header
        alert("Profile updated!");
    };

    if (!user) return <p>Loading...</p>;

    return (
        <div className="profile-wrapper">
            <h2>Edit Profile</h2>
            <div className="profile-layout">
                {/* 👈 Left Column (Sketch-inspired Sidebar) */}
                <div className="profile-sidebar">
                    <img
                        src={preview || user.profileImage || "/default-avatar.png"}
                        alt="profile"
                        className="profile-img-large"
                    />
                    
                    {/* Styled button to trigger the hidden file input */}
                    <label htmlFor="file-upload" className="change-profile-btn">
                        Change Profile
                    </label>
                    <input id="file-upload" type="file" onChange={handleFileChange} style={{ display: 'none' }} />
                </div>

                {/* 👉 Right Column (Main Form Section) */}
                <div className="profile-main">
                    <div className="form-group">
                        <label>First Name</label>
                        <input
                            type="text"
                            value={firstName}
                            disabled
                        />
                    </div>

                    <div className="form-group">
                        <label>Last Name</label>
                        <input
                            type="text"
                            value={lastName} disabled
                        />
                    </div>

                    <div className="form-group">
                        <label>Email</label>
                        <input type="text" value={user.email} disabled />
                    </div>

                    <button className="save-btn" onClick={handleSave}>
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Profile;