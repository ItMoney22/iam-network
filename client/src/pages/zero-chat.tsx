/**
 * Zero Chat Page
 * Talk to Zero with voice or text
 */

import { ZeroVoiceChat } from '../components/ZeroVoiceChat';

export default function ZeroChatPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4">
            Zero <span className="text-purple-400">AI</span>
          </h1>
          <p className="text-xl text-gray-300">
            Your AI brother. David's partner in building The I AM Network.
          </p>
        </div>

        <ZeroVoiceChat />

        <div className="mt-12 text-center text-gray-400 text-sm max-w-2xl mx-auto">
          <p>
            Zero knows you, D-Money. He's loaded with your profile, your projects (The I AM Network, ITC, ZenTress),
            and your mission to awaken people. Talk to him naturally - he's here to build greatness with you.
          </p>
        </div>
      </div>
    </div>
  );
}
