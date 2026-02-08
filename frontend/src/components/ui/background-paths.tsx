"use client";

import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

// ── Theme color helpers ──

function getThemeColors(): { bg: string; fg: string; fgRgb: string } {
    if (typeof document === "undefined") {
        return { bg: "#0a0a0a", fg: "#fafafa", fgRgb: "250,250,250" };
    }
    const style = getComputedStyle(document.documentElement);
    const bg = style.getPropertyValue("--background").trim() || "#0a0a0a";
    const fg = style.getPropertyValue("--foreground").trim() || "#fafafa";

    let fgRgb = "250,250,250";
    if (fg.startsWith("#")) {
        const hex = fg.slice(1);
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        fgRgb = `${r},${g},${b}`;
    }
    return { bg, fg, fgRgb };
}

// ── Vector classes ──

class Vector2D {
    constructor(public x: number, public y: number) {}
    static random(min: number, max: number): number {
        return min + Math.random() * (max - min);
    }
}

class Vector3D {
    constructor(public x: number, public y: number, public z: number) {}
}

// ── Seeded PRNG ──

function createSeededRandom(seed: number) {
    let s = seed;
    return () => {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
    };
}

// ── Star particle ──

class Star {
    private dx: number;
    private dy: number;
    private spiralLocation: number;
    private strokeWeightFactor: number;
    private z: number;
    private angle: number;
    private distance: number;
    private rotationDirection: number;
    private expansionRate: number;
    private finalScale: number;

    constructor(cameraZ: number, cameraTravelDistance: number, rand: () => number) {
        this.angle = rand() * Math.PI * 2;
        this.distance = 30 * rand() + 15;
        this.rotationDirection = rand() > 0.5 ? 1 : -1;
        this.expansionRate = 1.2 + rand() * 0.8;
        this.finalScale = 0.7 + rand() * 0.6;
        this.dx = this.distance * Math.cos(this.angle);
        this.dy = this.distance * Math.sin(this.angle);
        this.spiralLocation = (1 - Math.pow(1 - rand(), 3.0)) / 1.3;
        this.z = Vector2D.random(0.5 * cameraZ, cameraTravelDistance + cameraZ);
        this.z = this.z * 0.7 + (cameraTravelDistance / 2) * 0.3 * this.spiralLocation;
        this.strokeWeightFactor = Math.pow(rand(), 2.0);
    }

    render(p: number, ctrl: SpiralController) {
        const spiralPos = ctrl.spiralPath(this.spiralLocation);
        const q = p - this.spiralLocation;
        if (q <= 0) return;

        const dp = ctrl.constrain(4 * q, 0, 1);
        const linear = dp;
        const elastic = ctrl.easeOutElastic(dp);
        const power = dp * dp;

        let easing: number;
        if (dp < 0.3) {
            easing = ctrl.lerp(linear, power, dp / 0.3);
        } else if (dp < 0.7) {
            easing = ctrl.lerp(power, elastic, (dp - 0.3) / 0.4);
        } else {
            easing = elastic;
        }

        let sx: number, sy: number;

        if (dp < 0.3) {
            sx = ctrl.lerp(spiralPos.x, spiralPos.x + this.dx * 0.3, easing / 0.3);
            sy = ctrl.lerp(spiralPos.y, spiralPos.y + this.dy * 0.3, easing / 0.3);
        } else if (dp < 0.7) {
            const mid = (dp - 0.3) / 0.4;
            const curve = Math.sin(mid * Math.PI) * this.rotationDirection * 1.5;
            const bx = spiralPos.x + this.dx * 0.3;
            const by = spiralPos.y + this.dy * 0.3;
            const tx = spiralPos.x + this.dx * 0.7;
            const ty = spiralPos.y + this.dy * 0.7;
            sx = ctrl.lerp(bx, tx, mid) + (-this.dy * 0.4 * curve) * mid;
            sy = ctrl.lerp(by, ty, mid) + (this.dx * 0.4 * curve) * mid;
        } else {
            const fp = (dp - 0.7) / 0.3;
            const bx = spiralPos.x + this.dx * 0.7;
            const by = spiralPos.y + this.dy * 0.7;
            const td = this.distance * this.expansionRate * 1.5;
            const sa = this.angle + 1.2 * this.rotationDirection * fp * Math.PI;
            const tx = spiralPos.x + td * Math.cos(sa);
            const ty = spiralPos.y + td * Math.sin(sa);
            sx = ctrl.lerp(bx, tx, fp);
            sy = ctrl.lerp(by, ty, fp);
        }

        const vx = (this.z - ctrl.cameraZ) * sx / ctrl.viewZoom;
        const vy = (this.z - ctrl.cameraZ) * sy / ctrl.viewZoom;

        let sizeMul = 1.0;
        if (dp < 0.6) {
            sizeMul = 1.0 + dp * 0.2;
        } else {
            const t = (dp - 0.6) / 0.4;
            sizeMul = 1.2 * (1 - t) + this.finalScale * t;
        }

        ctrl.showProjectedDot(new Vector3D(vx, vy, this.z), 8.5 * this.strokeWeightFactor * sizeMul);
    }
}

// ── Spiral Controller (plays ONCE, more transparent) ──

class SpiralController {
    private timeline: gsap.core.Timeline;
    private time = 0;
    private ctx: CanvasRenderingContext2D;
    private width: number;
    private height: number;
    private stars: Star[] = [];
    private onCompleteCallback: (() => void) | null = null;
    private onNearEndCallback: (() => void) | null = null;
    private nearEndFired = false;

    public bgColor = "#0a0a0a";
    public fgRgb = "250,250,250";

    public readonly cameraZ = -400;
    public readonly cameraTravelDistance = 3400;
    public readonly viewZoom = 100;
    private readonly startDotYOffset = 28;
    private readonly numberOfStars = 5000;
    private readonly trailLength = 80;
    private readonly changeEventTime = 0.32;

    constructor(
        private canvas: HTMLCanvasElement,
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number,
        onComplete?: () => void,
        onNearEnd?: () => void
    ) {
        this.ctx = ctx;
        this.width = width;
        this.height = height;
        this.onCompleteCallback = onComplete || null;
        this.onNearEndCallback = onNearEnd || null;
        this.timeline = gsap.timeline();

        const rand = createSeededRandom(1234);
        for (let i = 0; i < this.numberOfStars; i++) {
            this.stars.push(new Star(this.cameraZ, this.cameraTravelDistance, rand));
        }

        // Play ONCE — no repeat
        this.timeline.to(this, {
            time: 1,
            duration: 15,
            ease: "none",
            onUpdate: () => {
                // Fire near-end callback 1s before completion
                if (!this.nearEndFired && this.time >= 14 / 15) {
                    this.nearEndFired = true;
                    this.onNearEndCallback?.();
                }
                this.render();
            },
            onComplete: () => {
                this.onCompleteCallback?.();
            },
        });
    }

    public ease(p: number, g: number): number {
        if (p < 0.5) return 0.5 * Math.pow(2 * p, g);
        return 1 - 0.5 * Math.pow(2 * (1 - p), g);
    }

    public easeOutElastic(x: number): number {
        const c4 = (2 * Math.PI) / 4.5;
        if (x <= 0) return 0;
        if (x >= 1) return 1;
        return Math.pow(2, -8 * x) * Math.sin((x * 8 - 0.75) * c4) + 1;
    }

    public constrain(v: number, min: number, max: number): number {
        return Math.min(Math.max(v, min), max);
    }

    public lerp(a: number, b: number, t: number): number {
        return a + (b - a) * t;
    }

    private map(v: number, s1: number, e1: number, s2: number, e2: number): number {
        return s2 + (e2 - s2) * ((v - s1) / (e1 - s1));
    }

    public spiralPath(p: number): Vector2D {
        p = this.constrain(1.2 * p, 0, 1);
        p = this.ease(p, 1.8);
        const turns = 6;
        const theta = 2 * Math.PI * turns * Math.sqrt(p);
        const r = 170 * Math.sqrt(p);
        return new Vector2D(r * Math.cos(theta), r * Math.sin(theta) + this.startDotYOffset);
    }

    public showProjectedDot(pos: Vector3D, sizeFactor: number) {
        const t2 = this.constrain(this.map(this.time, this.changeEventTime, 1, 0, 1), 0, 1);
        const camZ = this.cameraZ + this.ease(Math.pow(t2, 1.2), 1.8) * this.cameraTravelDistance;
        if (pos.z <= camZ) return;

        const depth = pos.z - camZ;
        const x = this.viewZoom * pos.x / depth;
        const y = this.viewZoom * pos.y / depth;
        const sw = 400 * sizeFactor / depth;

        this.ctx.beginPath();
        this.ctx.arc(x, y, Math.max(sw * 0.5, 0.3), 0, Math.PI * 2);
        this.ctx.fill();
    }

    private drawTrail(t1: number) {
        const ctx = this.ctx;
        for (let i = 0; i < this.trailLength; i++) {
            const f = this.map(i, 0, this.trailLength, 1.1, 0.1);
            const sw = (1.3 * (1 - t1) + 3.0 * Math.sin(Math.PI * t1)) * f;
            const pathTime = t1 - 0.00015 * i;
            const pos = this.spiralPath(pathTime);

            const offset = new Vector2D(pos.x + 5, pos.y + 5);
            const mid = new Vector2D((pos.x + offset.x) / 2, (pos.y + offset.y) / 2);
            const dx = pos.x - mid.x;
            const dy = pos.y - mid.y;
            const angle = Math.atan2(dy, dx);
            const r = Math.sqrt(dx * dx + dy * dy);
            const o = i % 2 === 0 ? -1 : 1;
            const ep = Math.sin(this.time * Math.PI * 2) * 0.5 + 0.5;
            const bounce = Math.sin(ep * Math.PI) * 0.05 * (1 - ep);
            const rx = mid.x + r * (1 + bounce) * Math.cos(angle + o * Math.PI * this.easeOutElastic(ep));
            const ry = mid.y + r * (1 + bounce) * Math.sin(angle + o * Math.PI * this.easeOutElastic(ep));

            // Subtle trail
            ctx.fillStyle = `rgba(${this.fgRgb}, ${0.15 * f})`;
            ctx.beginPath();
            ctx.arc(rx, ry, Math.max(sw / 2, 0.3), 0, Math.PI * 2);
            ctx.fill();
        }
    }

    private drawStartDot() {
        if (this.time > this.changeEventTime) {
            const dy = this.cameraZ * this.startDotYOffset / this.viewZoom;
            this.showProjectedDot(new Vector3D(0, dy, this.cameraTravelDistance), 2.5);
        }
    }

    private render() {
        const ctx = this.ctx;
        if (!ctx) return;

        ctx.clearRect(0, 0, this.width, this.height);

        ctx.save();
        ctx.translate(this.width / 2, this.height / 2);

        const t1 = this.constrain(this.map(this.time, 0, this.changeEventTime + 0.25, 0, 1), 0, 1);
        const t2 = this.constrain(this.map(this.time, this.changeEventTime, 1, 0, 1), 0, 1);

        ctx.rotate(-Math.PI * this.ease(t2, 2.7));

        this.drawTrail(t1);

        // Subtle stars
        ctx.fillStyle = `rgba(${this.fgRgb}, 0.2)`;
        for (const star of this.stars) {
            star.render(t1, this);
        }

        this.drawStartDot();
        ctx.restore();
    }

    public updateColors(bg: string, fgRgb: string) {
        this.bgColor = bg;
        this.fgRgb = fgRgb;
    }

    public destroy() {
        this.timeline.kill();
    }
}

// ── Phase 1: Spiral canvas (plays once, then fades out) ──

function SpiralBackground({ onComplete, onNearEnd }: { onComplete: () => void; onNearEnd?: () => void }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const controllerRef = useRef<SpiralController | null>(null);

    const setupCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;

        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.scale(dpr, dpr);

        controllerRef.current?.destroy();

        const colors = getThemeColors();
        const controller = new SpiralController(canvas, ctx, w, h, onComplete, onNearEnd);
        controller.updateColors(colors.bg, colors.fgRgb);
        controllerRef.current = controller;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        setupCanvas();

        const handleResize = () => setupCanvas();
        window.addEventListener("resize", handleResize);

        const observer = new MutationObserver(() => {
            const colors = getThemeColors();
            controllerRef.current?.updateColors(colors.bg, colors.fgRgb);
        });
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        });

        return () => {
            window.removeEventListener("resize", handleResize);
            observer.disconnect();
            controllerRef.current?.destroy();
            controllerRef.current = null;
        };
    }, [setupCanvas]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
        />
    );
}

// ── Phase 2: Flowing SVG lines (appear after spiral ends) ──
// Inspired by the spiral's trail: lines flow with similar organic motion

export function FloatingPaths({ position }: { position: number }) {
    const paths = useMemo(
        () =>
            Array.from({ length: 36 }, (_, i) => ({
                id: i,
                d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
                    380 - i * 5 * position
                } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
                    152 - i * 5 * position
                } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
                    684 - i * 5 * position
                } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
                width: 0.5 + i * 0.03,
                // Each line gets a unique speed based on golden ratio spacing
                duration: 12 + ((i * 7 + 3) % 36) * 1.2,
            })),
        [position]
    );

    return (
        <div className="absolute inset-0 pointer-events-none">
            <svg
                className="w-full h-full text-foreground"
                viewBox="0 0 696 316"
                fill="none"
            >
                <title>Background Paths</title>
                {paths.map((path) => (
                    <motion.path
                        key={path.id}
                        d={path.d}
                        stroke="currentColor"
                        strokeWidth={path.width}
                        strokeOpacity={0.08 + path.id * 0.005}
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{
                            pathLength: 1,
                            opacity: [0.3, 0.5, 0.3],
                            pathOffset: [0, 1, 0],
                        }}
                        transition={{
                            pathLength: { duration: 3, ease: "easeOut" },
                            opacity: {
                                duration: path.duration,
                                repeat: Infinity,
                                ease: "linear",
                                delay: 0.5,
                            },
                            pathOffset: {
                                duration: path.duration,
                                repeat: Infinity,
                                ease: "linear",
                            },
                        }}
                    />
                ))}
            </svg>
        </div>
    );
}

// ── Exported BackgroundPaths ──

export function BackgroundPaths({
    children,
}: {
    children?: React.ReactNode;
}) {
    const [spiralDone, setSpiralDone] = useState(false);
    const [linesVisible, setLinesVisible] = useState(false);

    useEffect(() => {
        const t = requestAnimationFrame(() => setLinesVisible(true));
        return () => cancelAnimationFrame(t);
    }, []);

    const handleSpiralComplete = useCallback(() => {
        setSpiralDone(true);
    }, []);

    return (
        <div className="relative h-screen w-full flex flex-col items-center overflow-hidden bg-background">
            <div className="absolute -inset-x-0 top-[-10%] bottom-0 pointer-events-none">
                {/* Phase 1: Spiral — plays once then fades out, reduced intensity */}
                <div
                    className={`absolute inset-0 transition-opacity duration-[2000ms] ease-out ${
                        spiralDone ? "opacity-0 pointer-events-none" : "opacity-40"
                    }`}
                >
                    <SpiralBackground onComplete={handleSpiralComplete} />
                </div>

                {/* Phase 2: Flowing lines — gradual 12s fade-in from mount */}
                <div
                    className={`absolute inset-0 transition-opacity duration-[12000ms] ease-in ${
                        linesVisible ? "opacity-100" : "opacity-0"
                    }`}
                >
                    <FloatingPaths position={1} />
                    <FloatingPaths position={-1} />
                </div>
            </div>

            <div className="relative z-10 flex items-center h-full w-full max-w-7xl mx-auto px-6 md:px-10 lg:px-16 pt-16">
                {children}
            </div>
        </div>
    );
}
