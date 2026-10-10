
import React, { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle,
  FileSpreadsheet,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  RefreshCw,
  Search,
  ShieldCheck,
  Upload,
  Users,
  X,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import Login from './login';
import './style.css';

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? "https://edupulse-ai-student-analytics.onrender.com"
    : "http://127.0.0.1:8000");
const demoStudents = [
  { id: 1, name: 'Aarav Kumar', department: 'CSE', attendance: 92, marks: 86, risk: 'Low' },
  { id: 2, name: 'Priya Sharma', department: 'CSE', attendance: 68, marks: 58, risk: 'Medium' },
  { id: 3, name: 'Rahul Reddy', department: 'AIML', attendance: 45, marks: 39, risk: 'High' },
  { id: 4, name: 'Sneha Rao', department: 'Data Science', attendance: 88, marks: 79, risk: 'Low' },
  { id: 5, name: 'Kiran Kumar', department: 'ECE', attendance: 61, marks: 52, risk: 'Medium' },
];

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'students', label: 'Students', icon: Users },
  { id: 'risk', label: 'AI Risk Lab', icon: Brain },
  { id: 'upload', label: 'Upload Dataset', icon: FileSpreadsheet },
];

function getRisk(student) {
  const value = String(student.risk ?? '').toLowerCase();

  if (value.includes('high')) return 'High';
  if (value.includes('medium')) return 'Medium';
  if (value.includes('low')) return 'Low';

  const attendance = Number(
    student.attendance ?? student.attendance_percentage ?? 0
  );
  const marks = Number(
    student.marks ?? student.score ?? student.average_marks ?? 0
  );

  if (attendance < 50 || marks < 40) return 'High';
  if (attendance < 75 || marks < 60) return 'Medium';

  return 'Low';
}

function normalizeStudent(student, index) {
  const normalized = {
    ...student,
    id: student.id ?? student.student_id ?? index + 1,
    name:
      student.name ??
      student.student_name ??
      student.full_name ??
      `Student ${index + 1}`,
    department: student.department ?? student.dept ?? 'Not specified',
    attendance: Number(
      student.attendance ?? student.attendance_percentage ?? 0
    ),
    marks: Number(
      student.marks ?? student.score ?? student.average_marks ?? 0
    ),
  };

  return { ...normalized, risk: getRisk(normalized) };
}

function StatCard({ title, value, subtitle, icon: Icon }) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <span>{title}</span>
        <span className="stat-icon"><Icon size={21} /></span>
      </div>
      <h2>{value}</h2>
      <p>{subtitle}</p>
    </div>
  );
}

function RiskBadge({ risk }) {
  const safeRisk = ['Low', 'Medium', 'High'].includes(risk) ? risk : 'Low';

  return (
    <span className={`risk-badge risk-${safeRisk.toLowerCase()}`}>
      {safeRisk}
    </span>
  );
}

function StudentTable({ students, onSelect }) {
  if (!students.length) {
    return (
      <div className="empty-state">
        No students found. Try changing your search or department filter.
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="students-table">
        <thead>
          <tr>
            <th>Student</th>
            <th>ID</th>
            <th>Department</th>
            <th>Attendance</th>
            <th>Marks</th>
            <th>Risk</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student, index) => (
            <tr key={`${student.id}-${index}`}>
              <td>
                <div className="student-name-cell">
                  <span className="student-avatar">
                    {String(student.name).charAt(0).toUpperCase()}
                  </span>
                  <strong>{student.name}</strong>
                </div>
              </td>
              <td>{student.id}</td>
              <td>{student.department}</td>
              <td>{student.attendance}%</td>
              <td>{student.marks}</td>
              <td><RiskBadge risk={getRisk(student)} /></td>
              <td>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => onSelect(student)}
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activePage, setActivePage] = useState('overview');
  const [students, setStudents] = useState(demoStudents);
  const [searchText, setSearchText] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [csvFile, setCsvFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [apiAvailable, setApiAvailable] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const loadStudents = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/students`);

      if (!response.ok) {
        throw new Error('Could not load students.');
      }

      const data = await response.json();
      const list = Array.isArray(data)
        ? data
        : data.students ?? data.data ?? [];

      if (!Array.isArray(list)) {
        throw new Error('Unexpected student data format.');
      }

      setStudents(list.map(normalizeStudent));
      setApiAvailable(true);
      setMessage('');
    } catch {
      setApiAvailable(false);
      setMessage(
        'Backend data is unavailable. Showing sample student data.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (loggedIn) loadStudents();
  }, [loggedIn, loadStudents]);

  const handleLogin = (user) => {
    setCurrentUser(user);
    setLoggedIn(true);
    setActivePage('overview');
    setMessage('');
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setCurrentUser(null);
    setSelectedStudent(null);
    setSearchText('');
    setDepartmentFilter('All');
    setActivePage('overview');
    setMessage('');
    setMobileMenuOpen(false);
  };

  const handleUpload = async (event) => {
    event.preventDefault();

    if (!csvFile) {
      setMessage('Please select a CSV file first.');
      return;
    }

    if (!csvFile.name.toLowerCase().endsWith('.csv')) {
      setMessage('Please select a valid CSV file.');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('file', csvFile);

      const response = await fetch(`${API_URL}/api/upload-csv`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.detail ?? 'Dataset upload failed.');
      }

      setMessage(result.message ?? 'Dataset uploaded successfully.');
      setCsvFile(null);
      await loadStudents();
    } catch (error) {
      setMessage(error.message || 'Upload failed. Check the backend.');
    } finally {
      setUploading(false);
    }
  };

  if (!loggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  const totalStudents = students.length;
  const highRiskCount = students.filter((s) => getRisk(s) === 'High').length;
  const mediumRiskCount = students.filter((s) => getRisk(s) === 'Medium').length;
  const lowRiskCount = students.filter((s) => getRisk(s) === 'Low').length;

  const averageAttendance = totalStudents
    ? Math.round(
        students.reduce((total, student) => total + student.attendance, 0) /
          totalStudents
      )
    : 0;

  const departments = [
    'All',
    ...new Set(students.map((student) => student.department)),
  ];

  const filteredStudents = students.filter((student) => {
    const query = searchText.toLowerCase();

    const matchesSearch =
      String(student.name).toLowerCase().includes(query) ||
      String(student.id).toLowerCase().includes(query);

    const matchesDepartment =
      departmentFilter === 'All' ||
      student.department === departmentFilter;

    return matchesSearch && matchesDepartment;
  });

  const riskData = [
    { name: 'Low Risk', value: lowRiskCount },
    { name: 'Medium Risk', value: mediumRiskCount },
    { name: 'High Risk', value: highRiskCount },
  ];

  const departmentData = departments
    .filter((department) => department !== 'All')
    .map((department) => ({
      department,
      students: students.filter((s) => s.department === department).length,
    }));

  const riskColors = ['#16a34a', '#f59e0b', '#dc2626'];

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenuOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-icon"><GraduationCap size={25} /></div>
          <div>
            <h2>EduPulse AI</h2>
            <span>Academic Intelligence</span>
          </div>
          <button
            type="button"
            className="mobile-close"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        <p className="nav-heading">WORKSPACE</p>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                type="button"
                key={item.id}
                className={`nav-item ${activePage === item.id ? 'nav-active' : ''}`}
                onClick={() => {
                  setActivePage(item.id);
                  setSelectedStudent(null);
                  setMobileMenuOpen(false);
                  setMessage('');
                }}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="connection-status">
            <span className={`connection-dot ${apiAvailable ? 'connected' : ''}`} />
            <div>
              <strong>{apiAvailable ? 'Backend connected' : 'Demo mode'}</strong>
              <small>
                {apiAvailable ? 'API connection active' : 'Sample data displayed'}
              </small>
            </div>
          </div>

          <button type="button" className="logout-button" onClick={handleLogout}>
            <LogOut size={18} /><span>Logout</span>
          </button>
        </div>
      </aside>

      {mobileMenuOpen && (
        <button
          type="button"
          className="mobile-overlay"
          aria-label="Close navigation"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="menu-button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={23} />
            </button>
            <div>
              <p className="breadcrumb">EduPulse AI / Workspace</p>
              <h1>{navItems.find((item) => item.id === activePage)?.label ?? 'Overview'}</h1>
            </div>
          </div>

          <div className="profile-area">
            <div className="profile-avatar">
              {(currentUser?.name?.[0] ?? 'U').toUpperCase()}
            </div>
            <div className="profile-details">
              <strong>{currentUser?.name ?? 'User'}</strong>
              <span>
                {currentUser?.role === 'faculty' ? 'Faculty' : 'Student'}
                {currentUser?.department ? ` · ${currentUser.department}` : ''}
              </span>
            </div>
          </div>
        </header>

        <div className="page-content">
          {message && (
            <div className="notice-message">
              <span>{message}</span>
              <button
                type="button"
                onClick={() => setMessage('')}
                aria-label="Dismiss message"
              >
                <X size={17} />
              </button>
            </div>
          )}

          {activePage === 'overview' && (
            <>
              <section className="welcome-section">
                <div>
                  <p className="eyebrow">ACADEMIC OVERVIEW</p>
                  <h2>Welcome, {currentUser?.name ?? 'User'}!</h2>
                  <p>Monitor student performance and explore academic risk indicators in one place.</p>
                </div>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={loadStudents}
                  disabled={loading}
                >
                  <RefreshCw size={17} className={loading ? 'spin' : ''} />
                  Refresh data
                </button>
              </section>

              <section className="stats-grid">
                <StatCard title="Total Students" value={totalStudents} subtitle="Students in current dataset" icon={Users} />
                <StatCard title="Low Risk" value={lowRiskCount} subtitle="Lower risk indicators" icon={CheckCircle} />
                <StatCard title="Medium Risk" value={mediumRiskCount} subtitle="May need attention" icon={Activity} />
                <StatCard title="High Risk" value={highRiskCount} subtitle="Review these cases" icon={AlertTriangle} />
              </section>

              <section className="stats-grid secondary-stats">
                <StatCard title="Average Attendance" value={`${averageAttendance}%`} subtitle="Across current dataset" icon={BookOpen} />
                <StatCard title="Departments" value={departmentData.length} subtitle="Represented in dataset" icon={ShieldCheck} />
              </section>

              <section className="charts-grid">
                <div className="panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Student Risk Distribution</h3>
                      <p>Based on the current student data</p>
                    </div>
                    <Brain size={21} />
                  </div>
                  <div className="chart-container">
                    {totalStudents > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={riskData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={62} outerRadius={95} paddingAngle={4}>
                            {riskData.map((entry, index) => (
                              <Cell key={entry.name} fill={riskColors[index]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : <p className="empty-state">No student data available.</p>}
                  </div>
                  <div className="chart-legend">
                    {riskData.map((item, index) => (
                      <div key={item.name}>
                        <span className="legend-dot" style={{ background: riskColors[index] }} />
                        <span>{item.name}</span>
                        <strong>{item.value}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Department Overview</h3>
                      <p>Students in each department</p>
                    </div>
                    <BarChart3 size={21} />
                  </div>
                  <div className="chart-container">
                    {departmentData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={departmentData} margin={{ top: 10, right: 8, left: -18, bottom: 8 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="department" fontSize={11} />
                          <YAxis allowDecimals={false} fontSize={12} />
                          <Tooltip />
                          <Bar dataKey="students" fill="#3978e5" radius={[5, 5, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <p className="empty-state">No department data available.</p>}
                  </div>
                </div>
              </section>

              <section className="panel recent-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Recent Student Records</h3>
                    <p>Quick view of student performance</p>
                  </div>
                  <button type="button" className="text-button" onClick={() => setActivePage('students')}>View all</button>
                </div>
                <StudentTable students={students.slice(0, 5)} onSelect={setSelectedStudent} />
              </section>
            </>
          )}

          {activePage === 'students' && (
            <section className="panel">
              <div className="panel-heading students-heading">
                <div>
                  <h3>Students Directory</h3>
                  <p>Search and review student records</p>
                </div>
                <button type="button" className="secondary-button" onClick={loadStudents} disabled={loading}>
                  <RefreshCw size={16} /> Refresh
                </button>
              </div>

              <div className="filters-row">
                <div className="search-box">
                  <Search size={18} />
                  <input type="search" placeholder="Search by name or ID..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
                </div>
                <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} aria-label="Filter by department">
                  {departments.map((department) => (
                    <option key={department} value={department}>
                      {department === 'All' ? 'All departments' : department}
                    </option>
                  ))}
                </select>
              </div>

              <StudentTable students={filteredStudents} onSelect={setSelectedStudent} />
              <p className="table-footer">Showing {filteredStudents.length} of {totalStudents} students</p>

              {selectedStudent && (
                <div className="student-detail">
                  <div className="panel-heading">
                    <div><h3>Student Profile</h3><p>Selected student details</p></div>
                    <button type="button" className="icon-button" onClick={() => setSelectedStudent(null)} aria-label="Close student details"><X size={18} /></button>
                  </div>
                  <div className="detail-grid">
                    <p><span>Name</span><strong>{selectedStudent.name}</strong></p>
                    <p><span>Student ID</span><strong>{selectedStudent.id}</strong></p>
                    <p><span>Department</span><strong>{selectedStudent.department}</strong></p>
                    <p><span>Attendance</span><strong>{selectedStudent.attendance}%</strong></p>
                    <p><span>Marks</span><strong>{selectedStudent.marks}</strong></p>
                    <p><span>Risk indicator</span><RiskBadge risk={getRisk(selectedStudent)} /></p>
                  </div>
                </div>
              )}
            </section>
          )}

          {activePage === 'risk' && (
            <>
              <section className="welcome-section">
                <div>
                  <p className="eyebrow">AI RISK LAB</p>
                  <h2>Student Risk Analysis</h2>
                  <p>Review attendance and marks to identify records that may need additional academic support.</p>
                </div>
              </section>

              <section className="stats-grid">
                <StatCard title="High Risk" value={highRiskCount} subtitle="Attendance below 50% or marks below 40" icon={AlertTriangle} />
                <StatCard title="Medium Risk" value={mediumRiskCount} subtitle="Intermediate risk indicators" icon={Activity} />
                <StatCard title="Low Risk" value={lowRiskCount} subtitle="Fewer risk indicators" icon={CheckCircle} />
              </section>

              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h3>Students Requiring Review</h3>
                    <p>These are rule-based demo indicators, not definitive predictions about a student's future.</p>
                  </div>
                  <Brain size={22} />
                </div>
                <StudentTable
                  students={students.filter((s) => getRisk(s) !== 'Low').sort((a, b) => {
                    const order = { High: 0, Medium: 1, Low: 2 };
                    return order[getRisk(a)] - order[getRisk(b)];
                  })}
                  onSelect={setSelectedStudent}
                />
                {selectedStudent && (
                  <div className="student-detail">
                    <h3>{selectedStudent.name}</h3>
                    <p>Department: {selectedStudent.department}</p>
                    <p>Attendance: {selectedStudent.attendance}%</p>
                    <p>Marks: {selectedStudent.marks}</p>
                    <p>Risk indicator: <RiskBadge risk={getRisk(selectedStudent)} /></p>
                    <button type="button" className="secondary-button" onClick={() => setSelectedStudent(null)}>Close details</button>
                  </div>
                )}
              </section>
            </>
          )}

          {activePage === 'upload' && (
            <section className="panel upload-panel">
              <div className="panel-heading">
                <div><h3>Upload Student Dataset</h3><p>Import a CSV file containing student records.</p></div>
                <FileSpreadsheet size={25} />
              </div>

              <form onSubmit={handleUpload}>
                <label className="upload-dropzone">
                  <Upload size={35} />
                  <strong>{csvFile ? csvFile.name : 'Choose a CSV file'}</strong>
                  <span>Select a .csv file from your computer</span>
                  <input type="file" accept=".csv,text/csv" onChange={(e) => {
                    setCsvFile(e.target.files?.[0] ?? null);
                    setMessage('');
                  }} />
                </label>

                <div className="upload-actions">
                  <button type="submit" className="primary-button" disabled={uploading || !csvFile}>
                    <Upload size={17} /> {uploading ? 'Uploading...' : 'Upload dataset'}
                  </button>
                  <button type="button" className="secondary-button" onClick={() => {
                    setCsvFile(null);
                    setMessage('');
                  }}>Clear</button>
                </div>
              </form>

              <div className="info-box">
                <h4>Before uploading</h4>
                <p>Check that your CSV column names match the format expected by your backend. The backend must support file uploads and process the data before it appears in the dashboard.</p>
              </div>
            </section>
          )}

          <footer className="app-footer">
            <span>EduPulse AI</span>
            <span>Academic Analytics Prototype</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
