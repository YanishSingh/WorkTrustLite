import React from 'react';
import zxcvbn from 'zxcvbn';

interface Props {
  password: string;
}

const PasswordStrengthMeter: React.FC<Props> = ({ password }) => {
  const testResult = zxcvbn(password);
  const num = testResult.score;
  const getLabel = () => ['Too Weak', 'Weak', 'Fair', 'Good', 'Strong'][num];
  const getColor = () => ['bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-500'][num];

  return (
    <div className="mt-1">
      <div className={`h-2 rounded ${getColor()}`} style={{ width: `${(num + 1) * 20}%` }} />
      <p className="text-xs mt-1">{getLabel()}</p>
    </div>
  );
};

export default PasswordStrengthMeter;
