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
import { InterviewPrep } from './pages/InterviewPrep.js';
import { api } from './services/api.js';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('assistant');
  const [showHero, setShowHero] = useState<boolean>(true);
  const [hasChatMessages, setHasChatMessages] = useState<boolean>(false);
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
    setShowHero(false);
    setActiveTab('assistant');
  };

  const handleTabChange = (tab: NavTab) => {
    setTriggeredPrompt(undefined);
    if (tab === 'assistant') {
      setShowHero(true);
    }
    setActiveTab(tab);
  };

  return (
    <div className="app-viewport">
      <div className="app-window">
        <div className="app-container">
          {/* Circular Orb Dock (Image 2) */}
          <Sidebar
            activeTab={activeTab}
            setActiveTab={handleTabChange}
            metrics={metrics}
            onResetHero={() => setShowHero(true)}
          />

          {/* Main Content Viewport */}
          <div className="main-content">
            <Header
              activeTab={activeTab}
              onOpenSettings={() => setActiveTab('settings')}
              showHero={showHero}
              onToggleHero={() => setShowHero(!showHero)}
              hasChatMessages={hasChatMessages}
            />

            <div className="main-scroll-area">
              {activeTab === 'assistant' && (
                <Assistant
                  setActiveTab={setActiveTab}
                  initialPrompt={triggeredPrompt}
                  showHero={showHero}
                  setShowHero={setShowHero}
                  onHasMessagesChange={setHasChatMessages}
                />
              )}

              {activeTab === 'home' && (
                <Dashboard
                  setActiveTab={setActiveTab}
                  onSendPrompt={handleSendPrompt}
                />
              )}

              {activeTab === 'interview' && <InterviewPrep />}

              {activeTab === 'knowledge' && <KnowledgeBase />}

              {activeTab === 'tasks' && <Tasks />}

              {activeTab === 'planner' && <Planner />}

              {activeTab === 'quizzes' && <Quizzes />}

              {activeTab === 'history' && <ActivityHistory />}

              {activeTab === 'settings' && <Settings />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
