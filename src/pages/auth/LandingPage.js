import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/* ── Animated counter ── */
function Counter({ target, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        let start = 0;
        const duration = 1800;
        const step = (timestamp) => {
          if (!start) start = timestamp;
          const progress = Math.min((timestamp - start) / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);
          setCount(Math.floor(ease * target));
          if (progress < 1) requestAnimationFrame(step);
          else setCount(target);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ── Floating particle ── */
function Particle({ style }) {
  return <div style={{ position: 'absolute', borderRadius: '50%', pointerEvents: 'none', ...style }} />;
}

export default function LandingPage() {
  const nav = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const features = [
    { icon: '🐛', title: 'Issue Tracking', desc: 'Report, assign, and resolve bugs with priority levels, status tracking, and full history.' },
    { icon: '👥', title: 'Role-Based Access', desc: 'Separate dashboards for Admin, Managers, Developers, and Testers — each perfectly tailored.' },
    { icon: '🔁', title: 'Smart Reassignment', desc: 'Developers can request reassignment. Managers approve and instantly reassign to the right person.' },
    { icon: '🔔', title: 'Live Notifications', desc: 'Every action triggers targeted notifications — the right people are always in the loop.' },
    { icon: '📎', title: 'File Attachments', desc: 'Attach screenshots to issues and upload resolution proofs when closing.' },
    { icon: '⭐', title: 'Performance Ratings', desc: 'Reporters rate developers after resolution. Track team performance with averages.' },
    { icon: '💬', title: 'Threaded Comments', desc: 'Collaborate directly on each issue with a clean, real-time comment thread.' },
    { icon: '📊', title: 'Analytics Dashboard', desc: 'Visual stats for every role — open, in-progress, closed, and more at a glance.' },
  ];

  const roles = [
    {
      role: 'Admin', icon: '🔐', color: '#f59e0b',
      gradient: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(239,68,68,0.08))',
      border: 'rgba(245,158,11,0.3)',
      powers: ['Create & manage all users', 'Assign managers to projects', 'Full system visibility', 'Employee management (CRUD)'],
    },
    {
      role: 'Manager', icon: '👔', color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.08))',
      border: 'rgba(139,92,246,0.3)',
      powers: ['View assigned projects', 'Assign developers to issues', 'Handle reassign requests', 'Track developer performance'],
    },
    {
      role: 'Developer', icon: '💻', color: '#3b82f6',
      gradient: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(6,182,212,0.08))',
      border: 'rgba(59,130,246,0.3)',
      powers: ['Work on assigned issues', 'Update status & upload proof', 'Request reassignment', 'View related project issues'],
    },
    {
      role: 'Tester', icon: '🧪', color: '#06b6d4',
      gradient: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(16,185,129,0.08))',
      border: 'rgba(6,182,212,0.3)',
      powers: ['Report issues with attachments', 'Review developer resolutions', 'Rate & give feedback', 'Track all your issues'],
    },
  ];

  return (
    <div style={{ background: '#070d1a', color: '#f1f5f9', fontFamily: "'DM Sans', sans-serif", overflowX: 'hidden' }}>

      {/* ── Navbar ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 48px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(7,13,26,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
        transition: 'all 0.3s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#3b82f6,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🐛</div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18 }}>
            IssueTrack<span style={{ background: 'linear-gradient(135deg,#3b82f6,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Pro</span>
          </span>
        </div>
        <button onClick={() => nav('/login')} style={{
          padding: '8px 22px', borderRadius: 8, background: 'linear-gradient(135deg,#3b82f6,#06b6d4)',
          border: 'none', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif", boxShadow: '0 0 20px rgba(59,130,246,0.4)',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
          onMouseEnter={e => { e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 0 28px rgba(59,130,246,0.6)'; }}
          onMouseLeave={e => { e.target.style.transform = ''; e.target.style.boxShadow = '0 0 20px rgba(59,130,246,0.4)'; }}>
          Sign In →
        </button>
      </nav>

      {/* ── Hero ── */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: '100px 24px 60px' }}>
        {/* Ambient blobs */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '15%', left: '10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)', filter: 'blur(60px)' }} />
          <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', filter: 'blur(60px)' }} />
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 800, height: 800, borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.04) 0%, transparent 70%)', filter: 'blur(80px)' }} />
          {/* Grid lines */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />
        </div>

        {/* Floating particles */}
        {[
          { top: '20%', left: '8%', width: 6, height: 6, background: 'rgba(59,130,246,0.6)', animation: 'float1 6s ease-in-out infinite' },
          { top: '70%', left: '6%', width: 4, height: 4, background: 'rgba(6,182,212,0.5)', animation: 'float2 8s ease-in-out infinite' },
          { top: '30%', right: '8%', width: 8, height: 8, background: 'rgba(139,92,246,0.5)', animation: 'float1 7s ease-in-out infinite 1s' },
          { top: '75%', right: '10%', width: 5, height: 5, background: 'rgba(59,130,246,0.4)', animation: 'float2 9s ease-in-out infinite 2s' },
          { top: '50%', left: '3%', width: 3, height: 3, background: 'rgba(16,185,129,0.5)', animation: 'float1 5s ease-in-out infinite 0.5s' },
        ].map((p, i) => <Particle key={i} style={p} />)}

        <style>{`
          @keyframes float1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
          @keyframes float2 { 0%,100%{transform:translateY(0) translateX(0)} 33%{transform:translateY(-15px) translateX(8px)} 66%{transform:translateY(8px) translateX(-5px)} }
          @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
          @keyframes fadeUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
          @keyframes pulse-ring { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(1.5);opacity:0} }
        `}</style>

        <div style={{ textAlign: 'center', maxWidth: 800, position: 'relative', zIndex: 1, animation: 'fadeUp 0.8s ease both' }}>
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 99, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)', fontSize: 13, color: '#93c5fd', fontWeight: 600, marginBottom: 28 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#3b82f6', display: 'inline-block', position: 'relative' }}>
              <span style={{ position: 'absolute', inset: -2, borderRadius: '50%', border: '2px solid #3b82f6', animation: 'pulse-ring 1.5s ease-out infinite' }} />
            </span>
            Professional Issue Tracking System
          </div>

          {/* Headline */}
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(44px, 7vw, 84px)', fontWeight: 800, lineHeight: 1.05, marginBottom: 24, letterSpacing: '-0.02em' }}>
            Track Bugs.<br />
            <span style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 50%, #8b5cf6 100%)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              animation: 'shimmer 4s linear infinite',
            }}>Ship Faster.</span>
          </h1>

          <p style={{ fontSize: 'clamp(16px, 2vw, 20px)', color: '#94a3b8', lineHeight: 1.8, maxWidth: 560, margin: '0 auto 44px' }}>
            A complete issue tracking platform for modern engineering teams. Assign bugs, manage projects, and close issues — all in one place.
          </p>

          {/* CTA */}
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => nav('/login')} style={{
              padding: '14px 36px', borderRadius: 12, background: 'linear-gradient(135deg,#3b82f6,#06b6d4)', border: 'none',
              color: '#fff', fontWeight: 700, fontSize: 16, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              boxShadow: '0 0 32px rgba(59,130,246,0.45)', transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 0 48px rgba(59,130,246,0.65)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 0 32px rgba(59,130,246,0.45)'; }}>
              🚀 Get Started
            </button>
            <a href="#features" style={{
              padding: '14px 36px', borderRadius: 12, background: 'transparent', border: '1px solid rgba(255,255,255,0.12)',
              color: '#cbd5e1', fontWeight: 600, fontSize: 16, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              textDecoration: 'none', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#cbd5e1'; }}>
              Explore Features ↓
            </a>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 48, marginTop: 64, flexWrap: 'wrap' }}>
            {[['4', 'User Roles'], ['∞', 'Issues Tracked'], ['100%', 'Notification Coverage'], ['Real-time', 'Collaboration']].map(([val, label]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, background: 'linear-gradient(135deg,#3b82f6,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{val}</div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" style={{ padding: '100px 48px', background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#3b82f6', marginBottom: 12 }}>Features</div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(32px,4vw,48px)', fontWeight: 800, letterSpacing: '-0.02em' }}>Everything your team needs</h2>
            <p style={{ color: '#64748b', fontSize: 17, marginTop: 12 }}>Purpose-built for modern software teams</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
            {features.map((f, i) => (
              <div key={i} style={{
                padding: '24px', borderRadius: 16, background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)', transition: 'all 0.25s', cursor: 'default',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.07)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = ''; }}>
                <div style={{ fontSize: 32, marginBottom: 14 }}>{f.icon}</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{f.title}</div>
                <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Roles ── */}
      <section style={{ padding: '100px 48px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8b5cf6', marginBottom: 12 }}>Roles</div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(32px,4vw,48px)', fontWeight: 800, letterSpacing: '-0.02em' }}>Built for every team member</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
            {roles.map((r, i) => (
              <div key={i} style={{ padding: '28px', borderRadius: 20, background: r.gradient, border: `1px solid ${r.border}`, transition: 'transform 0.25s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={e => e.currentTarget.style.transform = ''}>
                <div style={{ fontSize: 40, marginBottom: 14 }}>{r.icon}</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, color: r.color, marginBottom: 16 }}>{r.role}</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {r.powers.map((p, j) => (
                    <li key={j} style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.8, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{ color: r.color, flexShrink: 0, marginTop: 1 }}>✓</span>{p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section style={{ padding: '80px 48px', background: 'rgba(59,130,246,0.04)', borderTop: '1px solid rgba(59,130,246,0.1)', borderBottom: '1px solid rgba(59,130,246,0.1)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 32, textAlign: 'center' }}>
          {[
            { target: 4, suffix: '', label: 'User Roles' },
            { target: 8, suffix: '+', label: 'Issue Types' },
            { target: 5, suffix: '', label: 'Priority Levels' },
            { target: 100, suffix: '%', label: 'Notification Coverage' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 52, fontWeight: 800, background: 'linear-gradient(135deg,#3b82f6,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1 }}>
                <Counter target={s.target} suffix={s.suffix} />
              </div>
              <div style={{ fontSize: 14, color: '#64748b', marginTop: 8 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section style={{ padding: '120px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(32px,5vw,56px)', fontWeight: 800, marginBottom: 20, letterSpacing: '-0.02em' }}>
            Ready to start tracking?
          </h2>
          <p style={{ fontSize: 18, color: '#64748b', marginBottom: 40, lineHeight: 1.7 }}>
            Sign in with your admin credentials to get started. Set up your projects, add your team, and start shipping.
          </p>
          <button onClick={() => nav('/login')} style={{
            padding: '16px 48px', borderRadius: 14, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', border: 'none',
            color: '#fff', fontWeight: 700, fontSize: 17, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            boxShadow: '0 0 40px rgba(59,130,246,0.4)', transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 0 60px rgba(59,130,246,0.6)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 0 40px rgba(59,130,246,0.4)'; }}>
            → Sign In to Dashboard
          </button>
         
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ padding: '32px 48px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🐛</span>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15 }}>IssueTrackPro</span>
        </div>
        <div style={{ fontSize: 13, color: '#334155' }}>Built with Spring Boot & React · © {new Date().getFullYear()}</div>
      </footer>
    </div>
  );
}
