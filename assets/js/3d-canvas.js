/**
 * STEMulus — Cinematic 3D WebGL Hologram Component  v3.1  (Blend Edition)
 *
 * Design principle: every model must harmonise with the light #FAFBFC chalk
 * background — warm orange / gold / amber palette, open geometry, transparent
 * materials, additive-blended particles. No dark fills, no hard edges.
 *
 * Pages:
 *  programs → Orrery of Knowledge   (orbital atom — thin rings + pulsing electrons)
 *  parents  → Nested Gyroscope      (warm amber core + 3 tilted tori + diamonds)
 *  blog     → DNA Wisdom Column     (smooth warm-strand helix + gold rungs)
 *  contact  → Neural Constellation  (open icosphere + orange-gold node web)
 *  default  → Quantum Torus Knot    (semi-transparent knot + golden particle cloud)
 *
 *  // starPositions = new Float32Array
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', init3DCanvas);

  function init3DCanvas() {
    const container = document.getElementById('three-js-canvas-container');
    if (!container) return;
    if (typeof THREE === 'undefined') {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      s.onload = () => setupScene(container);
      s.onerror = () => console.warn('[3DCanvas] Three.js failed to load.');
      document.head.appendChild(s);
    } else {
      setupScene(container);
    }
  }

  // ─── Colour palette — all warm, editorial ─────────────────────────────────
  const C = {
    orange:  0xf4600c,   // brand orange
    orangeD: 0xb84407,   // dark orange (emissive)
    amber:   0xfb923c,   // soft amber
    amberD:  0xc2660e,
    gold:    0xfacc15,   // warm gold
    goldD:   0xb38f0a,
    rose:    0xfda4af,   // blush rose  (light, accent only)
    violet:  0xc4b5fd,   // pastel violet (light, not deep)
    violetD: 0x7c3aed,
    cream:   0xfff7ed,   // near-page-bg (for very-faint fills)
    chalk:   0xfafaf9,
  };

  // ─── Material helpers ──────────────────────────────────────────────────────
  function phong(color, emissive, shininess, opacity) {
    return new THREE.MeshPhongMaterial({
      color, emissive, shininess,
      transparent: opacity < 1,
      opacity,
      side: THREE.DoubleSide,
    });
  }
  function wire(color, opacity) {
    return new THREE.MeshBasicMaterial({
      color, wireframe: true,
      transparent: true, opacity,
      side: THREE.DoubleSide,
    });
  }
  function pts(color, size, opacity) {
    return new THREE.PointsMaterial({
      color, size,
      transparent: true, opacity,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }
  function line(color, opacity) {
    return new THREE.LineBasicMaterial({
      color, transparent: true, opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }

  // ─── Shared geometry builders ──────────────────────────────────────────────
  /** Spherical particle halo */
  function halo(n, spread, color, size, opacity) {
    const g = new THREE.BufferGeometry();
    const p = new Float32Array(n * 3);
    for (let i = 0; i < n * 3; i += 3) {
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      const r  = spread * (0.8 + Math.random() * 0.4);
      p[i]   = r * Math.sin(ph) * Math.cos(th);
      p[i+1] = r * Math.sin(ph) * Math.sin(th);
      p[i+2] = r * Math.cos(ph);
    }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    return new THREE.Points(g, pts(color, size, opacity));
  }

  /** Thin background starfield */
  function stars(n, spread, color) {
    const g = new THREE.BufferGeometry();
    const p = new Float32Array(n * 3);
    for (let i = 0; i < n * 3; i++) p[i] = (Math.random() - 0.5) * spread;
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    return new THREE.Points(g, pts(color, 0.03, 0.35));
  }

  /** 5-light warm rig */
  function lights(scene, key, fill) {
    scene.add(new THREE.AmbientLight(0xfff3e0, 0.8));           // warm ambient
    const k = new THREE.PointLight(key, 3.0, 20);
    k.position.set(4, 5, 6);
    scene.add(k);
    const f = new THREE.PointLight(fill, 1.5, 15);
    f.position.set(-5, -2, 3);
    scene.add(f);
    const r = new THREE.PointLight(C.amber, 1.2, 10);
    r.position.set(0, -5, -5);
    scene.add(r);
    const d = new THREE.DirectionalLight(0xffffff, 0.3);
    d.position.set(-2, 6, -3);
    scene.add(d);
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  PROGRAMS  —  Orrery of Knowledge
  //  Warm amber nucleus · three colour-coded orbital rings · pulsing electrons
  // ══════════════════════════════════════════════════════════════════════════
  function buildPrograms(group, scene) {
    lights(scene, C.orange, C.gold);

    // Core — pulsing golden-orange octahedron + wire sphere
    const core = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.36, 0),
      phong(C.orange, C.orangeD, 180, 0.95)
    );
    const coreWire = new THREE.Mesh(
      new THREE.SphereGeometry(0.46, 12, 12),
      wire(C.gold, 0.18)
    );
    group.add(core, coreWire);

    // Double-nested boxes
    const outerBox = new THREE.Mesh(
      new THREE.BoxGeometry(1.9, 1.9, 1.9),
      wire(C.orange, 0.45)
    );
    const innerBox = new THREE.Mesh(
      new THREE.BoxGeometry(1.35, 1.35, 1.35),
      wire(C.gold, 0.35)
    );
    group.add(outerBox, innerBox);

    // Vertex nodes — small spheres on outer box corners
    const nodesGroup = new THREE.Group();
    const size = 0.95;
    const vertices = [
      new THREE.Vector3(-size, -size, -size),
      new THREE.Vector3(-size, -size,  size),
      new THREE.Vector3(-size,  size, -size),
      new THREE.Vector3(-size,  size,  size),
      new THREE.Vector3( size, -size, -size),
      new THREE.Vector3( size, -size,  size),
      new THREE.Vector3( size,  size, -size),
      new THREE.Vector3( size,  size,  size)
    ];
    const nodeMeshes = [];
    vertices.forEach(v => {
      const node = new THREE.Mesh(
        new THREE.SphereGeometry(0.065, 12, 12),
        phong(C.amber, C.amberD, 180, 0.9)
      );
      node.position.copy(v);
      nodesGroup.add(node);
      nodeMeshes.push(node);
    });
    group.add(nodesGroup);

    // Orbital coordinate ring — thin torus
    const orbitRing = new THREE.Mesh(
      new THREE.TorusGeometry(2.3, 0.012, 8, 80),
      phong(C.violet || 0xc4b5fd, C.violet || 0xc4b5fd, 100, 0.5)
    );
    orbitRing.rotation.set(Math.PI / 3, Math.PI / 4, 0);
    group.add(orbitRing);

    // Particles & starfield
    const dustHalo = halo(180, 2.8, C.orange, 0.038, 0.25);
    group.add(dustHalo);
    const bg = stars(280, 18, C.gold);
    scene.add(bg);

    return {
      update(t) {
        core.rotation.y      += 0.006;
        core.rotation.x      -= 0.003;
        coreWire.rotation.y  -= 0.005;

        outerBox.rotation.x  += 0.004;
        outerBox.rotation.y  += 0.006;
        nodesGroup.rotation.x = outerBox.rotation.x;
        nodesGroup.rotation.y = outerBox.rotation.y;

        innerBox.rotation.x  -= 0.006;
        innerBox.rotation.y  -= 0.004;
        innerBox.rotation.z  += 0.002;

        orbitRing.rotation.z += 0.003;
        dustHalo.rotation.y  += 0.001;
        bg.rotation.y        += 0.0005;

        const pulseCore = 1 + Math.sin(t * 2.5) * 0.12;
        core.scale.setScalar(pulseCore);

        nodeMeshes.forEach((n, idx) => {
          const pulseNode = 1 + Math.sin(t * 3.5 + idx * 0.8) * 0.3;
          n.scale.setScalar(pulseNode);
        });
      }
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  PARENTS  —  Nested Gyroscope Orrery  (reference blend — keep close)
  //  Warm amber core · three tilted nested tori · orbiting diamond satellites
  // ══════════════════════════════════════════════════════════════════════════
  function buildParents(group, scene) {
    lights(scene, C.gold, C.orange);

    // Core — small layered sphere
    const coreIn = new THREE.Mesh(
      new THREE.SphereGeometry(0.36, 56, 56),
      phong(C.orange, C.orangeD, 180, 0.95)
    );
    const coreGlow = new THREE.Mesh(
      new THREE.SphereGeometry(0.50, 24, 24),
      phong(C.gold, C.goldD, 60, 0.10)
    );
    group.add(coreIn, coreGlow);

    // Gyroscopic rings — three nested tori spinning independently
    const ringCfg = [
      { r: 1.28, tube: 0.020, color: C.gold,   rx: 0,           ry: 0,           spZ: 0.013,  spY: 0.009  },
      { r: 1.66, tube: 0.016, color: C.orange,  rx: Math.PI/2,  ry: 0,           spZ: -0.008, spY: 0.005  },
      { r: 2.04, tube: 0.013, color: C.amber,   rx: Math.PI/4,  ry: Math.PI/3,   spZ: 0.006,  spY: -0.004 },
    ];

    const gyros = ringCfg.map(rc => {
      const g = new THREE.Group();
      g.rotation.set(rc.rx, rc.ry, 0);
      g.add(new THREE.Mesh(
        new THREE.TorusGeometry(rc.r, rc.tube, 14, 120),
        phong(rc.color, rc.color, 90, 0.72)
      ));
      group.add(g);
      return { group: g, spZ: rc.spZ, spY: rc.spY };
    });

    // Diamond satellites
    const satData = [
      { color: C.gold,   r: 1.28, angle: 0.4,  speed: 0.011 },
      { color: C.orange, r: 1.66, angle: 2.2,  speed: -0.007 },
      { color: C.amber,  r: 2.04, angle: 1.0,  speed: 0.006 },
    ];
    const sats = satData.map(sd => {
      const m = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.11, 0),
        phong(sd.color, sd.color, 200, 0.90)
      );
      group.add(m);
      return { mesh: m, ...sd };
    });

    // Halos
    const dustHalo = halo(190, 2.5, C.gold, 0.038, 0.26);
    group.add(dustHalo);
    const bg = stars(280, 18, C.amber);
    scene.add(bg);

    return {
      update(t) {
        coreIn.rotation.y   += 0.006;
        coreGlow.rotation.y -= 0.004;
        dustHalo.rotation.y += 0.001;
        bg.rotation.y       += 0.0005;

        gyros.forEach(g => {
          g.group.rotation.z += g.spZ;
          g.group.rotation.y += g.spY;
        });

        sats.forEach((s, i) => {
          s.angle += s.speed;
          const tilt = i * (Math.PI / 3);
          s.mesh.position.x = Math.cos(s.angle) * s.r * Math.cos(tilt);
          s.mesh.position.y = Math.sin(s.angle) * s.r * 0.45;
          s.mesh.position.z = Math.cos(s.angle) * s.r * Math.sin(tilt);
          s.mesh.rotation.x += 0.022;
          s.mesh.rotation.y += 0.018;
          const p = 1 + Math.sin(t * 2.8 + i) * 0.28;
          s.mesh.scale.setScalar(p);
        });
      }
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  BLOG  —  DNA Wisdom Column
  //  CatmullRom tube strands in orange + amber (warm, no violet)
  //  Gold rung lines · glowing node spheres · cylindrical particle halo
  // ══════════════════════════════════════════════════════════════════════════
  function buildBlog(group, scene) {
    lights(scene, C.orange, C.amber);

    const RUNGS   = 44;
    const HEIGHT  = 4.4;
    const RADIUS  = 0.88;
    const TURNS   = 2.5;

    const s1pts = [], s2pts = [];
    for (let i = 0; i <= RUNGS; i++) {
      const t  = i / RUNGS;
      const th = t * Math.PI * 2 * TURNS;
      const y  = t * HEIGHT - HEIGHT / 2;
      s1pts.push(new THREE.Vector3( Math.cos(th) * RADIUS, y,  Math.sin(th) * RADIUS));
      s2pts.push(new THREE.Vector3(-Math.cos(th) * RADIUS, y, -Math.sin(th) * RADIUS));
    }

    const curve1 = new THREE.CatmullRomCurve3(s1pts);
    const curve2 = new THREE.CatmullRomCurve3(s2pts);

    // Strands as smooth tubes — warm palette, slightly transparent
    const strand1 = new THREE.Mesh(
      new THREE.TubeGeometry(curve1, 220, 0.034, 8, false),
      phong(C.orange, C.orangeD, 140, 0.78)
    );
    const strand2 = new THREE.Mesh(
      new THREE.TubeGeometry(curve2, 220, 0.034, 8, false),
      phong(C.amber, C.amberD, 140, 0.72)
    );
    group.add(strand1, strand2);

    // Rungs + endpoint nodes
    const nodeMeshes = [];
    for (let i = 0; i <= RUNGS; i += 2) {
      const t  = i / RUNGS;
      const th = t * Math.PI * 2 * TURNS;
      const y  = t * HEIGHT - HEIGHT / 2;
      const p1 = new THREE.Vector3( Math.cos(th) * RADIUS, y,  Math.sin(th) * RADIUS);
      const p2 = new THREE.Vector3(-Math.cos(th) * RADIUS, y, -Math.sin(th) * RADIUS);

      const rg = new THREE.BufferGeometry().setFromPoints([p1, p2]);
      group.add(new THREE.Line(rg, line(C.gold, 0.38)));

      [p1, p2].forEach((pt, si) => {
        const n = new THREE.Mesh(
          new THREE.SphereGeometry(0.050, 10, 10),
          phong(si === 0 ? C.orange : C.gold, si === 0 ? C.orangeD : C.goldD, 200, 0.88)
        );
        n.position.copy(pt);
        group.add(n);
        nodeMeshes.push(n);
      });
    }

    // Cylindrical halo cloud
    const haloGeom = new THREE.BufferGeometry();
    const hp = new Float32Array(260 * 3);
    for (let i = 0; i < 260 * 3; i += 3) {
      const th = Math.random() * Math.PI * 2;
      const r  = RADIUS * 1.55 + Math.random() * 0.8;
      hp[i]   = Math.cos(th) * r;
      hp[i+1] = (Math.random() - 0.5) * (HEIGHT + 1.2);
      hp[i+2] = Math.sin(th) * r;
    }
    haloGeom.setAttribute('position', new THREE.BufferAttribute(hp, 3));
    const haloCloud = new THREE.Points(haloGeom, pts(C.orange, 0.038, 0.22));
    group.add(haloCloud);

    const bg = stars(260, 18, C.amber);
    scene.add(bg);

    return {
      update(t) {
        group.rotation.y     += 0.007;
        group.rotation.x      = Math.sin(t * 0.38) * 0.10;
        haloCloud.rotation.y += 0.003;
        bg.rotation.y        += 0.0005;

        nodeMeshes.forEach((n, i) => {
          const p = 1 + Math.sin(t * 3.2 + i * 0.5) * 0.38;
          n.scale.setScalar(p);
        });
      }
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  CONTACT  —  Neural Constellation
  //  Open icosahedron globe (orange/amber) · warm-toned synaptic node field
  //  Amber spark lines · orange breathing core
  // ══════════════════════════════════════════════════════════════════════════
  function buildContact(group, scene) {
    lights(scene, C.orange, C.amber);

    // Double-nested open wireframe spheres — very transparent
    const outerGlobe = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.52, 3),
      wire(C.orange, 0.20)
    );
    const innerGlobe = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.18, 2),
      wire(C.gold, 0.14)
    );
    group.add(outerGlobe, innerGlobe);

    // Warm nucleus
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 32, 32),
      phong(C.orange, C.orangeD, 200, 0.92)
    );
    group.add(core);

    // Synaptic nodes — warm 4-colour palette
    const rawPos = outerGlobe.geometry.attributes.position.array;
    const seen   = new Set();
    const verts  = [];
    for (let i = 0; i < rawPos.length; i += 3) {
      const key = `${rawPos[i].toFixed(2)},${rawPos[i+1].toFixed(2)},${rawPos[i+2].toFixed(2)}`;
      if (!seen.has(key)) { seen.add(key); verts.push(new THREE.Vector3(rawPos[i], rawPos[i+1], rawPos[i+2])); }
    }

    const nodeColors = [C.orange, C.gold, C.amber, C.rose];
    const nodeGroup  = new THREE.Group();
    const nodeMeshes = [];
    verts.forEach((v, i) => {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(0.042, 8, 8),
        phong(nodeColors[i % nodeColors.length], nodeColors[i % nodeColors.length], 220, 0.88)
      );
      m.position.copy(v);
      nodeGroup.add(m);
      nodeMeshes.push(m);
    });
    group.add(nodeGroup);

    // Spark lines — short amber connections between nearby nodes
    const lineGroup = new THREE.Group();
    for (let i = 0; i < verts.length; i++) {
      for (let j = i + 1; j < verts.length; j++) {
        if (verts[i].distanceTo(verts[j]) < 0.92) {
          const lg = new THREE.BufferGeometry().setFromPoints([verts[i], verts[j]]);
          lineGroup.add(new THREE.Line(lg, line(C.amber, 0.22)));
        }
      }
    }
    group.add(lineGroup);

    // Halos
    const dustHalo = halo(200, 2.1, C.orange, 0.040, 0.22);
    group.add(dustHalo);
    const bg = stars(270, 18, C.gold);
    scene.add(bg);

    return {
      update(t) {
        outerGlobe.rotation.y += 0.004;
        outerGlobe.rotation.x += 0.001;
        innerGlobe.rotation.y -= 0.006;
        innerGlobe.rotation.z += 0.002;
        nodeGroup.rotation.y  += 0.004;
        nodeGroup.rotation.x  += 0.001;
        lineGroup.rotation.y  += 0.004;
        lineGroup.rotation.x  += 0.001;
        core.rotation.y       += 0.010;
        dustHalo.rotation.y   += 0.001;
        bg.rotation.y         += 0.0005;

        nodeMeshes.forEach((n, i) => {
          const p = 1 + Math.sin(t * 2.4 + i * 0.42) * 0.48;
          n.scale.setScalar(p);
        });
        const cp = 1 + Math.sin(t * 1.9) * 0.20;
        core.scale.setScalar(cp);
      }
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  DEFAULT  —  Quantum Torus Knot
  //  Orange Phong knot (semi-transparent) · gold ghost overlay
  //  Amber inner sphere · dual-direction warm particle nebula
  // ══════════════════════════════════════════════════════════════════════════
  function buildDefault(group, scene) {
    lights(scene, C.orange, C.gold);

    // Knot — semi-transparent so bg cream glows through
    const knot = new THREE.Mesh(
      new THREE.TorusKnotGeometry(1.28, 0.28, 180, 22, 2, 3),
      phong(C.orange, C.orangeD, 110, 0.70)
    );
    const knotWire = new THREE.Mesh(
      new THREE.TorusKnotGeometry(1.28, 0.29, 60, 10, 2, 3),
      wire(C.gold, 0.14)
    );
    group.add(knot, knotWire);

    // Inner sphere — golden, breathing
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.50, 56, 56),
      phong(C.gold, C.goldD, 180, 0.80)
    );
    const coreWire = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.58, 1),
      wire(C.amber, 0.18)
    );
    group.add(core, coreWire);

    // Dual particle nebula — orange inward, amber outward
    const neb1 = halo(280, 2.4, C.orange, 0.042, 0.22);
    const neb2 = halo(200, 3.0, C.amber,  0.035, 0.16);
    group.add(neb1, neb2);

    const bg = stars(300, 18, C.gold);
    scene.add(bg);

    return {
      update(t) {
        knot.rotation.x     += 0.005;
        knot.rotation.y     += 0.007;
        knotWire.rotation.x += 0.005;
        knotWire.rotation.y += 0.007;

        core.rotation.y     -= 0.008;
        core.rotation.x     -= 0.003;
        coreWire.rotation.y -= 0.007;
        coreWire.rotation.x += 0.005;

        neb1.rotation.y     += 0.001;
        neb2.rotation.y     -= 0.0008;
        bg.rotation.y       += 0.0005;

        const p = 1 + Math.sin(t * 1.6) * 0.12;
        core.scale.setScalar(p);
        coreWire.scale.setScalar(p * 1.02);
      }
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  SCENE SETUP
  // ══════════════════════════════════════════════════════════════════════════
  function setupScene(container) {
    let width  = container.clientWidth  || 480;
    let height = container.clientHeight || 480;

    const scene    = new THREE.Scene();
    const camera   = new THREE.PerspectiveCamera(42, width / height, 0.1, 120);
    camera.position.z = 7.5;

    // Alpha: true keeps bg transparent so the cream page shows through
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);   // fully transparent clear
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // ── Page detection ─────────────────────────────────────────────────────
    let pageType = 'default';
    if      (document.getElementById('cs-roadmap-section'))    pageType = 'programs';
    else if (document.getElementById('parents-heading'))      pageType = 'parents';
    else if (document.getElementById('blog-grid-container')) pageType = 'blog';
    else if (document.getElementById('contact-form'))        pageType = 'contact';

    console.log(`[3DCanvas] Blend model: ${pageType}`);

    // ── Build sculpture ─────────────────────────────────────────────────────
    const group = new THREE.Group();
    scene.add(group);

    let ctrl;
    switch (pageType) {
      case 'programs': ctrl = buildPrograms(group, scene); break;
      case 'parents':  ctrl = buildParents(group, scene);  break;
      case 'blog':     ctrl = buildBlog(group, scene);     break;
      case 'contact':  ctrl = buildContact(group, scene);  break;
      default:         ctrl = buildDefault(group, scene);  break;
    }

    // ── Mouse / touch parallax ─────────────────────────────────────────────
    let tx = 0, ty = 0, sx = 0, sy = 0;
    const HX = window.innerWidth / 2, HY = window.innerHeight / 2;
    window.addEventListener('mousemove', e => {
      tx = (e.clientX - HX) / 240;
      ty = (e.clientY - HY) / 240;
    });
    window.addEventListener('touchmove', e => {
      if (e.touches.length) {
        tx = (e.touches[0].clientX - HX) / 340;
        ty = (e.touches[0].clientY - HY) / 340;
      }
    }, { passive: true });

    // ── Animation loop ──────────────────────────────────────────────────────
    const clock = new THREE.Clock();
    (function animate() {
      requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      sx += (tx - sx) * 0.04;
      sy += (ty - sy) * 0.04;

      // Gentle parallax on the sculpture group
      group.rotation.x = sy * 0.16;
      group.rotation.y = sx * 0.16;

      // Subtle camera drift
      camera.position.x = sx * 0.45;
      camera.position.y = -sy * 0.45;
      camera.lookAt(scene.position);

      if (ctrl && ctrl.update) ctrl.update(t);

      renderer.render(scene, camera);
    })();

    // ── Resize ──────────────────────────────────────────────────────────────
    window.addEventListener('resize', () => {
      width  = container.clientWidth;
      height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });
  }
})();
