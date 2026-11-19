import { lazy, Suspense, useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { greetings, keepsakes, OPEN_SECONDS, TURN_SECONDS, type Burst, type Keepsake, type Phase, type Turn } from './data';
import { Icon } from './Icon';
import { useSound } from './useSound';

const SceneModule = () => import('./Scene');
const Scene = lazy(SceneModule);
const order = (page: number) => String(page + 1).padStart(2, '0');

function Insignia() {
  return <span className="insignia" aria-hidden="true"><Icon name="star" /></span>;
}

function LoadingScreen({ progress }: { progress: number }) {
  return <motion.div className="loader grid place-items-center" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .4 }} role="status">
    <div><Insignia /><p>Đang mở cửa thư viện</p><div className="loading-pixels" aria-hidden="true">
      {Array.from({ length: 9 }, (_, index) => <i key={index} className={index < progress ? 'lit' : ''} />)}
    </div></div>
  </motion.div>;
}

function PaperFallback({ phase, page, open, turn }: { phase: Phase; page: number; open: () => void; turn: (direction: -1 | 1) => void }) {
  if (phase === 'intro' || phase === 'opening') return <button className="paper-cover" type="button" aria-label="Mở bìa sách" onClick={open}>
    <span>NHÀ GIÁO VIỆT NAM</span><Icon name="star" /><strong>Sách Tri Ân</strong><span>20 / 11</span>
  </button>;
  return <div className="paper-spread">
    <button type="button" onClick={() => turn(-1)} aria-label="Về trang trước" disabled={page === 0 || phase === 'final'}>
      <small>LỜI TRI ÂN</small><span>{order(page)}</span><em>{greetings[page].title}</em>
    </button>
    <button type="button" onClick={() => turn(1)} aria-label={page === 4 ? 'Đến lời kết' : 'Lật sang trang sau'} disabled={phase === 'final'}>
      <Icon name="star" /><em>{greetings[page].message}</em><small>KÍNH GỬI THẦY CÔ</small>
    </button>
  </div>;
}

function GreetingOverlay({ item, onClose, reduced }: { item: Keepsake; onClose: () => void; reduced: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null!);
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => { if (element.open) element.close(); };
  }, []);
  return <dialog ref={dialog} className="greeting-dialog" aria-labelledby="keepsake-title" onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <motion.div className="greeting-inner" style={{ '--accent': item.color } as CSSProperties} initial={{ opacity: 0, y: reduced ? 0 : 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .24 }}>
      <button autoFocus className="icon-button dialog-close" title="Đóng" aria-label="Đóng" onClick={onClose}><Icon name="close" /></button>
      <div className="keepsake-mark"><Icon name={item.id} /></div>
      <p className="eyebrow">BÍ MẬT · {item.name}</p>
      <h2 id="keepsake-title">{item.title}</h2>
      <p className="keepsake-message">{item.message}</p>
      <span className="mini-divider" aria-hidden="true">✦</span>
    </motion.div>
  </dialog>;
}

export default function App() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [page, setPage] = useState(0);
  const [turn, setTurn] = useState<Turn | null>(null);
  const [burst, setBurst] = useState<Burst | null>(null);
  const [active, setActive] = useState<Keepsake>();
  const [found, setFound] = useState<Set<string>>(() => new Set());
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(2);
  const [prepared, setPrepared] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [sceneKey, setSceneKey] = useState(0);
  const serial = useRef(0);
  const timer = useRef<number>(0);
  const flashTimer = useRef<number>(0);
  const swipe = useRef<{ x: number; y: number; id: number } | null>(null);
  const lastSwipe = useRef(-1000);
  const mainAction = useRef<HTMLButtonElement>(null);
  const nextAction = useRef<HTMLButtonElement>(null);
  const galaxyBackAction = useRef<HTMLButtonElement>(null);
  const focusScene = useRef(false);
  const reduced = Boolean(useReducedMotion());
  const { enabled, toggle, play, musicRef, musicError, onMusicError } = useSound();

  useEffect(() => {
    let mounted = true;
    const prepare = async () => {
      try {
        const [module] = await Promise.all([
          SceneModule(),
          Promise.allSettled([
            document.fonts.load('600 50px "Cormorant Garamond Variable"', 'Tri Ân Người Gieo Chữ'),
            document.fonts.load('italic 600 50px "Cormorant Garamond Variable"', 'Lời chúc đầu trang'),
            document.fonts.load('600 20px "Be Vietnam Pro"', 'NHÀ GIÁO VIỆT NAM'),
            document.fonts.load('400 20px "Be Vietnam Pro"', 'Kính gửi thầy cô'),
          ]),
        ]);
        if (!mounted) return;
        if (!module.supportsWebGL()) { setFallback(true); setReady(true); }
        setProgress(7);
        setPrepared(true);
      } catch {
        if (mounted) { setFallback(true); setReady(true); }
      }
    };
    void prepare();
    return () => { mounted = false; window.clearTimeout(timer.current); window.clearTimeout(flashTimer.current); };
  }, []);

  const onReady = useCallback(() => { setProgress(9); setReady(true); }, []);
  const onFail = useCallback(() => { setFallback(true); setReady(true); }, []);

  const emit = useCallback((kind: Burst['kind']) => {
    window.clearTimeout(flashTimer.current);
    setBurst({ kind, id: ++serial.current });
    flashTimer.current = window.setTimeout(() => setBurst(null), reduced ? 460 : 1700);
  }, [reduced]);
  const onOpeningFlash = useCallback(() => emit('opening'), [emit]);

  const open = useCallback(() => {
    if (!ready || phase !== 'intro' || active) return;
    focusScene.current = document.activeElement === mainAction.current;
    setHovered(false);
    setPhase('opening');
    play('open');
    timer.current = window.setTimeout(() => setPhase('reading'), (reduced ? .23 : OPEN_SECONDS) * 1000);
  }, [active, phase, play, ready, reduced]);

  const navigate = useCallback((direction: -1 | 1, viaSwipe = false) => {
    if (active || phase !== 'reading' || turn || (!viaSwipe && performance.now() - lastSwipe.current < 250)) return;
    const target = page + direction;
    if (target < 0) return;
    if (target >= greetings.length) {
      focusScene.current = true;
      setPhase('final');
      return;
    }
    setTurn({ direction, id: ++serial.current });
    play('page');
    timer.current = window.setTimeout(() => { setPage(target); setTurn(null); }, (reduced ? .115 : TURN_SECONDS) * 1000);
  }, [active, page, phase, play, reduced, turn]);

  const returnToReading = useCallback(() => {
    focusScene.current = true;
    setPhase('reading');
  }, []);

  const replay = useCallback(() => {
    play('click');
    window.clearTimeout(timer.current);
    window.clearTimeout(flashTimer.current);
    setBurst(null);
    setTurn(null);
    setActive(undefined);
    setFound(new Set());
    setPage(0);
    setSceneKey(value => value + 1);
    focusScene.current = true;
    setPhase('intro');
  }, [play]);

  const select = useCallback((item: Keepsake) => {
    if (phase !== 'intro' && phase !== 'reading') return;
    play('sparkle');
    emit(item.id);
    setFound(previous => new Set(previous).add(item.id));
    setActive(item);
  }, [emit, phase, play]);
  const close = useCallback(() => { play('click'); setActive(undefined); }, [play]);

  useEffect(() => {
    if (!focusScene.current) return;
    const target = phase === 'reading' ? nextAction : phase === 'final' ? galaxyBackAction : phase === 'intro' ? mainAction : null;
    if (target?.current) {
      target.current.focus({ preventScroll: true });
      focusScene.current = false;
    }
  }, [phase]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (phase !== 'reading' || active || (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft')) return;
      event.preventDefault();
      navigate(event.key === 'ArrowRight' ? 1 : -1);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [active, navigate, phase]);

  const beginSwipe = (event: PointerEvent) => {
    if (event.pointerType !== 'touch' || phase !== 'reading' || !event.isPrimary) return;
    swipe.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
  };
  const endSwipe = (event: PointerEvent) => {
    const start = swipe.current;
    if (start?.id !== event.pointerId) return;
    swipe.current = null;
    const distance = event.clientX - start.x;
    if (Math.abs(distance) > 42 && Math.abs(distance) > Math.abs(event.clientY - start.y) * 1.3) {
      lastSwipe.current = performance.now();
      navigate(distance < 0 ? 1 : -1, true);
    }
  };

  const motionOffset = reduced ? 0 : 9;
  const reading = phase === 'reading';
  const intro = phase === 'intro' || phase === 'opening';
  const final = phase === 'final';

  return <main className={`experience phase-${phase} ${fallback ? 'is-fallback' : ''}`} data-ready={ready} data-phase={phase}>
    <audio ref={musicRef} src={`${import.meta.env.BASE_URL}audio/nguoi-gieo-mam-xanh.mp3`} preload="none" loop onError={onMusicError} />
    {!final && <div className="world" onPointerDownCapture={beginSwipe} onPointerUpCapture={endSwipe} onPointerCancel={() => { swipe.current = null; }}>
      {!fallback && prepared && <Suspense fallback={null}>
        <Scene key={sceneKey} phase={phase} page={page} turn={turn} burst={burst} active={active} found={found} hovered={hovered} reduced={reduced}
          onOpen={open} onTurn={navigate} onSelect={select} onOpeningFlash={onOpeningFlash} onReady={onReady} onFail={onFail} />
      </Suspense>}
      {fallback && <PaperFallback phase={phase} page={page} open={open} turn={navigate} />}
    </div>}
    {!final && <><div className="scene-light" aria-hidden="true" /><div className="frame" aria-hidden="true"><i /><i /><i /><i /></div></>}
    <header className="site-header flex items-center justify-between">
      {final ? <div className="galaxy-actions">
        <button ref={galaxyBackAction} type="button" className="icon-button" onClick={returnToReading} aria-label="Quay lại trang 05" title="Quay lại trang 05"><Icon name="left" /></button>
        <button type="button" className="icon-button" onClick={replay} aria-label="Đọc lại từ đầu" title="Đọc lại từ đầu"><Icon name="replay" /></button>
      </div> : <div className="wordmark flex items-center"><Insignia /><div><strong>Sách Tri Ân</strong><small>ẤN BẢN ĐẶC BIỆT</small></div></div>}
      <div className="header-date"><span /> 20 THÁNG 11 <span /></div>
      <button type="button" className="icon-button sound-button" onClick={toggle} aria-pressed={enabled} aria-label={enabled ? 'Tắt âm thanh' : 'Bật âm thanh'} title={enabled ? 'Tắt âm thanh' : 'Bật âm thanh'}>
        <Icon name={enabled ? 'volume' : 'mute'} />
      </button>
    </header>
    {musicError && <p className="sound-error" role="status">{musicError}</p>}
    {final && <iframe className="galaxy-frame" title="Cuốn Sách Ngân Hà và Bến Đò Tri Ân" sandbox="allow-scripts" src={`${import.meta.env.BASE_URL}galaxy-tribute.html`} />}
    <AnimatePresence mode="wait" initial={false}>
      {intro && <motion.section key="intro" className="hero intro-title" initial={{ opacity: 0, y: motionOffset }} animate={{ opacity: phase === 'opening' ? 0 : 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: .34 }}>
        <p className="eyebrow hero-eyebrow"><span /> NGÀY NHÀ GIÁO VIỆT NAM <span /></p>
        <h1>Tri ân người <em>gieo chữ</em></h1>
        <p className="hero-caption">Một cuốn sách nhỏ, chứa đựng lòng biết ơn lớn.</p>
      </motion.section>}
      {reading && <motion.section key="reading" className="hero reading-title" initial={{ opacity: 0, y: motionOffset }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: .35 }}>
        <p className="eyebrow hero-eyebrow"><span /> TRANG {order(page)} / 05 <span /></p>
        <h1>{greetings[page].title}</h1>
      </motion.section>}
    </AnimatePresence>
    {phase === 'intro' && <>
      <button className="book-hit" type="button" tabIndex={-1} aria-hidden="true" onClick={open} onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)}>
        <span>MỞ SÁCH <Icon name="right" /></span>
      </button>
      <div className="intro-control">
        <button ref={mainAction} className="primary-button" onClick={open} onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)}>
          <Icon name="hand" /> Mở sách tri ân <Icon name="right" />
        </button>
        <p>Chạm vào cuốn sách để mở ra những lời tri ân</p>
      </div>
    </>}
    {reading && <>
      <p className="mobile-greeting" key={page} aria-live="polite">{greetings[page].message}</p>
      <div className="page-controls" aria-label="Điều hướng trang">
        <button type="button" className="icon-button" onClick={() => navigate(-1)} disabled={page === 0 || Boolean(turn)} aria-label="Trang trước" title="Trang trước"><Icon name="left" /></button>
        <span className="page-dots" aria-label={`Trang ${page + 1} trên 5`}>{greetings.map((item, index) => <i className={index === page ? 'current' : ''} key={item.title} />)}</span>
        <button ref={nextAction} type="button" className="icon-button" onClick={() => navigate(1)} disabled={Boolean(turn)} aria-label={page === 4 ? 'Đến lời kết' : 'Trang sau'} title={page === 4 ? 'Đến lời kết' : 'Trang sau'}><Icon name="right" /></button>
      </div>
      <p className="reading-hint"><span className="desktop-hint">{page === 4 ? 'Lật thêm một trang để đến lời kết' : 'Chạm vào mép sách để lật trang'}</span><span className="touch-hint">Vuốt ngang để lật trang</span></p>
    </>}
    {!final && <footer className="site-footer flex items-end justify-between">
      <div className="volume"><span /> TẬP I <b>·</b> LÒNG BIẾT ƠN</div>
      {(phase === 'intro' || reading) && <nav className="keepsakes" aria-label="Năm vật phẩm bí mật">
        <span className="keepsake-count">BÍ MẬT <b>{found.size} / 5</b></span>
        {keepsakes.map(item => <button key={item.id} type="button" className={found.has(item.id) ? 'discovered' : ''} style={{ '--accent': item.color } as CSSProperties} title={item.name} aria-label={item.name} onClick={() => select(item)}><Icon name={item.id} /></button>)}
      </nav>}
    </footer>}
    {active && <GreetingOverlay item={active} onClose={close} reduced={reduced} />}
    <AnimatePresence>{!ready && <LoadingScreen key="loading" progress={progress} />}</AnimatePresence>
  </main>;
}
