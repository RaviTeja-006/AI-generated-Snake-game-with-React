import React, { useState, useEffect, useRef, useCallback } from 'react';

const TRACKS = [
  { id: '0x01', title: "CYBER_HORIZON.WAV", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: '0x02', title: "NEON_AFTERGLOW.WAV", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: '0x03', title: "DIGI_SYNAPSE.WAV", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" }
];

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const GAME_SPEED = 100;
const CELL_SIZE = 100 / GRID_SIZE;

export default function App() {
  // Game State
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const directionRef = useRef(INITIAL_DIRECTION);
  const lastProcessedDirectionRef = useRef(INITIAL_DIRECTION);
  const [food, setFood] = useState({ x: 15, y: 5 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isGameRunning, setIsGameRunning] = useState(false);

  // Music Player State
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (!isGameRunning && !gameOver && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) {
        setIsGameRunning(true);
      }

      let newDir = directionRef.current;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          newDir = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
        case 's':
          newDir = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
        case 'a':
          newDir = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
        case 'd':
          newDir = { x: 1, y: 0 };
          break;
      }

      const lastDir = lastProcessedDirectionRef.current;
      if ((newDir.x !== 0 && newDir.x !== -lastDir.x) || (newDir.y !== 0 && newDir.y !== -lastDir.y)) {
        directionRef.current = newDir;
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameRunning, gameOver]);

  // Game Loop
  const moveSnake = useCallback(() => {
    if (!isGameRunning || gameOver) return;

    setSnake(prevSnake => {
      const head = prevSnake[0];
      const currentDir = directionRef.current;
      lastProcessedDirectionRef.current = currentDir;

      const newHead = { x: head.x + currentDir.x, y: head.y + currentDir.y };

      // Check collision with walls
      if (
        newHead.x < 0 ||
        newHead.x >= GRID_SIZE ||
        newHead.y < 0 ||
        newHead.y >= GRID_SIZE
      ) {
        setGameOver(true);
        setIsGameRunning(false);
        return prevSnake;
      }

      // Check collision with self
      if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setGameOver(true);
        setIsGameRunning(false);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check if food eaten
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => {
          const newScore = s + 10;
          if (newScore > highScore) setHighScore(newScore);
          return newScore;
        });

        let newFood;
        while (true) {
          newFood = {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE)
          };
          if (!newSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
            break;
          }
        }
        setFood(newFood);
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [food, gameOver, isGameRunning, highScore]);

  useEffect(() => {
    const intervalId = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(intervalId);
  }, [moveSnake]);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    directionRef.current = INITIAL_DIRECTION;
    lastProcessedDirectionRef.current = INITIAL_DIRECTION;
    setScore(0);
    setGameOver(false);
    setIsGameRunning(false);
    setFood({
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    });
  };

  // Music Player Effects
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(e => console.error("Audio play failed:", e));
    }
  }, [currentTrackIndex, isPlaying]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.error("Audio play failed:", e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const playNext = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };

  const playPrev = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  return (
    <div className="min-h-screen bg-black text-cyan-400 font-mono flex flex-col items-center py-8 px-4 relative overflow-hidden">
      <div className="scanlines"></div>
      <div className="static-noise"></div>

      <header className="mb-8 z-10 w-full max-w-5xl border-b-4 border-fuchsia-500 pb-4 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-5xl md:text-7xl font-bold text-fuchsia-500 glitch-text tracking-widest" data-text="SYS.SNAKE_OS">SYS.SNAKE_OS</h1>
          <p className="text-cyan-400 text-xl md:text-2xl mt-2 bg-fuchsia-500/20 inline-block px-2">v2.0.4 // GLITCH_EDITION</p>
        </div>
        <div className="text-left md:text-right text-fuchsia-500 text-lg md:text-xl border-l-4 border-cyan-400 pl-4 md:border-l-0 md:pl-0">
          <p className="animate-pulse">STATUS: ONLINE</p>
          <p>UPLINK: ESTABLISHED</p>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 w-full max-w-5xl items-start justify-center z-10">
        
        {/* AUDIO SUBSYSTEM */}
        <div className="w-full lg:w-1/3 border-4 border-cyan-400 bg-black p-6 relative shadow-[8px_8px_0px_0px_rgba(255,0,255,1)]">
          <div className="absolute -top-4 left-4 bg-cyan-400 text-black px-3 py-1 text-xl font-bold uppercase">
            Audio_Subsystem
          </div>
          
          <div className="mt-4">
            <div className="border-2 border-fuchsia-500 p-4 mb-6 relative overflow-hidden bg-black">
               <div className="absolute inset-0 bg-fuchsia-500/10 pointer-events-none"></div>
               <div className={`text-fuchsia-500 text-2xl mb-2 font-bold ${isPlaying ? 'animate-pulse' : ''}`}>
                 {isPlaying ? '> STREAMING_DATA...' : '> IDLE_STATE'}
               </div>
               <div className="text-cyan-400 text-2xl truncate font-bold">
                 {TRACKS[currentTrackIndex].title}
               </div>
               <div className="text-cyan-700 text-lg mt-2">
                 FILE_ID: {TRACKS[currentTrackIndex].id}
               </div>
            </div>

            <div className="flex justify-between gap-4 mb-8">
              <button onClick={playPrev} className="flex-1 border-2 border-cyan-400 hover:bg-cyan-400 hover:text-black py-3 text-xl font-bold transition-none">
                [ &lt;&lt; ]
              </button>
              <button onClick={togglePlay} className="flex-1 border-2 border-fuchsia-500 text-fuchsia-500 hover:bg-fuchsia-500 hover:text-black py-3 text-xl font-bold transition-none shadow-[0_0_15px_rgba(255,0,255,0.5)]">
                {isPlaying ? '[ PAUSE ]' : '[ PLAY ]'}
              </button>
              <button onClick={playNext} className="flex-1 border-2 border-cyan-400 hover:bg-cyan-400 hover:text-black py-3 text-xl font-bold transition-none">
                [ &gt;&gt; ]
              </button>
            </div>

            <div className="border-t-4 border-cyan-400 pt-6">
              <div className="flex justify-between text-xl mb-4 font-bold">
                <span className="text-cyan-400">VOL_CTRL</span>
                <button onClick={() => setIsMuted(!isMuted)} className="text-fuchsia-500 hover:text-white uppercase">
                  {isMuted || volume === 0 ? 'Muted' : 'Active'}
                </button>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  if (isMuted) setIsMuted(false);
                }}
                className="w-full bg-black border-2 border-cyan-400 h-6"
              />
            </div>
          </div>
          
          <audio 
            ref={audioRef} 
            src={TRACKS[currentTrackIndex].url} 
            onEnded={playNext}
          />
        </div>

        {/* ENTITY GRID */}
        <div className="w-full lg:w-2/3 border-4 border-fuchsia-500 bg-black p-6 relative shadow-[8px_8px_0px_0px_rgba(0,255,255,1)]">
          <div className="absolute -top-4 left-4 bg-fuchsia-500 text-black px-3 py-1 text-xl font-bold uppercase">
            Entity_Grid
          </div>

          <div className="mt-4 flex flex-col sm:flex-row justify-between mb-6 border-b-4 border-cyan-400 pb-4 gap-4">
            <div className="bg-cyan-400/10 p-2 border border-cyan-400">
              <span className="text-cyan-600 text-lg block">DATA_COLLECTED:</span> 
              <span className="text-4xl text-cyan-400 font-bold">{score}</span>
            </div>
            <div className="bg-fuchsia-500/10 p-2 border border-fuchsia-500 text-right">
              <span className="text-fuchsia-700 text-lg block">MAX_CAPACITY:</span> 
              <span className="text-4xl text-fuchsia-500 font-bold">{highScore}</span>
            </div>
          </div>

          <div 
            className="relative bg-black border-4 border-cyan-400 overflow-hidden w-full aspect-square"
          >
            {/* Grid Background */}
            <div className="absolute inset-0 opacity-30" 
                 style={{
                   backgroundImage: `linear-gradient(#00ffff 1px, transparent 1px), linear-gradient(90deg, #00ffff 1px, transparent 1px)`,
                   backgroundSize: `${CELL_SIZE}% ${CELL_SIZE}%`
                 }}>
            </div>

            {/* Food */}
            <div 
              className="absolute bg-fuchsia-500 animate-pulse"
              style={{
                width: `${CELL_SIZE}%`,
                height: `${CELL_SIZE}%`,
                left: `${food.x * CELL_SIZE}%`,
                top: `${food.y * CELL_SIZE}%`,
                boxShadow: '0 0 10px #ff00ff, 0 0 20px #ff00ff'
              }}
            />

            {/* Snake */}
            {snake.map((segment, index) => {
              const isHead = index === 0;
              return (
                <div 
                  key={`${segment.x}-${segment.y}-${index}`}
                  className={`absolute ${isHead ? 'bg-cyan-300 z-10' : 'bg-cyan-600'}`}
                  style={{
                    width: `${CELL_SIZE}%`,
                    height: `${CELL_SIZE}%`,
                    left: `${segment.x * CELL_SIZE}%`,
                    top: `${segment.y * CELL_SIZE}%`,
                    border: '1px solid #000',
                    boxShadow: isHead ? '0 0 10px #00ffff' : 'none'
                  }}
                >
                  {isHead && (
                    <div className="w-full h-full relative">
                      <div className={`absolute w-[30%] h-[30%] bg-black ${directionRef.current.x === 1 ? 'right-[10%] top-[10%]' : directionRef.current.x === -1 ? 'left-[10%] top-[10%]' : directionRef.current.y === 1 ? 'bottom-[10%] right-[10%]' : 'top-[10%] right-[10%]'}`}></div>
                      <div className={`absolute w-[30%] h-[30%] bg-black ${directionRef.current.x === 1 ? 'right-[10%] bottom-[10%]' : directionRef.current.x === -1 ? 'left-[10%] bottom-[10%]' : directionRef.current.y === 1 ? 'bottom-[10%] left-[10%]' : 'top-[10%] left-[10%]'}`}></div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Overlays */}
            {!isGameRunning && !gameOver && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20 border-4 border-cyan-400 m-4">
                <div className="text-center p-6">
                  <p className="text-cyan-400 font-bold text-2xl md:text-4xl mb-4 glitch-text" data-text="AWAITING_INPUT">
                    AWAITING_INPUT
                  </p>
                  <p className="text-fuchsia-500 text-xl animate-pulse">
                    &gt; PRESS_ARROW_KEYS_TO_EXECUTE
                  </p>
                </div>
              </div>
            )}

            {gameOver && (
              <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-20 border-4 border-fuchsia-500 m-4">
                <h2 className="text-5xl md:text-6xl font-black text-fuchsia-500 mb-4 glitch-text" data-text="CRITICAL_FAILURE">CRITICAL_FAILURE</h2>
                <p className="text-cyan-400 text-2xl mb-8">ENTITY_TERMINATED</p>
                <button 
                  onClick={resetGame}
                  className="px-8 py-4 bg-transparent text-cyan-400 border-4 border-cyan-400 text-2xl font-bold hover:bg-cyan-400 hover:text-black transition-none uppercase"
                >
                  [ REBOOT_SYSTEM ]
                </button>
              </div>
            )}
          </div>
          
          <div className="mt-6 border-t-4 border-fuchsia-500 pt-4 text-fuchsia-500 text-lg flex flex-wrap justify-between items-center">
            <span>&gt; CTRL_INTERFACE:</span>
            <span className="bg-fuchsia-500 text-black px-2 py-1 font-bold">W A S D / ARROWS</span>
          </div>

        </div>
      </div>
    </div>
  );
}
