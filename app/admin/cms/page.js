'use client';

import { useState, useEffect } from 'react';
import { Tabs } from 'antd';

import ContentHierarchyFlow from './ContentHierarchyFlow';
import FormatHierarchyFlow from './FormatHierarchyFlow';
import FilterData from './FilterData';
import UploadVolumeData from './UploadVolumeData';
import ManageQuestions from './ManageQuestions';
import VehicleSalesScoreApp from './VehicleSalesScoreApp';
import YearDropdownSettings from './YearDropdownSettings';
import CreateGraph from './CreateGraph';
import GraphList from './GraphList';
import SubmittedScores from './SubmittedScores';
import PreviewPage from './PreviewPage';
import UserOverallScores from './UserOverallScores';

export default function CMSPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Check if already logged in
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('admin-auth') === 'true';
    setIsAuthenticated(isLoggedIn);
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'admin' && password === 'raceauto123') {
      localStorage.setItem('admin-auth', 'true');
      setIsAuthenticated(true);
    } else {
      setError('Invalid credentials');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin-auth');
    setIsAuthenticated(false);
  };

  const historicalItems = [
    { key: '1', label: 'Content Hierarchy', children: <ContentHierarchyFlow /> },
    { key: '2', label: 'Format Hierarchy', children: <FormatHierarchyFlow /> },
    { key: '3', label: 'Filter Data', children: <FilterData /> },
    { key: '4', label: 'Upload Volume Data', children: <UploadVolumeData /> },
  ];

  const scoreSubtabs = [
    { key: 'manage', label: 'Manage Questions', children: <ManageQuestions /> },
    { key: 'settings', label: 'Year & Dropdown Settings', children: <YearDropdownSettings /> },
    { key: 'view', label: 'Submitted Scores', children: <SubmittedScores /> },
    { key: 'userScores', label: 'User & Overall Scores', children: <UserOverallScores /> },
  ];

  const forecastSubtabs = [
    { key: 'create', label: 'Create Graph', children: <CreateGraph /> },
    { key: 'list', label: 'All Graphs', children: <GraphList /> },
  ];

  const tabItems = [
    {
      key: 'historical',
      label: 'Historical Data',
      children: <Tabs defaultActiveKey="1" items={historicalItems} />,
    },
    {
      key: 'score',
      label: 'Score Analysis',
      children: <Tabs defaultActiveKey="settings" items={scoreSubtabs} />,
    },
    {
      key: 'forecast',
      label: 'Forecast',
      children: <Tabs defaultActiveKey="create" items={forecastSubtabs} />,
    },
  ];

  if (!isAuthenticated) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <form onSubmit={handleLogin} className="card p-4 shadow-sm" style={{ width: 300 }}>
          <h5 className="text-center mb-3">CMS Login</h5>
          {error && <p className="text-danger text-center small">{error}</p>}
          <input
            type="text"
            className="form-control mb-3"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            className="form-control mb-3"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary w-100">Login</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Forecast Application CMS</h1>
        <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>
          Logout
        </button>
      </div>
      <Tabs defaultActiveKey="historical" items={tabItems} />
    </div>
  );
}
