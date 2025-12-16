import React from 'react';

export interface SwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string; // visible label next to the switch
  srLabel?: string; // accessible label if no visible label present
  disabled?: boolean;
  className?: string; // additional classes for the button
  onClassName?: string; // classes when checked
  offClassName?: string; // classes when unchecked
  knobClassName?: string; // classes applied to the knob
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  srLabel,
  disabled,
  className = '',
  onClassName,
  offClassName,
  knobClassName,
}) => {
  const labelId = React.useId();

  return (
    <div className="flex items-center space-x-2">
      {label ? (
        <span id={labelId} className="text-sm text-gray-600">
          {label}
        </span>
      ) : null}

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={label ? labelId : undefined}
        aria-label={!label ? srLabel : undefined}
        disabled={disabled}
        onClick={() => {
          if (!disabled) onChange(!checked);
        }}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? (onClassName ?? 'bg-blue-600') : (offClassName ?? 'bg-gray-200')
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          } ${knobClassName ?? ''}`}
        />
      </button>
    </div>
  );
};

export default Switch;
