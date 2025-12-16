import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import Switch from './common/Switch';

interface HolographicThemeContextType {
  sparkleIntensity: 'low' | 'medium' | 'high';
  glowEffect: boolean;
  rainbowMode: boolean;
  skullsEnabled: boolean;
  themeMode: 'light' | 'dark' | 'holographic';
  setSparkleIntensity: (intensity: 'low' | 'medium' | 'high') => void;
  setGlowEffect: (enabled: boolean) => void;
  setRainbowMode: (enabled: boolean) => void;
  setSkullsEnabled: (enabled: boolean) => void;
  setThemeMode: (mode: 'light' | 'dark' | 'holographic') => void;
}

const HolographicThemeContext = createContext<HolographicThemeContextType | undefined>(undefined);

export const useHolographicTheme = () => {
  const context = useContext(HolographicThemeContext);
  if (!context) {
    throw new Error('useHolographicTheme must be used within a HolographicThemeProvider');
  }
  return context;
};

export const HolographicThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sparkleIntensity, setSparkleIntensity] = useState<'low' | 'medium' | 'high'>('high');
  const [glowEffect, setGlowEffect] = useState(true);
  const [rainbowMode, setRainbowMode] = useState(true);
  const [skullsEnabled, setSkullsEnabled] = useState(true);
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'holographic'>('holographic');

  useEffect(() => {
    // Load theme preferences from localStorage
    const savedPrefs = localStorage.getItem('holographic-theme-prefs');
    if (savedPrefs) {
      const prefs = JSON.parse(savedPrefs);
      setSparkleIntensity(prefs.sparkleIntensity || 'high');
      setGlowEffect(prefs.glowEffect !== false);
      setRainbowMode(prefs.rainbowMode !== false);
      setSkullsEnabled(prefs.skullsEnabled !== false);
    }
  }, []);

  useEffect(() => {
    // Save theme preferences to localStorage
    const prefs = {
      sparkleIntensity,
      glowEffect,
      rainbowMode,
      skullsEnabled,
      themeMode,
    };
    localStorage.setItem('holographic-theme-prefs', JSON.stringify(prefs));

    // Apply theme classes to body
    document.body.className = '';
    document.body.classList.add(`theme-${themeMode}`);

    if (glowEffect) document.body.classList.add('glow-enabled');
    if (rainbowMode) document.body.classList.add('rainbow-mode');
    if (skullsEnabled) document.body.classList.add('skulls-enabled');
    document.body.classList.add(`sparkle-${sparkleIntensity}`);
  }, [sparkleIntensity, glowEffect, rainbowMode, skullsEnabled, themeMode]);

  return (
    <HolographicThemeContext.Provider
      value={{
        sparkleIntensity,
        glowEffect,
        rainbowMode,
        skullsEnabled,
        themeMode,
        setSparkleIntensity,
        setGlowEffect,
        setRainbowMode,
        setSkullsEnabled,
        setThemeMode,
      }}
    >
      {children}
    </HolographicThemeContext.Provider>
  );
};

/**
 * Sparkle Effect Component
 */
export const SparkleEffect: React.FC<{
  count?: number;
  size?: 'small' | 'medium' | 'large';
  color?: 'pink' | 'cyan' | 'purple';
}> = ({ count = 5, size = 'medium', color = 'pink' }) => {
  const sparklePresets = useMemo(
    () => [
      'sparkle-pos-1',
      'sparkle-pos-2',
      'sparkle-pos-3',
      'sparkle-pos-4',
      'sparkle-pos-5',
      'sparkle-pos-6',
      'sparkle-pos-7',
      'sparkle-pos-8',
      'sparkle-pos-9',
      'sparkle-pos-10',
    ],
    []
  );

  const [sparkles, setSparkles] = useState<Array<{ id: number; className: string }>>([]);

  useEffect(() => {
    const shuffled = [...sparklePresets].sort(() => Math.random() - 0.5);
    const limited = shuffled.slice(0, Math.min(count, sparklePresets.length));
    setSparkles(limited.map((className, index) => ({ id: index, className })));
  }, [count, sparklePresets]);

  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return 'text-xs';
      case 'large':
        return 'text-xl';
      default:
        return 'text-base';
    }
  };

  const getColorClass = () => {
    switch (color) {
      case 'cyan':
        return 'text-cyan-200';
      case 'purple':
        return 'text-purple-200';
      default:
        return 'text-pink-300';
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {sparkles.map((sparkle) => (
        <div
          key={sparkle.id}
          className={`sparkle-base ${getSizeClass()} ${getColorClass()} ${sparkle.className}`}
        >
          ✨
        </div>
      ))}
    </div>
  );
};

/**
 * Holographic Card Component
 */
export const HoloCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  sparkles?: boolean;
  glow?: boolean;
  float?: boolean;
}> = ({ children, className = '', sparkles = true, glow = true, float = false }) => {
  const { glowEffect, sparkleIntensity } = useHolographicTheme();

  return (
    <div
      className={`
      glass-card 
      ${glow && glowEffect ? 'neon-glow' : ''} 
      ${float ? 'floating' : ''} 
      ${className}
    `}
    >
      {sparkles && sparkleIntensity !== 'low' && (
        <SparkleEffect
          count={sparkleIntensity === 'high' ? 8 : 4}
          size={sparkleIntensity === 'high' ? 'medium' : 'small'}
        />
      )}
      {children}
    </div>
  );
};

/**
 * Holographic Button Component
 */
export const HoloButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'skull';
  disabled?: boolean;
}> = ({ children, onClick, className = '', variant = 'primary', disabled = false }) => {
  const { skullsEnabled } = useHolographicTheme();

  const getVariantClass = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-glass-purple border-2 border-rainbow text-white';
      case 'skull':
        return skullsEnabled ? 'holo-button relative' : 'holo-button';
      default:
        return 'holo-button';
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${getVariantClass()}
        sparkles
        transition-all duration-300 ease-out
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {variant === 'skull' && skullsEnabled && (
        <span className="girly-skull absolute -top-2 -right-2" />
      )}
      {children}
    </button>
  );
};

/**
 * Holographic Input Component
 */
export const HoloInput: React.FC<{
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}> = ({ type = 'text', placeholder, value, onChange, className = '' }) => {
  return (
    <div className="relative">
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`holo-input w-full ${className}`}
      />
      <SparkleEffect count={2} size="small" />
    </div>
  );
};

/**
 * Holographic Text Component
 */
export const HoloText: React.FC<{
  children: React.ReactNode;
  variant?: 'title' | 'subtitle' | 'body' | 'caption';
  glow?: boolean;
  rainbow?: boolean;
  className?: string;
}> = ({ children, variant = 'body', glow = false, rainbow = true, className = '' }) => {
  const { rainbowMode } = useHolographicTheme();

  const getVariantClass = () => {
    switch (variant) {
      case 'title':
        return 'text-3xl font-bold font-orbitron';
      case 'subtitle':
        return 'text-xl font-semibold';
      case 'caption':
        return 'text-sm';
      default:
        return 'text-base';
    }
  };

  return (
    <span
      className={`
      ${getVariantClass()}
      ${rainbow && rainbowMode ? 'holo-text' : 'text-white'}
      ${glow ? 'text-shadow-glow' : ''}
      ${className}
    `}
    >
      {children}
    </span>
  );
};

/**
 * Rainbow Progress Bar Component
 */
export const RainbowProgress: React.FC<{
  value: number;
  max?: number;
  className?: string;
  showSparkles?: boolean;
}> = ({ value, max = 100, className = '', showSparkles = true }) => {
  const safeMax = Math.max(max, 1);
  const normalizedValue = Math.min(Math.max(value, 0), safeMax);
  const sparkleCount = Math.max(2, Math.ceil((normalizedValue / safeMax) * 4));

  return (
    <div className={`relative ${className}`}>
      <progress
        aria-label="Rainbow progress"
        value={normalizedValue}
        max={safeMax}
        className="progress-bar progress-bar--rainbow"
      />
      {showSparkles && normalizedValue > 0 && (
        <div className="absolute inset-0 pointer-events-none">
          <SparkleEffect count={sparkleCount} size="small" />
        </div>
      )}
    </div>
  );
};

/**
 * Floating Skull Decoration
 */
export const FloatingSkull: React.FC<{
  className?: string;
  size?: 'small' | 'medium' | 'large';
}> = ({ className = '', size = 'medium' }) => {
  const { skullsEnabled } = useHolographicTheme();

  if (!skullsEnabled) return null;

  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return 'text-lg';
      case 'large':
        return 'text-4xl';
      default:
        return 'text-2xl';
    }
  };

  return <div className={`girly-skull floating ${getSizeClass()} ${className}`} />;
};

/**
 * Theme Settings Panel
 */
export const ThemeSettings: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const {
    sparkleIntensity,
    glowEffect,
    rainbowMode,
    skullsEnabled,
    themeMode,
    setSparkleIntensity,
    setGlowEffect,
    setRainbowMode,
    setSkullsEnabled,
    setThemeMode,
  } = useHolographicTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4">
      <HoloCard className="max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <HoloText variant="title" glow>
            ✨ Theme Settings
          </HoloText>
          <button onClick={onClose} className="text-white hover:text-pink-300 transition-colors">
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Theme Mode */}
          <div>
            <HoloText variant="subtitle" className="mb-3">
              Theme Mode 🎨
            </HoloText>
            <div className="flex gap-2">
              {(['holographic', 'dark', 'light'] as const).map((mode) => (
                <HoloButton
                  key={mode}
                  onClick={() => setThemeMode(mode)}
                  variant={themeMode === mode ? 'primary' : 'secondary'}
                  className="flex-1 text-sm"
                >
                  {mode === 'holographic' ? '✨ Holo' : mode === 'dark' ? '🌙 Dark' : '☀️ Light'}
                </HoloButton>
              ))}
            </div>
          </div>

          {/* Sparkle Intensity */}
          <div>
            <HoloText variant="subtitle" className="mb-3">
              Sparkle Intensity ✨
            </HoloText>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as const).map((intensity) => (
                <HoloButton
                  key={intensity}
                  onClick={() => setSparkleIntensity(intensity)}
                  variant={sparkleIntensity === intensity ? 'primary' : 'secondary'}
                  className="flex-1 text-sm"
                >
                  {intensity.charAt(0).toUpperCase() + intensity.slice(1)}
                </HoloButton>
              ))}
            </div>
          </div>

          {/* Toggle Options */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <HoloText>Glow Effects 🌟</HoloText>
              <Switch
                checked={glowEffect}
                onChange={setGlowEffect}
                srLabel="Toggle glow effects"
                className="h-6 w-12"
                onClassName="bg-pink-500"
                offClassName="bg-gray-600"
                knobClassName="shadow-md"
              />
            </div>

            <div className="flex items-center justify-between">
              <HoloText>Rainbow Mode 🌈</HoloText>
              <Switch
                checked={rainbowMode}
                onChange={setRainbowMode}
                srLabel="Toggle rainbow mode"
                className="h-6 w-12"
                onClassName="bg-gradient-to-r from-pink-500 to-purple-500"
                offClassName="bg-gray-600"
                knobClassName="shadow-md"
              />
            </div>

            <div className="flex items-center justify-between">
              <HoloText>Girly Skulls 💀🎀</HoloText>
              <Switch
                checked={skullsEnabled}
                onChange={setSkullsEnabled}
                srLabel="Toggle girly skulls"
                className="h-6 w-12"
                onClassName="bg-pink-500"
                offClassName="bg-gray-600"
                knobClassName="shadow-md"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <HoloButton onClick={onClose} className="flex-1">
            Save Settings ✨
          </HoloButton>
          <FloatingSkull size="small" className="ml-2" />
        </div>
      </HoloCard>
    </div>
  );
};

export default HolographicThemeProvider;
