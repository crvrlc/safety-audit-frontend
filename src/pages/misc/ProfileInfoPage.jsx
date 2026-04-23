import React from "react";
import "../css/ProfileInfoPage.css";

const ProfileInfoPage = () => {
    return (
        <div className="profile-page">
  <h1 className="page-title">Profile Information</h1>

  <div className="profile-card">

    {/* Photo */}
    <div className="profile-photo">
      <img src={user.photo} alt="Profile" />
    </div>

    {/* Form */}
    <div className="profile-form">
      <div className="form-group">
        <label>Name</label>
        <input type="text" value={user.name} />
      </div>

      <div className="form-group">
        <label>Email</label>
        <input type="email" value={user.email} disabled />
      </div>

      <div className="form-group">
        <label>Role</label>
        <input type="text" value={user.role} disabled />
      </div>

      <div className="form-group">
        <label>Department</label>
        <input type="text" value={user.department} />
      </div>

      <div className="form-group">
        <label>Mobile Number</label>
        <input type="text" value={user.mobile} />
      </div>

      <div className="form-actions">
        <button className="btn-secondary">Cancel</button>
        <button className="btn-primary">Save</button>
      </div>
    </div>

  </div>
</div>
    )
}

export default ProfileInfoPage