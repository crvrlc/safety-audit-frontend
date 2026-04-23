import React from 'react'
import '../css/ResourcesPage.css'

const Resources = () => {
  return (
    <div className="resources-page">
      {/* Title */}
      <div>
        <h4>Resources</h4>
        <p className="page-subtext">
          This page presents the regulatory and international standards used as the basis for the Safety Audit Checklist. Each checklist section is aligned with applicable Philippine laws and ISO standards to ensure compliance and best practice implementation.
        </p>
      </div>

      <h2 className="resources-main-title">
        Regulatory and Standards Basis of the Safety Audit Checklist
      </h2>

      {/* SECTION 1: PH REGULATIONS */}
      <div className="resources-section">
        <div className="section-header">Philippine Regulations</div>

        <div className="section-grid">

          {/* OSHS */}
          <div className="inner-block">
            <div className="block-title">Occupational Safety and Health Standards (OSHS), 2020 Edition</div>
            <p className="subtext">Issued by the Department of Labor and Employment (DOLE)</p>

            <table>
              <thead>
                <tr>
                  <th>OSHS Rule</th>
                  <th>Application in Checklist</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Rule 1070</td><td>Housekeeping and Workplace Safety</td></tr>
                <tr><td>Rule 1080</td><td>Personal Protective Equipment (PPE)</td></tr>
                <tr><td>Rule 1210</td><td>Electrical Safety</td></tr>
                <tr><td>Rule 1940</td><td>Fire Protection and Emergency Preparedness</td></tr>
              </tbody>
            </table>
          </div>

          {/* RA 9514 */}
          <div className="inner-block">
            <div className="block-title">Republic Act No. 9514 - Fire Code of the Philippines</div>

            <table>
              <thead>
                <tr>
                  <th>Section</th>
                  <th>Application in the Checklist</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>8.0.3.5</td><td>Fire Extingguisher Placement</td></tr>
                <tr><td>10.2.4.5</td><td>Emergency Exits and Signage</td></tr>
              </tbody>
            </table>
          </div>

        </div>
      </div>

      <div className="resources-section two-column">

  {/* LEFT COLUMN */}
  <div className="section-column">
    <div className="section-header">
      International Standards Framework
    </div>

    <div className="inner-block">
      <div className="block-title">ISO 45001: 2018</div>
      <p className="subtext">Occupational Health and Safety Management Systems      </p>

      <table>
        <thead>
          <tr>
            <th>Clause</th>
            <th>Application in the Checklist</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Clause 6.1</td><td>Risk Identification & Hazard Assessment</td></tr>
          <tr><td>Clause 8.1</td><td>Operational Planning and Control</td></tr>
          <tr><td>Clause 9.1</td><td>Monitoring and Performance Evaluation</td></tr>
        </tbody>
      </table>

      <div className="block-title">ISO 45001: 2018 (Guidelines for Auditing Management Systems)</div>
      <p className="subtext">Basis for structured audit methodology and systematic evaluation.</p>

      <div className="block-title">ISO 31000: 2018 (Risk Management Guidelines)</div>
      <p className="subtext">Basis for risk-based approach in checklist structuring.</p>

    </div>
  </div>

  {/* RIGHT COLUMN */}
  <div className="section-column">
    <div className="section-header">
      Checklist Section Alignment Matrix
    </div>

    <div className="inner-block">
      <table>
        <thead>
          <tr>
            <th>Checklist Section</th>
            <th>Regulatory Basis</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>General Administrative Safety</td><td>OSHS Rule 1070, Rule 1080, ISO 45001 Clause 8.1</td></tr>
          <tr><td>ClassroomSafety</td><td>OSHS Rule 1070, Fire Code Sec. 10.2.4.5, ISO 45001 Clause 6.1</td></tr>
          <tr><td>Chemical Laboratory Safety</td><td>OSHS Rule 1070, ISO 45001 Clause 8.1 Clause 6.1</td></tr>
          <tr><td>Agro-Industrial Centers Safety</td><td>OSHS Rule 1070, ISO 45001 Clause 6.1 & 8.1</td></tr>
          <tr><td>Mechanical & Workshop Safety</td><td>OSHS Rule 1080, ISO 45001 Clause 8.1</td></tr>
          <tr><td>Electrical Safety</td><td>OSHS Rule 1210, ISO 45001 Clause 8.1</td></tr>
          <tr><td>Fire Safety and Emergency Preparedness</td><td>OSHS Rule 1940, RA 9514, ISO 45001 Clause 8.1</td></tr>
          <tr><td>Environmental and Waste Management</td><td>OSHS Rule 1070, ISO 45001 Clause 6.1</td></tr>
          <tr><td>Student Spaces Safety</td><td>OSHS Rule 1070, ISO 45001 Clause 6.1</td></tr>
        </tbody>
      </table>
    </div>
  </div>

</div>


    </div>
  )
}

export default Resources
