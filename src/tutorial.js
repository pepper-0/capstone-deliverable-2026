/**
 * Tutorial page: step text in .info-bar, pulsing highlight layer, Back/Next.
 * Requires NucleosomeLevel from common-level.js.
 */
(function () {
  const STEPS = [
    "Welcome to the Epigenetics Game! To start, feel free to explore and interact with the interface below. When ready to proceed with the tutorial, press 'Reset'.",
    'This game represents the concept of *accessibility* of DNA for transcription. You may have encountered DNA transcription in biology class.',
    'What you see in front of you is a strand of DNA. (Highlight all nucleosomes and DNA strands)',
    'These are nucleosomes. They are histone proteins with DNA wrapped around it. (Highlight all nucleosomes)',
    'The DNA wrapped around it can be very tightly packed together, or a bit more loosely. Try adjusting this with the slider! (Highlight the slider at the bottom)',
    "Now, try dragging the RNA polymerase onto the DNA strand to initiate transcription. Try adjusting the slider and see how that affects initiating transcription. (Highlight the RNA polymerase)",
    "RNA polymerase is only able to transcribe when the DNA is *accessible*; in this case, when it's unraveled enough or long enough.",
    "But in real life, we don't use sliders to adjust DNA; we have other mechanisms that affect gene expression. These are *epigenetic* mechanisms.",
    'Try dragging a methyl group or acetyl group onto the DNA strand! What patterns do you observe? (Highlight the methyl group and the acetyl group elements)',
    "These are all the mechanisms and tools you'll need! Press 'Next' to continue to explore.",
  ];

  /** Step index -> highlight mode (omit for no highlight) */
  const HIGHLIGHT_BY_STEP = {
    2: 'dna-structure-bounds',
    3: 'nucleosomes',
    4: 'slider',
    5: 'rna',
    8: 'methyl-acetyl',
  };

  function stripHighlightInstruction(raw) {
    return raw
      .replace(/\s*\([^)]*Highlight[^)]*\)\.?\s*$/i, '')
      .trim();
  }

  function formatStepHtml(raw) {
    let t = stripHighlightInstruction(raw);
    t = t.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    return t;
  }

  function getNucleosomeDnaUnionBounds() {
    const level = document.getElementById('level-container');
    if (!level) return null;
    const els = [...level.querySelectorAll('.nucleosome, .dna-svg')];
    if (els.length === 0) return null;
    let minL = Infinity;
    let minT = Infinity;
    let maxR = -Infinity;
    let maxB = -Infinity;
    for (const el of els) {
      const r = el.getBoundingClientRect();
      minL = Math.min(minL, r.left);
      minT = Math.min(minT, r.top);
      maxR = Math.max(maxR, r.right);
      maxB = Math.max(maxB, r.bottom);
    }
    const w = maxR - minL;
    const h = maxB - minT;
    const cx = minL + w / 2;
    const cy = minT + h / 2;
    const pad = 1.1;
    const size = Math.hypot(w, h) * pad;
    return { cx, cy, size };
  }

  function getHighlightTargets(mode) {
    const level = document.getElementById('level-container');
    if (!level) return [];
    switch (mode) {
      case 'dna-structure-bounds':
        return [];
      case 'nucleosomes':
        return [...level.querySelectorAll('.nucleosome')];
      case 'slider': {
        const w = document.querySelector('.slider-wrapper');
        return w ? [w] : [];
      }
      case 'rna': {
        const w = document.querySelector('.rna-polymerase-wrapper');
        return w ? [w] : [];
      }
      case 'methyl-acetyl': {
        const m = document.querySelector('.methyl-group-wrapper');
        const a = document.querySelector('.acetyl-group-wrapper');
        return [m, a].filter(Boolean);
      }
      default:
        return [];
    }
  }

  class TutorialUI {
    constructor(infoBar, level) {
      this.infoBar = infoBar;
      this.level = level;
      this.stepIndex = 0;
      this.tutorialComplete = false;
      this._layer = null;
      this._rings = [];
      this._posRaf = null;
      this._stopListeners = [];
      this._onResize = this._onResizeBound.bind(this);

      this._buildInfoBar();
      this._ensureLayer();
      this.render();
    }

    _buildInfoBar() {
      this.infoBar.innerHTML = '';
      this.textEl = document.createElement('div');
      this.textEl.className = 'info-bar__text';
      this.actionsEl = document.createElement('div');
      this.actionsEl.className = 'info-bar__actions';
      this.backBtn = document.createElement('button');
      this.backBtn.type = 'button';
      this.backBtn.className = 'info-bar__back';
      this.backBtn.textContent = 'Back';
      this.nextBtn = document.createElement('button');
      this.nextBtn.type = 'button';
      this.nextBtn.className = 'info-bar__next';
      this.nextBtn.textContent = 'Next';
      this.backBtn.addEventListener('click', () => this.goBack());
      this.nextBtn.addEventListener('click', () => this.goNext());
      this.actionsEl.appendChild(this.backBtn);
      this.actionsEl.appendChild(this.nextBtn);
      this.infoBar.appendChild(this.textEl);
      this.infoBar.appendChild(this.actionsEl);
    }

    _ensureLayer() {
      let layer = document.getElementById('tutorial-highlight-layer');
      if (!layer) {
        layer = document.createElement('div');
        layer.id = 'tutorial-highlight-layer';
        document.body.appendChild(layer);
      }
      this._layer = layer;
    }

    _clearRings() {
      this._stopPositionLoop();
      this._removeInteractionWatchers();
      for (const r of this._rings) {
        if (r.parentNode) r.remove();
      }
      this._rings = [];
      if (this._layer) this._layer.innerHTML = '';
    }

    _ringForElement() {
      const ring = document.createElement('div');
      ring.className = 'tutorial-glow-ring';
      this._layer.appendChild(ring);
      this._rings.push(ring);
      return ring;
    }

    _placeRingByCenterAndSize(ring, cx, cy, size) {
      ring.style.width = `${size}px`;
      ring.style.height = `${size}px`;
      ring.style.left = `${cx - size / 2}px`;
      ring.style.top = `${cy - size / 2}px`;
    }

    _layoutRings() {
      const mode = HIGHLIGHT_BY_STEP[this.stepIndex];
      if (this.tutorialComplete || !mode) return;
      if (mode === 'dna-structure-bounds') {
        const b = getNucleosomeDnaUnionBounds();
        if (!b || this._rings.length < 1) return;
        this._placeRingByCenterAndSize(this._rings[0], b.cx, b.cy, b.size);
        return;
      }
      const targets = getHighlightTargets(mode);
      if (targets.length === 0) return;
      for (let i = 0; i < targets.length; i++) {
        const el = targets[i];
        const ring = this._rings[i];
        if (!el || !ring) continue;
        const r = el.getBoundingClientRect();
        const size = Math.max(r.width, r.height) * 1.2;
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        this._placeRingByCenterAndSize(ring, cx, cy, size);
      }
    }

    _startPositionLoop() {
      this._stopPositionLoop();
      this._posLoopActive = true;
      const tick = () => {
        if (!this._posLoopActive) return;
        this._layoutRings();
        this._posRaf = requestAnimationFrame(tick);
      };
      this._posRaf = requestAnimationFrame(tick);
    }

    _stopPositionLoop() {
      this._posLoopActive = false;
      if (this._posRaf != null) {
        cancelAnimationFrame(this._posRaf);
        this._posRaf = null;
      }
    }

    _onResizeBound() {
      this._layoutRings();
    }

    _removeInteractionWatchers() {
      for (const { type, el, fn } of this._stopListeners) {
        el.removeEventListener(type, fn, true);
      }
      this._stopListeners = [];
      window.removeEventListener('resize', this._onResize);
    }

    _armInteractionWatchers(mode) {
      this._removeInteractionWatchers();
      const stop = () => this._onHighlightInteraction();
      if (mode === 'dna-structure-bounds') {
        const level = document.getElementById('level-container');
        if (!level) return;
        const onDown = (e) => {
          if (e.target.closest('.nucleosome') || e.target.closest('.dna-svg')) {
            stop();
          }
        };
        level.addEventListener('mousedown', onDown, true);
        this._stopListeners.push({ type: 'mousedown', el: level, fn: onDown });
        const onTouch = (e) => {
          if (e.target.closest('.nucleosome') || e.target.closest('.dna-svg')) {
            stop();
          }
        };
        level.addEventListener('touchstart', onTouch, true);
        this._stopListeners.push({ type: 'touchstart', el: level, fn: onTouch });
        return;
      }
      if (mode === 'nucleosomes') {
        const level = document.getElementById('level-container');
        if (!level) return;
        const onDown = (e) => {
          if (e.target.closest('.nucleosome')) stop();
        };
        level.addEventListener('mousedown', onDown, true);
        this._stopListeners.push({ type: 'mousedown', el: level, fn: onDown });
        const onTouch = (e) => {
          if (e.target.closest('.nucleosome')) stop();
        };
        level.addEventListener('touchstart', onTouch, true);
        this._stopListeners.push({ type: 'touchstart', el: level, fn: onTouch });
        return;
      }
      if (mode === 'slider') {
        const w = document.querySelector('.slider-wrapper');
        if (!w) return;
        const onDown = (e) => {
          if (e.target.type === 'range' || w.contains(e.target)) stop();
        };
        const onInput = () => stop();
        w.addEventListener('mousedown', onDown, true);
        w.addEventListener('touchstart', onDown, true);
        w.addEventListener('input', onInput, true);
        this._stopListeners.push({ type: 'mousedown', el: w, fn: onDown });
        this._stopListeners.push({ type: 'touchstart', el: w, fn: onDown });
        this._stopListeners.push({ type: 'input', el: w, fn: onInput });
        return;
      }
      if (mode === 'rna') {
        const w = document.querySelector('.rna-polymerase-wrapper');
        if (!w) return;
        const onDown = () => stop();
        w.addEventListener('mousedown', onDown, true);
        w.addEventListener('touchstart', onDown, true);
        this._stopListeners.push({ type: 'mousedown', el: w, fn: onDown });
        this._stopListeners.push({ type: 'touchstart', el: w, fn: onDown });
        return;
      }
      if (mode === 'methyl-acetyl') {
        const pick = (e) => {
          if (e.target.closest('.methyl-group-wrapper') || e.target.closest('.acetyl-group-wrapper')) {
            stop();
          }
        };
        document.addEventListener('mousedown', pick, true);
        document.addEventListener('touchstart', pick, true);
        this._stopListeners.push({ type: 'mousedown', el: document, fn: pick });
        this._stopListeners.push({ type: 'touchstart', el: document, fn: pick });
        return;
      }
    }

    _onHighlightInteraction() {
      for (const r of this._rings) {
        r.classList.add('tutorial-glow-ring--stopped');
      }
      this._stopPositionLoop();
      this._removeInteractionWatchers();
    }

    _startHighlights() {
      this._clearRings();
      if (this.tutorialComplete) return;
      const mode = HIGHLIGHT_BY_STEP[this.stepIndex];
      if (!mode) return;
      if (mode === 'dna-structure-bounds') {
        const ring = this._ringForElement();
        ring.classList.add('tutorial-glow-ring--whole-strand');
      } else {
        const targets = getHighlightTargets(mode);
        for (const el of targets) {
          if (el) this._ringForElement();
        }
      }
      this._layoutRings();
      this._armInteractionWatchers(mode);
      window.addEventListener('resize', this._onResize);
      this._startPositionLoop();
    }

    render() {
      if (this.tutorialComplete) {
        this.textEl.innerHTML = '';
        this.actionsEl.classList.add('info-bar__actions--hidden');
        return;
      }
      this.actionsEl.classList.remove('info-bar__actions--hidden');
      this.textEl.innerHTML = formatStepHtml(STEPS[this.stepIndex] || '');
      this.backBtn.disabled = this.stepIndex === 0;
      this._clearRings();
      requestAnimationFrame(() => this._startHighlights());
    }

    goBack() {
      if (this.tutorialComplete) return;
      if (this.stepIndex <= 0) return;
      this.stepIndex -= 1;
      this.render();
    }

    goNext() {
      if (this.tutorialComplete) return;
      const last = this.stepIndex === STEPS.length - 1;
      if (last) {
        this._finishTutorial();
        return;
      }
      this.stepIndex += 1;
      this.render();
    }

    _finishTutorial() {
      this.tutorialComplete = true;
      this._clearRings();
      this.textEl.innerHTML = '';
      this.actionsEl.classList.add('info-bar__actions--hidden');
      if (this.level && typeof this.level.resetToInitialState === 'function') {
        this.level.resetToInitialState();
      }
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('level-container');
    const infoBar = document.querySelector('.info-bar');
    if (!container) return;
    const level = new NucleosomeLevel(container, { nucleosomeCount: 8, spacing: 120 });
    if (infoBar) {
      new TutorialUI(infoBar, level);
    } else {
      // still run level
    }
  });
})();
