import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/Sidebar.js';
import { Header } from './components/Header.js';
import { Dashboard } from './pages/Dashboard.js';
import { Assistant } from './pages/Assistant.js';
import { KnowledgeBase } from './pages/KnowledgeBase.js';
import { Tasks } from './pages/Tasks.js';
import { Planner } from './pages/Planner.js';
import { Quizzes } from './pages/Quizzes.js';
import { ActivityHistory } from './pages/ActivityHistory.js';
import { Settings } from './pages/Settings.js';
import { api } from './services/api.js';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [collapsed, setCollapsed] = useState(false);
  const [metrics, setMetrics] = useState<{
    tasks?: number;
    documents?: number;
    quizzes?: number;
  }>({});
  const [triggeredPrompt, setTriggeredPrompt] = useState<string | undefined>(undefined);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 12000);
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    try {
      const status = await api.getStatus();
      if (status && status.metrics) {
        setMetrics({
          tasks: status.metrics.tasks,
          documents: status.metrics.documents,
          quizzes: status.metrics.quizzes
        });
      }
    } catch (err) {
      // Backend warming up
    }
  };

  const handleSendPrompt = (promptText: string) => {
    setTriggeredPrompt(promptText);
    setActiveTab('assistant');
  };

  return (
    <div className="app-container">
      {/* Collapsible Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setTriggeredPrompt(undefined);
          setActiveTab(tab);
        }}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        metrics={metrics}
      />

      {/* Main Workspace Area */}
      <div className="main-content">
        <Header
          activeTab={activeTab}
          onOpenSettings={() => setActiveTab('settings')}
        />

        {activeTab === 'home' && (
          <Dashboard
            setActiveTab={setActiveTab}
            onSendPrompt={handleSendPrompt}
          />
        )}

        {activeTab === 'assistant' && (
          <Assistant
            setActiveTab={setActiveTab}
            initialPrompt={triggeredPrompt}
          />
        )}

        {activeTab === 'knowledge' && <KnowledgeBase />}

        {activeTab === 'tasks' && <Tasks />}

        {activeTab === 'planner' && <Planner />}

        {activeTab === 'quizzes' && <Quizzes />}

        {activeTab === 'history' && <ActivityHistory />}

        {activeTab === 'settings' && <Settings />}
      </div>
    </div>
  );
}

export default App;
