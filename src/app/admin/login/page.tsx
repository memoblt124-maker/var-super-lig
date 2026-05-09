"use client";

import { useState, useEffect, useRef } from "react";
import { Eye, EyeOff, Sparkles } from "lucide-react";
import { loginAction } from "../actions";

// ── useRandomBlink ────────────────────────────────────────────────────────────
function useRandomBlink() {
  const [blinking, setBlinking] = useState(false);
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timeout = setTimeout(() => {
        setBlinking(true);
        setTimeout(() => { setBlinking(false); schedule(); }, 150);
      }, Math.random() * 4000 + 3000);
    };
    schedule();
    return () => clearTimeout(timeout);
  }, []);
  return blinking;
}

// ── EyeBall ───────────────────────────────────────────────────────────────────
function EyeBall({
  size = 18, pupilSize = 7, eyeColor = "white", pupilColor = "#2D2D2D",
  isBlinking = false, forceLookX, forceLookY, mousePos,
}: {
  size?: number; pupilSize?: number; eyeColor?: string; pupilColor?: string;
  isBlinking?: boolean; forceLookX?: number; forceLookY?: number;
  mousePos: { x: number; y: number };
}) {
  const ref = useRef<HTMLDivElement>(null);
  const pos = (() => {
    if (forceLookX !== undefined && forceLookY !== undefined) return { x: forceLookX, y: forceLookY };
    if (!ref.current) return { x: 0, y: 0 };
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const dx = mousePos.x - (left + width / 2);
    const dy = mousePos.y - (top + height / 2);
    const dist = Math.min(Math.sqrt(dx ** 2 + dy ** 2), 5);
    const angle = Math.atan2(dy, dx);
    return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist };
  })();

  return (
    <div ref={ref} className="rounded-full flex items-center justify-center"
      style={{ width: size, height: isBlinking ? 2 : size, backgroundColor: eyeColor, overflow: "hidden", transition: "height 0.15s" }}>
      {!isBlinking && (
        <div className="rounded-full" style={{
          width: pupilSize, height: pupilSize, backgroundColor: pupilColor,
          transform: `translate(${pos.x}px, ${pos.y}px)`, transition: "transform 0.1s ease-out",
        }} />
      )}
    </div>
  );
}

// ── Pupil ─────────────────────────────────────────────────────────────────────
function Pupil({ size = 12, pupilColor = "#2D2D2D", forceLookX, forceLookY, mousePos }:
  { size?: number; pupilColor?: string; forceLookX?: number; forceLookY?: number; mousePos: { x: number; y: number } }) {
  const ref = useRef<HTMLDivElement>(null);
  const pos = (() => {
    if (forceLookX !== undefined && forceLookY !== undefined) return { x: forceLookX, y: forceLookY };
    if (!ref.current) return { x: 0, y: 0 };
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const dx = mousePos.x - (left + width / 2);
    const dy = mousePos.y - (top + height / 2);
    const dist = Math.min(Math.sqrt(dx ** 2 + dy ** 2), 5);
    const angle = Math.atan2(dy, dx);
    return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist };
  })();
  return (
    <div ref={ref} className="rounded-full" style={{
      width: size, height: size, backgroundColor: pupilColor,
      transform: `translate(${pos.x}px, ${pos.y}px)`, transition: "transform 0.1s ease-out",
    }} />
  );
}

// ── AdminLoginPage ─────────────────────────────────────────────────────────────
export default function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const isPurpleBlinking = useRandomBlink();
  const isBlackBlinking  = useRandomBlink();

  const purpleRef = useRef<HTMLDivElement>(null);
  const blackRef  = useRef<HTMLDivElement>(null);
  const yellowRef = useRef<HTMLDivElement>(null);
  const orangeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const calcSkew = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 };
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const dx = mousePos.x - (left + width / 2);
    const dy = mousePos.y - (top + height / 3);
    return {
      faceX: Math.max(-15, Math.min(15, dx / 20)),
      faceY: Math.max(-10, Math.min(10, dy / 30)),
      bodySkew: Math.max(-6, Math.min(6, -dx / 120)),
    };
  };

  const pp = calcSkew(purpleRef);
  const bp = calcSkew(blackRef);
  const yp = calcSkew(yellowRef);
  const op = calcSkew(orangeRef);
  const passwordVisible = password.length > 0 && showPassword;
  const passwordHidden  = password.length > 0 && !showPassword;

  return (
    <div className="min-h-screen grid lg:grid-cols-2 -mt-8 -mx-4">
      {/* Left — characters */}
      <div className="relative hidden lg:flex flex-col justify-between bg-gradient-to-br from-primary/90 via-primary to-primary/80 p-12 text-white overflow-hidden">
        <div className="relative z-20 flex items-center gap-2 text-lg font-semibold">
          <div className="size-8 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <Sparkles className="size-4" />
          </div>
          <span>VAR? Admin</span>
        </div>

        <div className="relative z-20 flex items-end justify-center h-[500px]">
          <div className="relative" style={{ width: 550, height: 400 }}>
            {/* Purple */}
            <div ref={purpleRef} className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: 70, width: 180,
                height: isTyping || passwordHidden ? 440 : 400,
                backgroundColor: "#6C3FF5", borderRadius: "10px 10px 0 0", zIndex: 1,
                transform: passwordVisible
                  ? "skewX(0deg)"
                  : isTyping || passwordHidden
                    ? `skewX(${(pp.bodySkew || 0) - 12}deg) translateX(40px)`
                    : `skewX(${pp.bodySkew || 0}deg)`,
                transformOrigin: "bottom center",
              }}>
              <div className="absolute flex gap-8 transition-all duration-700" style={{
                left: passwordVisible ? 20 : `${45 + pp.faceX}px`,
                top:  passwordVisible ? 35 : `${40 + pp.faceY}px`,
              }}>
                {[0,1].map(i => <EyeBall key={i} mousePos={mousePos} isBlinking={isPurpleBlinking}
                  forceLookX={passwordVisible ? -4 : undefined} forceLookY={passwordVisible ? -4 : undefined} />)}
              </div>
            </div>

            {/* Black */}
            <div ref={blackRef} className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: 240, width: 120, height: 310,
                backgroundColor: "#2D2D2D", borderRadius: "8px 8px 0 0", zIndex: 2,
                transform: passwordVisible
                  ? "skewX(0deg)"
                  : `skewX(${(bp.bodySkew || 0) * 1.5}deg)`,
                transformOrigin: "bottom center",
              }}>
              <div className="absolute flex gap-6 transition-all duration-700" style={{
                left: passwordVisible ? 10 : `${26 + bp.faceX}px`,
                top:  passwordVisible ? 28 : `${32 + bp.faceY}px`,
              }}>
                {[0,1].map(i => <EyeBall key={i} mousePos={mousePos} size={16} pupilSize={6}
                  isBlinking={isBlackBlinking}
                  forceLookX={passwordVisible ? -4 : undefined} forceLookY={passwordVisible ? -4 : undefined} />)}
              </div>
            </div>

            {/* Orange */}
            <div ref={orangeRef} className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: 0, width: 240, height: 200, zIndex: 3,
                backgroundColor: "#FF9B6B", borderRadius: "120px 120px 0 0",
                transform: `skewX(${op.bodySkew || 0}deg)`, transformOrigin: "bottom center",
              }}>
              <div className="absolute flex gap-8 transition-all duration-200" style={{
                left: `${82 + op.faceX}px`, top: `${90 + op.faceY}px`,
              }}>
                {[0,1].map(i => <Pupil key={i} mousePos={mousePos}
                  forceLookX={passwordVisible ? -5 : undefined} forceLookY={passwordVisible ? -4 : undefined} />)}
              </div>
            </div>

            {/* Yellow */}
            <div ref={yellowRef} className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: 310, width: 140, height: 230,
                backgroundColor: "#E8D754", borderRadius: "70px 70px 0 0", zIndex: 4,
                transform: `skewX(${yp.bodySkew || 0}deg)`, transformOrigin: "bottom center",
              }}>
              <div className="absolute flex gap-6 transition-all duration-200" style={{
                left: `${52 + yp.faceX}px`, top: `${40 + yp.faceY}px`,
              }}>
                {[0,1].map(i => <Pupil key={i} mousePos={mousePos}
                  forceLookX={passwordVisible ? -5 : undefined} forceLookY={passwordVisible ? -4 : undefined} />)}
              </div>
              <div className="absolute h-[4px] bg-[#2D2D2D] rounded-full transition-all duration-200"
                style={{ width: 80, left: `${40 + yp.faceX}px`, top: `${88 + yp.faceY}px` }} />
            </div>
          </div>
        </div>

        <p className="relative z-20 text-sm text-white/50">VAR? — Süper Lig Adalet Tablosu</p>

        <div className="absolute inset-0 bg-grid-white bg-[size:20px_20px]" />
        <div className="absolute top-1/4 right-1/4 size-64 bg-white/10 rounded-full blur-3xl" />
      </div>

      {/* Right — form */}
      <div className="flex items-center justify-center p-8 bg-[#0e1015]">
        <div className="w-full max-w-[380px]">
          <div className="text-center mb-10">
            <div className="lg:hidden flex items-center justify-center gap-2 text-lg font-semibold mb-6">
              <Sparkles className="size-5 text-red-500" />
              <span className="text-white font-black">VAR?</span>
            </div>
            <h1 className="text-3xl font-bold text-white">Admin Girişi</h1>
            <p className="text-[#6b7280] text-sm mt-1">Yönetim paneline erişin</p>
          </div>

          <form action={loginAction} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#e8eaf0]">Şifre</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setIsTyping(true)}
                  onBlur={() => setIsTyping(false)}
                  placeholder="••••••••"
                  className="w-full h-12 rounded-xl border border-[#252a35] bg-[#16191f] px-4 pr-12 text-white text-sm placeholder:text-[#6b7280] focus:outline-none focus:border-red-500 transition-colors"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-white transition-colors">
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </div>

            <button type="submit"
              className="w-full h-12 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors text-sm">
              Giriş Yap
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
