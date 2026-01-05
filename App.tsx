import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Language, GameSettings, EntityType, AnimationState } from './types';
import { TRANSLATIONS, STORY_BEATS, EVIDENCE_TASKS } from './constants';
import PixelCharacter from './components/PixelCharacter';
import PixelTree from './components/PixelTree';
import { Settings as SettingsIcon, Play, Info, ArrowLeft, Volume2, Navigation2, CheckSquare, Square, Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Zap, Pause } from 'lucide-react';
import { getEerieReflection } from './services/geminiService';

type JumpscareType = 'STIEHLT' | 'HINTERDIR' | 'HILFE' | 'AUGEN' | 'FINAL' | 'GESICHT';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [isMobile, setIsMobile] = useState(false);
  const [settings, setSettings] = useState<GameSettings>({
    language: Language.DE,
    volume: 50,
    graphicsQuality: 'HIGH',
    keybinds: { up: 'w', down: 's', left: 'a', right: 'd', interact: 'e', run: 'shift', pause: 'p' }
  });
  
  const [flash, setFlash] = useState(false);
  const [shake, setShake] = useState(false);
  const [extremeShake, setExtremeShake] = useState(false);
  const [jumpscare, setJumpscare] = useState<{ active: boolean; type: JumpscareType }>({ active: false, type: 'STIEHLT' });
  const [storyIndex, setStoryIndex] = useState(0);
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });
  const [sonPos, setSonPos] = useState({ x: 2500, y: 1000 });
  const [direction, setDirection] = useState<'up' | 'down' | 'left' | 'right'>('down');
  const [animState, setAnimState] = useState<AnimationState>(AnimationState.IDLE);
  const [frame, setFrame] = useState(0);
  const [eerieLine, setEerieLine] = useState('');
  const [foundEvidence, setFoundEvidence] = useState<Set<string>>(new Set());
  const [activePickupAnim, setActivePickupAnim] = useState<string | null>(null);
  const [isFalling, setIsFalling] = useState(false);
  
  const t = TRANSLATIONS[settings.language] || TRANSLATIONS[Language.DE];
  const keysPressed = useRef<Set<string>>(new Set());
  const lastJumpscareTime = useRef<number>(0);

  // Audio Context Ref
  const audioCtx = useRef<AudioContext | null>(null);
  const melodyOscs = useRef<OscillatorNode[]>([]);
  const bassOscs = useRef<OscillatorNode[]>([]);
  const mainGain = useRef<GainNode | null>(null);
  const musicInterval = useRef<number | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const initAudio = () => {
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.current.state === 'suspended') {
      audioCtx.current.resume();
    }
  };

  const resetGame = () => {
    setStoryIndex(0);
    setPlayerPos({ x: 0, y: 0 });
    setSonPos({ x: 2500, y: 1000 });
    setGameState(GameState.MENU);
    setFoundEvidence(new Set());
    setActivePickupAnim(null);
    setIsFalling(false);
    setExtremeShake(false);
    keysPressed.current.clear();
  };

  const playFlashSound = () => {
    initAudio();
    const ctx = audioCtx.current!;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(40, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.3);
    g.gain.setValueAtTime((settings.volume / 100) * 0.4, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  };

  const playLaughter = () => {
    initAudio();
    const ctx = audioCtx.current!;
    const g = ctx.createGain();
    g.gain.setValueAtTime((settings.volume / 100) * 0.5, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2);
    g.connect(ctx.destination);

    for (let i = 0; i < 6; i++) {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        const startTime = ctx.currentTime + (i * 0.2);
        osc.frequency.setValueAtTime(350 + (Math.random() * 200), startTime);
        osc.frequency.exponentialRampToValueAtTime(750, startTime + 0.1);
        osc.frequency.exponentialRampToValueAtTime(250, startTime + 0.2);
        osc.connect(g);
        osc.start(startTime);
        osc.stop(startTime + 0.2);
    }
  };

  const playBabyCryJumpscare = () => {
    initAudio();
    const ctx = audioCtx.current!;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime((settings.volume / 100) * 2.5, ctx.currentTime);
    masterGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 4.0);
    masterGain.connect(ctx.destination);

    const frequencies = [1600, 1625, 1700, 1850, 40, 80];
    frequencies.forEach((baseFreq, index) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = index < 4 ? 'sawtooth' : 'square';
        osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
        if (index < 4) {
            osc.frequency.exponentialRampToValueAtTime(baseFreq * 2.5, ctx.currentTime + 0.05);
            osc.frequency.linearRampToValueAtTime(baseFreq * 0.5, ctx.currentTime + 1.2);
        } else {
            osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.5);
        }
        g.gain.setValueAtTime(0.6, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (index < 4 ? 3.5 : 1.5));
        const distortion = ctx.createWaveShaper();
        distortion.curve = new Float32Array([ -1, 0, 1 ]);
        osc.connect(g);
        g.connect(distortion);
        distortion.connect(masterGain);
        osc.start();
        osc.stop(ctx.currentTime + 4.0);
    });

    const noise = ctx.createBufferSource();
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < ctx.sampleRate * 2; i++) data[i] = (Math.random() * 2 - 1);
    noise.buffer = noiseBuffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.8, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    noise.connect(noiseGain);
    noiseGain.connect(masterGain);
    noise.start();
  };

  const startMenuMusic = () => {
    initAudio();
    if (musicInterval.current) return;
    const ctx = audioCtx.current!;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime((settings.volume / 100) * 0.4, ctx.currentTime + 2);
    g.connect(ctx.destination);
    mainGain.current = g;

    const createBass = (freq: number) => {
      const osc = ctx.createOscillator();
      const bg = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      bg.gain.setValueAtTime(0, ctx.currentTime);
      bg.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 4);
      osc.connect(bg);
      bg.connect(g);
      osc.start();
      bassOscs.current.push(osc);
    };
    createBass(41.20);
    createBass(30.87);

    const notes = [130.81, 123.47, 110.00, 98.00, 87.31];
    let noteIdx = 0;
    const playNote = () => {
      if (!mainGain.current || !audioCtx.current) return;
      const ctx = audioCtx.current;
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(notes[noteIdx], ctx.currentTime);
      noteGain.gain.setValueAtTime(0, ctx.currentTime);
      noteGain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.2);
      noteGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);
      osc.connect(noteGain);
      noteGain.connect(mainGain.current);
      osc.start();
      osc.stop(ctx.currentTime + 3);
      melodyOscs.current.push(osc);
      noteIdx = (noteIdx + 1) % notes.length;
    };
    playNote();
    musicInterval.current = window.setInterval(playNote, 3000);
  };

  const stopMenuMusic = () => {
    if (musicInterval.current) { clearInterval(musicInterval.current); musicInterval.current = null; }
    if (mainGain.current && audioCtx.current) {
      const ctx = audioCtx.current;
      mainGain.current.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
      setTimeout(() => {
        melodyOscs.current.forEach(osc => { try { osc.stop(); } catch(e) {} });
        bassOscs.current.forEach(osc => { try { osc.stop(); } catch(e) {} });
        melodyOscs.current = [];
        bassOscs.current = [];
        mainGain.current = null;
      }, 1600);
    }
  };

  const triggerBrutalJumpscare = () => {
    if (jumpscare.active) return;
    initAudio();
    const ctx = audioCtx.current!;
    const osc = ctx.createOscillator();
    const noise = ctx.createBufferSource();
    const gain = ctx.createGain();
    
    const types: JumpscareType[] = ['STIEHLT', 'HINTERDIR', 'HILFE', 'AUGEN', 'GESICHT'];
    const chosenType = types[Math.floor(Math.random() * types.length)];
    
    const bufferSize = ctx.sampleRate * 1.5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.9;
    noise.buffer = buffer;
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.8);
    
    gain.gain.setValueAtTime((settings.volume / 100) * 1.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
    
    osc.connect(gain);
    noise.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    noise.start();
    
    setJumpscare({ active: true, type: chosenType });
    setShake(true);
    lastJumpscareTime.current = Date.now();
    
    setTimeout(() => {
      setJumpscare(prev => ({ ...prev, active: false }));
      setShake(false);
      osc.stop();
      noise.stop();
    }, chosenType === 'GESICHT' ? 400 : 1200);
  };

  useEffect(() => {
    if (gameState === GameState.MENU || gameState === GameState.SETTINGS) startMenuMusic();
    else stopMenuMusic();
    return () => stopMenuMusic();
  }, [gameState, settings.volume]);

  useEffect(() => {
    const interval = setInterval(() => setFrame(f => (f + 1) % 4), 150);
    return () => clearInterval(interval);
  }, []);

  const handleEndSequence = async () => {
    setIsFalling(true);
    playFlashSound();
    setTimeout(() => {
        setIsFalling(false);
        setGameState(GameState.ENDING_SCENE);
    }, 2000);
    setTimeout(() => {
        playLaughter();
    }, 4500);
    setTimeout(() => {
        setJumpscare({ active: true, type: 'FINAL' });
        playBabyCryJumpscare();
        setExtremeShake(true);
    }, 7500);
    setTimeout(() => {
        setJumpscare({ active: false, type: 'STIEHLT' });
        setExtremeShake(false);
        setGameState(GameState.END_CREDITS);
    }, 12000);
  };

  const updateMovement = useCallback(() => {
    if (gameState !== GameState.GAMEPLAY || isFalling || activePickupAnim) return;

    let dx = 0;
    let dy = 0;
    const { up, down, left, right, run } = settings.keybinds;
    const speed = keysPressed.current.has(run) ? 18 : 9;

    if (keysPressed.current.has(up)) dy -= speed;
    if (keysPressed.current.has(down)) dy += speed;
    if (keysPressed.current.has(left)) dx -= speed;
    if (keysPressed.current.has(right)) dx += speed;

    // Random Sanity Jumpscare Logic
    if (storyIndex > 5 && Date.now() - lastJumpscareTime.current > 15000) {
        if (Math.random() > 0.9995) triggerBrutalJumpscare();
    }

    if (dx !== 0 || dy !== 0) {
      setAnimState(speed > 9 ? AnimationState.RUN : AnimationState.WALK);
      if (dx < 0) setDirection('left');
      else if (dx > 0) setDirection('right');
      else if (dy < 0) setDirection('up');
      else if (dy > 0) setDirection('down');
      setPlayerPos(p => ({ x: p.x + dx, y: p.y + dy }));
    } else {
      setAnimState(storyIndex > 10 ? AnimationState.SCARED : AnimationState.IDLE);
    }

    const currentBeat = STORY_BEATS[storyIndex];
    if (currentBeat) {
      const dist = Math.sqrt(Math.pow(playerPos.x - currentBeat.triggerPos.x, 2) + Math.pow(playerPos.y - currentBeat.triggerPos.y, 2));
      if (dist < 120) {
        if (currentBeat.evidenceKey) {
            setFoundEvidence(prev => new Set([...prev, currentBeat.evidenceKey!]));
            setActivePickupAnim(currentBeat.evidenceKey);
            setTimeout(() => setActivePickupAnim(null), 1500);
        }
        setStoryIndex(prev => prev + 1);
        setFlash(true);
        playFlashSound();
        setTimeout(() => setFlash(false), 200);
        
        // HIGHER CHANCE FOR JUMPSCARE (40%)
        if (storyIndex > 2 && Math.random() > 0.6) triggerBrutalJumpscare();
        
        if (storyIndex === STORY_BEATS.length - 1) handleEndSequence();
      }
    }

    if (storyIndex >= 11) {
      const targetX = playerPos.x - 60;
      const targetY = playerPos.y + 20;
      setSonPos(prev => ({
        x: prev.x + (targetX - prev.x) * 0.05,
        y: prev.y + (targetY - prev.y) * 0.05
      }));
    }
  }, [gameState, settings.keybinds, playerPos, storyIndex, isFalling, activePickupAnim, jumpscare.active]);

  useEffect(() => {
    const loop = setInterval(updateMovement, 1000/60);
    return () => clearInterval(loop);
  }, [updateMovement]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === settings.keybinds.pause) {
        if (gameState === GameState.GAMEPLAY) setGameState(GameState.PAUSED);
        else if (gameState === GameState.PAUSED) setGameState(GameState.GAMEPLAY);
      }
      keysPressed.current.add(key);
    };
    const handleKeyUp = (e: KeyboardEvent) => keysPressed.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, settings.keybinds.pause]);

  useEffect(() => {
    if (gameState === GameState.GAMEPLAY && Math.random() > 0.95) {
       getEerieReflection(settings.language).then(setEerieLine);
    }
  }, [storyIndex, gameState]);

  const handleMobileInput = (key: string, pressed: boolean) => {
    if (pressed) {
      if (key === settings.keybinds.pause) {
        if (gameState === GameState.GAMEPLAY) setGameState(GameState.PAUSED);
        else if (gameState === GameState.PAUSED) setGameState(GameState.GAMEPLAY);
        return;
      }
      keysPressed.current.add(key);
    } else {
      keysPressed.current.delete(key);
    }
  };

  const MobileControls = () => {
    if (!isMobile || gameState !== GameState.GAMEPLAY) return null;

    return (
      <div className="fixed inset-0 pointer-events-none z-[100] flex flex-col justify-end p-6 select-none">
        <div className="flex justify-between items-end w-full">
          {/* D-PAD */}
          <div className="grid grid-cols-3 gap-2 pointer-events-auto">
            <div />
            <button 
              onPointerDown={() => handleMobileInput(settings.keybinds.up, true)}
              onPointerUp={() => handleMobileInput(settings.keybinds.up, false)}
              onPointerLeave={() => handleMobileInput(settings.keybinds.up, false)}
              className="w-16 h-16 bg-white/10 backdrop-blur-md border-2 border-white/20 flex items-center justify-center rounded-sm active:bg-white/40 active:scale-95 transition-all"
            >
              <ChevronUp size={32} />
            </button>
            <div />
            <button 
              onPointerDown={() => handleMobileInput(settings.keybinds.left, true)}
              onPointerUp={() => handleMobileInput(settings.keybinds.left, false)}
              onPointerLeave={() => handleMobileInput(settings.keybinds.left, false)}
              className="w-16 h-16 bg-white/10 backdrop-blur-md border-2 border-white/20 flex items-center justify-center rounded-sm active:bg-white/40 active:scale-95 transition-all"
            >
              <ChevronLeft size={32} />
            </button>
            <button 
              onPointerDown={() => handleMobileInput(settings.keybinds.down, true)}
              onPointerUp={() => handleMobileInput(settings.keybinds.down, false)}
              onPointerLeave={() => handleMobileInput(settings.keybinds.down, false)}
              className="w-16 h-16 bg-white/10 backdrop-blur-md border-2 border-white/20 flex items-center justify-center rounded-sm active:bg-white/40 active:scale-95 transition-all"
            >
              <ChevronDown size={32} />
            </button>
            <button 
              onPointerDown={() => handleMobileInput(settings.keybinds.right, true)}
              onPointerUp={() => handleMobileInput(settings.keybinds.right, false)}
              onPointerLeave={() => handleMobileInput(settings.keybinds.right, false)}
              className="w-16 h-16 bg-white/10 backdrop-blur-md border-2 border-white/20 flex items-center justify-center rounded-sm active:bg-white/40 active:scale-95 transition-all"
            >
              <ChevronRight size={32} />
            </button>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex gap-4 items-end pointer-events-auto">
            <button 
               onPointerDown={() => handleMobileInput(settings.keybinds.run, true)}
               onPointerUp={() => handleMobileInput(settings.keybinds.run, false)}
               onPointerLeave={() => handleMobileInput(settings.keybinds.run, false)}
               className="w-20 h-20 bg-yellow-500/20 backdrop-blur-md border-2 border-yellow-500/40 flex flex-col items-center justify-center rounded-full active:bg-yellow-500/60 active:scale-110 transition-all text-yellow-500"
            >
               <Zap size={32} fill="currentColor" />
               <span className="text-[9px] font-black uppercase">RUN</span>
            </button>
            <button 
               onPointerDown={() => handleMobileInput(settings.keybinds.pause, true)}
               className="w-16 h-16 bg-red-500/20 backdrop-blur-md border-2 border-red-500/40 flex flex-col items-center justify-center rounded-full active:bg-red-500/60 active:scale-110 transition-all text-red-500"
            >
               <Pause size={24} fill="currentColor" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const Menu = () => (
    <div className="flex flex-col items-center justify-center min-h-screen w-full space-y-8 bg-neutral-900 relative overflow-hidden" onMouseDown={() => initAudio()} onTouchStart={() => initAudio()}>
      {settings.graphicsQuality === 'HIGH' && (
        <>
          <div className="vhs-noise" />
          <div className="scanline" />
        </>
      )}
      <div className={`z-20 text-center px-4 ${settings.graphicsQuality === 'HIGH' ? 'vhs-jitter' : ''}`}>
        <h1 className="text-3xl md:text-5xl text-red-600 mb-6 tracking-tighter drop-shadow-[0_0_25px_rgba(255,255,255,0.4)] animate-pulse uppercase leading-tight font-black">
          {t.title}
        </h1>
        <p className="text-[14px] text-white tracking-[0.4em] font-black bg-black/50 px-6 py-2 inline-block rounded-sm">CHRONICLE 2008-2010</p>
      </div>
      <div className="flex flex-col space-y-6 w-80 z-30 pointer-events-auto">
        <p className="text-[10px] text-red-500 font-bold text-center animate-bounce uppercase">{t.doubleClick}</p>
        <button onDoubleClick={() => { initAudio(); setGameState(GameState.DISCLAIMER); }} onTouchStart={(e) => { 
          if (e.timeStamp - ((window as any).lastTouchStart || 0) < 300) {
            initAudio(); setGameState(GameState.DISCLAIMER); 
          }
          (window as any).lastTouchStart = e.timeStamp;
        }} className="flex flex-col items-center justify-center gap-1 p-6 bg-white text-black hover:bg-red-700 hover:text-white border-4 border-black transition-all transform hover:scale-105 active:scale-95 shadow-2xl">
          <div className="flex items-center gap-2">
            <Play size={24} fill="currentColor" />
            <span className="text-base font-black tracking-widest uppercase">{t.start}</span>
          </div>
          <span className="text-[9px] opacity-70 font-bold">{isMobile ? "TAP TWICE" : "DOUBLE CLICK"}</span>
        </button>
        <button onDoubleClick={() => setGameState(GameState.SETTINGS)} onTouchStart={(e) => {
          if (e.timeStamp - ((window as any).lastTouchSetStart || 0) < 300) {
            setGameState(GameState.SETTINGS);
          }
          (window as any).lastTouchSetStart = e.timeStamp;
        }} className="flex flex-col items-center justify-center gap-1 p-5 bg-stone-950 text-white hover:bg-stone-800 border-2 border-stone-500 transition-all transform hover:scale-105 active:scale-95 shadow-lg">
          <div className="flex items-center gap-2">
            <SettingsIcon size={20} />
            <span className="text-sm font-bold tracking-widest uppercase">{t.settings}</span>
          </div>
          <span className="text-[9px] opacity-50 uppercase font-bold">{isMobile ? "Tap twice" : "Double click"}</span>
        </button>
      </div>
    </div>
  );

  const Gameplay = () => {
    const currentBeat = STORY_BEATS[storyIndex];
    let arrowRotation = 0;
    if (currentBeat) {
      const angle = Math.atan2(currentBeat.triggerPos.y - playerPos.y, currentBeat.triggerPos.x - playerPos.x);
      arrowRotation = (angle * 180) / Math.PI + 90;
    }

    return (
      <div className={`relative w-full h-full bg-[#020202] overflow-hidden ${shake ? 'vhs-jitter' : ''} ${extremeShake ? 'extreme-shake' : ''}`}>
        {settings.graphicsQuality === 'HIGH' && <div className="scanline" />}
        <MobileControls />
        
        {/* Narrative Display */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[80] w-[90%] max-w-2xl pointer-events-none">
            {currentBeat && (
                <div key={storyIndex} className="bg-black/80 border-l-4 border-red-700 p-6 backdrop-blur-md shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <p className="text-white text-lg md:text-2xl font-black tracking-tight leading-tight uppercase italic opacity-90">
                        {currentBeat.text[settings.language]}
                    </p>
                </div>
            )}
        </div>

        <div className="absolute top-4 right-4 z-[50] bg-black/80 border-2 border-red-900/40 p-4 rounded-sm shadow-xl pointer-events-none backdrop-blur-md">
            <h3 className="text-red-600 text-[10px] mb-3 font-black underline tracking-tighter uppercase">{t.tasks}</h3>
            <div className="space-y-2">
                {EVIDENCE_TASKS.map(task => (
                    <div key={task.key} className={`flex items-center gap-2 text-[9px] transition-colors ${foundEvidence.has(task.key) ? 'text-green-500' : 'text-stone-600'}`}>
                        {foundEvidence.has(task.key) ? <CheckSquare size={12} /> : <Square size={12} className="opacity-30"/>}
                        <span className="font-bold tracking-tight">{settings.language === Language.DE ? task.de : task.en}</span>
                    </div>
                ))}
            </div>
        </div>

        {activePickupAnim && (
            <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="flex flex-col items-center gap-4 animate-bounce">
                    <div className="w-24 h-24 bg-white/10 rounded-full border-4 border-red-600 flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.5)]">
                        <Search className="text-red-600" size={48} />
                    </div>
                    <p className="text-white font-black text-xl tracking-[0.2em] uppercase">
                        {EVIDENCE_TASKS.find(tk => tk.key === activePickupAnim)?.de} GEFUNDEN
                    </p>
                </div>
            </div>
        )}

        <div className="absolute inset-0 transition-transform duration-75 ease-out"
          style={{ transform: `translate(${-(playerPos.x - window.innerWidth/2)}px, ${-(playerPos.y - window.innerHeight/2)}px)` }}
        >
          <div className="absolute inset-[-4000px] opacity-15 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
          
          {Array.from({length: 180}).map((_, i) => (
            <div key={i} className="absolute w-24 h-48"
              style={{ left: `${(i * 3571) % 6000 - 3000}px`, top: `${(i * 4751) % 6000 - 3000}px` }}
            >
               <PixelTree delay={`${(i * 0.1) % 5}s`} />
               <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-12 h-8 bg-black/70 rounded-full blur-2xl -z-10" />
            </div>
          ))}

          <div className="absolute w-[400px] h-[250px] bg-black rounded-full blur-[45px] border-8 border-stone-950/90 shadow-[0_0_120px_rgba(0,0,0,1)]"
             style={{ left: 2500, top: 1000, transform: 'translate(-50%, -50%)' }}>
             <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-48 h-24 bg-red-950/10 blur-2xl rounded-full animate-pulse" />
             </div>
          </div>

          {storyIndex >= 11 && !isFalling && (
            <div className="absolute transition-all duration-100 ease-out" style={{ left: sonPos.x, top: sonPos.y }}>
              <PixelCharacter type={EntityType.SON} state={storyIndex > 13 ? AnimationState.UNNATURAL : AnimationState.IDLE} direction="down" frame={frame} />
            </div>
          )}

          {STORY_BEATS.map((beat, i) => (
             i >= storyIndex && (
              <div key={i} className="absolute w-20 h-20 bg-red-700/30 blur-[60px] animate-pulse rounded-full border-4 border-red-500/5"
                style={{ left: beat.triggerPos.x, top: beat.triggerPos.y }}
              />
             )
          ))}
        </div>

        {currentBeat && !isFalling && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[140px] z-30 transition-transform duration-200"
            style={{ transform: `translate(-50%, -140px) rotate(${arrowRotation}deg)` }}
          >
            <Navigation2 className="text-yellow-500 fill-yellow-500 drop-shadow-[0_0_15px_rgba(250,204,21,0.95)]" size={42} />
          </div>
        )}

        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 transition-all duration-[2000ms] ${isFalling ? 'scale-0 rotate-[1440deg] opacity-0 translate-y-[400px]' : ''}`}>
          <PixelCharacter type={EntityType.FATHER} state={isFalling ? AnimationState.FALLING : animState} direction={direction} frame={frame} />
        </div>

        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_500px_rgba(0,0,0,1)]" />
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.85)_100%)]" />
        
        {jumpscare.active && (
          <div className={`fixed inset-0 z-[1000] flex items-center justify-center overflow-hidden ${jumpscare.type === 'FINAL' || jumpscare.type === 'GESICHT' ? 'animate-brutal-flash bg-black' : 'bg-black'}`}>
            <div className={`w-full h-full ${jumpscare.type === 'FINAL' ? 'bg-red-900/60' : 'bg-red-950/60'} absolute animate-pulse`} />
            
            {jumpscare.type === 'AUGEN' && (
              <div className="grid grid-cols-6 grid-rows-6 w-full h-full gap-4 opacity-80">
                {Array.from({length: 36}).map((_, i) => (
                  <div key={i} className="flex space-x-2 justify-center items-center animate-[pulse_0.1s_infinite]" style={{ animationDelay: `${i * 10}ms` }}>
                    <div className="w-12 h-12 bg-red-600 rounded-full shadow-[0_0_60px_rgba(255,0,0,1)]" />
                    <div className="w-12 h-12 bg-red-600 rounded-full shadow-[0_0_60px_rgba(255,0,0,1)]" />
                  </div>
                ))}
              </div>
            )}

            {jumpscare.type === 'GESICHT' && (
               <div className="relative w-full h-full animate-brutal-glitch flex items-center justify-center">
                   <div className="w-[80vw] h-[80vh] flex flex-col items-center justify-center">
                       {/* Eerie Face Drawing */}
                       <div className="w-64 h-80 bg-neutral-900 border-x-8 border-red-900 rounded-full relative overflow-hidden animate-pulse">
                           <div className="absolute top-1/4 left-1/4 w-8 h-8 bg-red-600 rounded-full shadow-[0_0_40px_red] animate-ping" />
                           <div className="absolute top-1/4 right-1/4 w-8 h-8 bg-red-600 rounded-full shadow-[0_0_40px_red] animate-ping" />
                           <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-32 h-2 bg-red-800 rotate-12" />
                       </div>
                   </div>
               </div>
            )}

            {jumpscare.type === 'FINAL' && (
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                   <div className="scale-[50] animate-brutal-glitch">
                      <PixelCharacter type={EntityType.SON} state={AnimationState.UNNATURAL} direction="down" frame={frame} />
                   </div>
                   {Array.from({length: 30}).map((_, i) => (
                       <div key={i} className="absolute bg-red-800 blur-md opacity-70 animate-ping"
                            style={{ 
                                width: `${Math.random()*200 + 50}px`, 
                                height: `${Math.random()*200 + 50}px`,
                                left: `${Math.random()*100}%`,
                                top: `${Math.random()*100}%`,
                                animationDelay: `${Math.random()*0.2}s`
                            }} />
                   ))}
                </div>
            )}

            <div className="absolute inset-0 pointer-events-none opacity-60">
                {Array.from({length: 60}).map((_, i) => (
                    <div key={i} className="absolute w-3 h-3 bg-red-500 rounded-full animate-ping" 
                        style={{ left: `${Math.random()*100}%`, top: `${Math.random()*100}%`, animationDelay: `${Math.random()*0.1}s` }} />
                ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const Credits = () => (
    <div className="flex flex-col items-center justify-center h-full bg-black text-white space-y-12 relative overflow-hidden">
      {settings.graphicsQuality === 'HIGH' && <div className="vhs-noise" />}
      <div className="space-y-12 text-center animate-in fade-in zoom-in duration-[5000ms] z-10">
        <h2 className="text-7xl md:text-[10rem] text-red-800 font-black mb-12 tracking-widest drop-shadow-[0_0_50px_rgba(185,28,28,0.8)] uppercase leading-none">{t.theEnd}</h2>
        <p className="text-4xl text-white font-black animate-pulse uppercase tracking-[0.8em]">{t.toBeContinued}</p>
        <div className="space-y-8 mt-24">
          <p className="text-stone-500 uppercase tracking-[1em] text-sm font-black">A Masterpiece by</p>
          <p className="text-6xl font-black tracking-widest text-white drop-shadow-2xl">Aydin & Tino</p>
        </div>
        <div className="pt-24">
          <button onDoubleClick={resetGame} onTouchStart={() => resetGame()} className="px-14 py-6 border-4 border-stone-800 text-stone-600 hover:text-white hover:border-white transition-all font-black text-base uppercase tracking-widest bg-stone-900/40 shadow-2xl">
            {isMobile ? "RESTART CHRONICLE (TAP)" : "RESTART CHRONICLE (DBL CLICK)"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-screen h-screen overflow-hidden select-none bg-black">
      {gameState === GameState.MENU && <Menu />}
      {gameState === GameState.DISCLAIMER && (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-12 bg-stone-950 relative">
            <div className="max-w-2xl space-y-8 z-20">
              <h2 className="text-4xl text-white bg-red-800 mb-8 border-4 border-black py-5 inline-block px-14 animate-pulse font-black shadow-2xl uppercase tracking-tighter">! ACHTUNG !</h2>
              <div className="space-y-8 bg-black/90 p-12 border-4 border-red-900 rounded-lg shadow-2xl backdrop-blur-md">
                  <p className="text-2xl leading-relaxed text-white font-black drop-shadow-lg">{t.disclaimer}</p>
                  <div className="space-y-4 pt-6 border-t-2 border-red-900">
                      <p className="text-red-500 text-lg font-black underline uppercase tracking-widest">-- {t.keybinds} --</p>
                      <p className="text-xl text-yellow-500 font-black">{t.pauseInstruction}</p>
                  </div>
              </div>
            </div>
            <button onDoubleClick={() => setGameState(GameState.GAMEPLAY)} onTouchStart={() => setGameState(GameState.GAMEPLAY)} className="px-24 py-7 bg-white text-black hover:bg-red-700 hover:text-white border-4 border-black transition-all font-black text-xl shadow-2xl z-20 transform hover:scale-110 active:scale-90">
              {t.accept} {isMobile ? "(TAP)" : "(DBL CLICK)"}
            </button>
          </div>
      )}
      {gameState === GameState.SETTINGS && (
          <div className="flex flex-col items-center justify-center h-full space-y-12 bg-neutral-900 p-4 relative">
            <h2 className="text-4xl flex items-center gap-4 z-20 text-white font-black drop-shadow-xl uppercase tracking-tighter"><SettingsIcon size={44} /> {t.settings}</h2>
            <div className="w-full max-w-xl space-y-8 z-20 bg-black/70 p-12 rounded-xl border-4 border-stone-700 shadow-2xl">
              <div className="flex justify-between items-center border-b border-stone-800 pb-6">
                <span className="flex items-center gap-3 text-white font-bold uppercase text-sm"><Info size={24}/> {t.language}</span>
                <div className="flex gap-4">
                  {[Language.DE, Language.EN].map(lang => (
                    <button key={lang} onDoubleClick={() => setSettings(s => ({...s, language: lang}))} onTouchStart={() => setSettings(s => ({...s, language: lang}))} className={`px-8 py-4 border-4 font-black transition-all ${settings.language === lang ? 'border-red-600 bg-red-700 text-white' : 'border-stone-800 bg-stone-900 text-stone-500 hover:border-white hover:text-white'}`}>
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center border-b border-stone-800 pb-6">
                <span className="flex items-center gap-3 text-white font-bold uppercase text-sm"><Volume2 size={24}/> {t.volume}</span>
                <input type="range" value={settings.volume} onChange={(e) => setSettings(s => ({...s, volume: parseInt(e.target.value)}))} className="w-56 h-3 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-red-600" />
              </div>
            </div>
            <button onDoubleClick={() => setGameState(GameState.MENU)} onTouchStart={() => setGameState(GameState.MENU)} className="flex items-center gap-3 text-white bg-black/60 px-8 py-4 rounded hover:bg-white hover:text-black font-black transition-all z-20 text-base border-2 border-white/10 uppercase shadow-lg">
              <ArrowLeft size={24} /> {t.back} {isMobile ? "(TAP)" : "(DBL CLICK)"}
            </button>
          </div>
      )}
      {gameState === GameState.GAMEPLAY && <Gameplay />}
      {gameState === GameState.PAUSED && (
          <>
            <Gameplay />
            <div className="fixed inset-0 bg-black/98 backdrop-blur-2xl z-[100] flex flex-col items-center justify-center space-y-12">
                <h2 className="text-6xl text-white tracking-[0.5em] font-black animate-pulse drop-shadow-[0_0_40px_rgba(255,255,255,0.7)] uppercase">{t.paused}</h2>
                <div className="flex flex-col space-y-8 w-80">
                    <button onDoubleClick={() => setGameState(GameState.GAMEPLAY)} onTouchStart={() => setGameState(GameState.GAMEPLAY)} className="p-7 bg-white text-black font-black hover:bg-red-700 hover:text-white transition-all uppercase text-xl shadow-2xl transform hover:scale-105 border-4 border-black">{t.resume}</button>
                    <button onDoubleClick={resetGame} onTouchStart={resetGame} className="p-7 bg-red-950/40 border-4 border-red-800 text-red-500 font-black hover:bg-red-700 hover:text-white transition-all uppercase text-xl">{t.quit} {isMobile ? "(TAP)" : "(DBL CLICK)"}</button>
                </div>
            </div>
          </>
      )}
      {gameState === GameState.ENDING_SCENE && (
          <div className="w-full h-full bg-black relative flex items-center justify-center overflow-hidden">
             {jumpscare.active && <Gameplay />}
             {!jumpscare.active && (
                 <div className="flex flex-col items-center gap-8 opacity-40 animate-pulse">
                     <div className="text-white text-[14px] font-black uppercase tracking-[4em]">...Dunkelheit...</div>
                 </div>
             )}
          </div>
      )}
      {gameState === GameState.END_CREDITS && <Credits />}
    </div>
  );
};

export default App;