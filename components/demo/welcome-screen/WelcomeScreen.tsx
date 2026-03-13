/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import './WelcomeScreen.css';

const WelcomeScreen: React.FC = () => {
  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <div className="title-container">
          <span className="welcome-icon">translate</span>
          <h1>DualTranslate</h1>
        </div>
        <p>Real-time, bi-directional speech translation bridge.</p>
        <div className="example-prompts">
          <div className="prompt">"Hello, how can I help you today?"</div>
          <div className="prompt">"Je voudrais acheter des médicaments pour le rhume."</div>
          <div className="prompt">"I need to pick up my prescription."</div>
        </div>
        <p className="start-hint">Press the "Talk" button below to start translating.</p>
      </div>
    </div>
  );
};

export default WelcomeScreen;
