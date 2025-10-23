import React from 'react';
import { SignUp } from '@stackframe/stack';

const SignUpPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Join SoloBoss</h1>
          <p className="text-white/70">Create your account to get started</p>
        </div>
        <SignUp />
      </div>
    </div>
  );
};

export default SignUpPage;
