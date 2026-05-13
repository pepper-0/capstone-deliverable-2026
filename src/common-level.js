// Common Level Framework for DNA/Nucleosome Display
class NucleosomeLevel {
  constructor(container, options = {}) {
    this.container = container;
    this.nucleosomeCount = options.nucleosomeCount || 8;
    this.spacing = options.spacing || 120;
    this.nucleosomes = [];
    this.dnaLinks = [];
    this.dnaDragControls = {}; // Store DNA link control points for bending
    this.dnaHoverLinks = {}; // Track hovered DNA links for glow effect
    this.dragOffsets = {}; // Store drag offsets globally
    this.snapBack = true; // Snap-back switch state
    this.sliderMin = 80;
    this.sliderMax = 220;
    this.spacingSliderEl = null;
    this._onResizeSpacing = null;
    this.placedMethyls = [];
    this.placedAcetyls = [];
    this.placedRNAPolymerases = [];
    this.methylCondenseCount = 0;
    this.acetylRelaxCount = 0;
    // Slider + snap-back are hidden by default; only the tutorial enables
    // them for the steps that explicitly teach the slider concept.
    this.sliderVisible = options.showSlider === true;
    this.init();
  }

  init() {
    this.container.innerHTML = '';
    this.levelWrapper = this.container; // For compatibility in code
    this.createNucleosomes();
    this.createSlider();
    this.createRNAPolymerase();
    this.createMethylGroup();
    this.createAcetylGroup();
    this.createResetButton();
  }

  _createMethylDragNode() {
    const dragObj = document.createElement('div');
    dragObj.className = 'methyl-group-drag';
    dragObj.style.position = 'relative';
    dragObj.style.display = 'flex';
    dragObj.style.flexDirection = 'column';
    dragObj.style.alignItems = 'center';
    dragObj.style.cursor = 'grab';
    const methyl = document.createElement('div');
    methyl.className = 'methyl-group-shape';
    methyl.style.width = '34px';
    methyl.style.height = '34px';
    methyl.style.borderRadius = '50%';
    methyl.style.background = 'radial-gradient(circle at 30% 28%, #ffd5dd 15%, #f7a8b5 70%, #ea8da0 100%)';
    methyl.style.border = '2px solid #d97a8e';
    methyl.style.boxShadow = '0 2px 8px rgba(217, 122, 142, 0.22)';
    methyl.style.transition = 'box-shadow 0.2s, border-color 0.2s, transform 0.2s';
    methyl.style.position = 'relative';
    dragObj.appendChild(methyl);
    // Label is overlaid on top of the circle (single line, small font) instead
    // of sitting above it so the badge reads as one combined element.
    const label = document.createElement('div');
    label.textContent = 'Methyl';
    this._styleToolLabel(label, '#7a1f31');
    methyl.appendChild(label);
    return { dragObj, methyl };
  }

  /**
   * Common label styling for the methyl / acetyl / RNA polymerase badges.
   * Centers the text on its parent shape, keeps it on one line, and matches
   * the small font size requested across all three tools.
   */
  _styleToolLabel(label, color) {
    label.style.fontWeight = 'bold';
    label.style.fontSize = '0.65rem';
    label.style.lineHeight = '1';
    label.style.whiteSpace = 'nowrap';
    label.style.textAlign = 'center';
    label.style.position = 'absolute';
    label.style.top = '50%';
    label.style.left = '50%';
    label.style.transform = 'translate(-50%, -50%)';
    label.style.pointerEvents = 'none';
    label.style.color = color;
    label.style.textShadow = '0 0 2px rgba(255,255,255,0.85)';
    label.style.zIndex = '3';
  }

  _createAcetylDragNode() {
    const dragObj = document.createElement('div');
    dragObj.className = 'acetyl-group-drag';
    dragObj.style.position = 'relative';
    dragObj.style.display = 'flex';
    dragObj.style.flexDirection = 'column';
    dragObj.style.alignItems = 'center';
    dragObj.style.cursor = 'grab';

    const acetyl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    acetyl.setAttribute('width', '40');
    acetyl.setAttribute('height', '40');
    // Slight negative margin in the viewBox so the thicker stroke + outline
    // fully fit without being clipped at the SVG edges.
    acetyl.setAttribute('viewBox', '-2 -2 40 40');
    acetyl.classList.add('acetyl-group-shape');
    acetyl.style.overflow = 'visible';
    acetyl.style.display = 'block';

    // Unique gradient id per instance so multiple acetyls in the DOM keep
    // their fills isolated.
    NucleosomeLevel._acetylUid = (NucleosomeLevel._acetylUid || 0) + 1;
    const gradId = `acetyl-grad-${NucleosomeLevel._acetylUid}`;
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    grad.setAttribute('id', gradId);
    grad.setAttribute('x1', '0');
    grad.setAttribute('y1', '0');
    grad.setAttribute('x2', '36');
    grad.setAttribute('y2', '36');
    grad.setAttribute('gradientUnits', 'userSpaceOnUse');
    const stops = [
      { o: '0%', c: '#dcfce7' },
      { o: '45%', c: '#86efac' },
      { o: '100%', c: '#16a34a' },
    ];
    for (const s of stops) {
      const st = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      st.setAttribute('offset', s.o);
      st.setAttribute('stop-color', s.c);
      grad.appendChild(st);
    }
    defs.appendChild(grad);
    acetyl.appendChild(defs);

    const wavyD = 'M4 28 Q10 18 18 28 Q26 38 32 18';
    // Darker outline path (laid down first, slightly thicker).
    const outline = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    outline.setAttribute('d', wavyD);
    outline.setAttribute('stroke', '#14532d');
    outline.setAttribute('stroke-width', '9');
    outline.setAttribute('fill', 'none');
    outline.setAttribute('stroke-linecap', 'round');
    outline.setAttribute('stroke-linejoin', 'round');
    acetyl.appendChild(outline);
    // Gradient-filled center path layered on top.
    const fill = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    fill.setAttribute('d', wavyD);
    fill.setAttribute('stroke', `url(#${gradId})`);
    fill.setAttribute('stroke-width', '6');
    fill.setAttribute('fill', 'none');
    fill.setAttribute('stroke-linecap', 'round');
    fill.setAttribute('stroke-linejoin', 'round');
    acetyl.appendChild(fill);

    dragObj.appendChild(acetyl);

    // Label overlaid centered on the wavy shape, single line, small font.
    const label = document.createElement('div');
    label.textContent = 'Ac';
    this._styleToolLabel(label, '#14532d');
    dragObj.appendChild(label);

    return { dragObj, acetyl };
  }

  /**
   * Acetyl toolbar: infinite drags—each mousedown spawns a new group for the level.
   */
  createAcetylGroup() {
    const toolbar = document.querySelector('.tool-column');
    if (!toolbar) return;
    if (toolbar.querySelector('.acetyl-group-wrapper')) return;

    const outer = document.createElement('div');
    outer.className = 'acetyl-group-wrapper';
    outer.style.position = 'relative';
    outer.style.display = 'flex';
    outer.style.flexDirection = 'column';
    outer.style.alignItems = 'center';
    outer.style.marginBottom = '2rem';
    outer.style.width = '100%';

    const source = document.createElement('div');
    source.className = 'acetyl-group-source';
    const { dragObj: preview, acetyl: prevAc } = this._createAcetylDragNode();
    source.appendChild(preview);
    outer.appendChild(source);
    toolbar.appendChild(outer);

    const bindPreviewHover = () => {
      preview.addEventListener('mouseenter', () => {
        prevAc.style.filter = 'drop-shadow(0 0 10px #22c55e88)';
      });
      preview.addEventListener('mouseleave', () => {
        prevAc.style.filter = '';
      });
    };
    bindPreviewHover();

    const _this = this;
    source.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const { dragObj, acetyl } = _this._createAcetylDragNode();
      const srcRect = source.getBoundingClientRect();
      document.body.appendChild(dragObj);
      dragObj.style.position = 'fixed';
      dragObj.style.zIndex = '2000';
      dragObj.style.left = srcRect.left + 'px';
      dragObj.style.top = srcRect.top + 'px';
      dragObj.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
      const origRect = dragObj.getBoundingClientRect();
      const startX = e.clientX;
      const startY = e.clientY;
      let isDragging = true;

      const onMove = (ev) => {
        if (!isDragging) return;
        const level = document.getElementById('level-container');
        if (!level) return;
        const levelRect = level.getBoundingClientRect();
        const offsetX = ev.clientX - startX;
        const offsetY = ev.clientY - startY;
        let newLeft = origRect.left + offsetX;
        let newTop = origRect.top + offsetY;
        if (
          newLeft + origRect.width > levelRect.left &&
          newLeft < levelRect.right &&
          newTop + origRect.height > levelRect.top &&
          newTop < levelRect.bottom
        ) {
          newLeft = Math.max(levelRect.left, Math.min(newLeft, levelRect.right - origRect.width));
          newTop = Math.max(levelRect.top, Math.min(newTop, levelRect.bottom - origRect.height));
        }
        dragObj.style.left = newLeft + 'px';
        dragObj.style.top = newTop + 'px';
      };

      const onUp = () => {
        if (!isDragging) return;
        isDragging = false;
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        const acetylRect = dragObj.getBoundingClientRect();
        const containerRect = _this.container.getBoundingClientRect();
        const dropX = (acetylRect.left + acetylRect.width / 2) - containerRect.left;
        const dropY = (acetylRect.top + acetylRect.height / 2) - containerRect.top;
        let droppedOnTarget = false;
        let targetElement = null;
        let targetIndex = -1;
        for (let i = 0; i < _this.nucleosomes.length; i++) {
          const nucleosomeRect = _this.nucleosomes[i].getBoundingClientRect();
          if (_this.checkOverlap(acetylRect, nucleosomeRect)) {
            droppedOnTarget = true;
            targetElement = _this.nucleosomes[i];
            targetIndex = i;
            break;
          }
        }
        if (droppedOnTarget) {
          _this._placeStickerOnNucleosome(dragObj, targetElement, targetIndex, dropX, dropY);
          _this.placedAcetyls.push({ dragObj, targetIndex });
          _this._animateRelaxation();
          _this._showNotification('Acetylation: Chromatin relaxed!', true);
        } else {
          _this._returnAcetylDragToSourceAndRemove(dragObj, acetyl, outer);
          _this._showNotification('Acetyl group must be placed on a nucleosome.', false);
        }
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    });
  }

  /**
   * Place acetyl group on nucleosome edge.
   */
  _placeAcetylOnNucleosome(dragObj, nucleosome, nucIdx) {
    dragObj.style.position = 'absolute';
    // Find closest edge point (rightmost for simplicity)
    const nucRect = nucleosome.getBoundingClientRect();
    const containerRect = this.container.getBoundingClientRect();
    const centerX = nucRect.left + nucRect.width / 2 - containerRect.left;
    const centerY = nucRect.top + nucRect.height / 2 - containerRect.top;
    const radius = nucRect.width / 2;
    // Place at right edge
    const edgeX = centerX + radius * 0.95;
    const edgeY = centerY;
    dragObj.style.left = `${edgeX}px`;
    dragObj.style.top = `${edgeY}px`;
    dragObj.style.transform = 'translate(-50%, -50%)';
    this.container.appendChild(dragObj);
    dragObj.dataset.nucleosomeIndex = nucIdx;
    dragObj.dataset.attached = 'true';
  }

  _returnAcetylDragToSourceAndRemove(dragObj, acetyl, sourceOuter) {
    const outer = sourceOuter || document.querySelector('.acetyl-group-wrapper');
    if (!outer) {
      dragObj.remove();
      return;
    }
    dragObj.style.position = 'fixed';
    const currentRect = dragObj.getBoundingClientRect();
    const targetRect = outer.getBoundingClientRect();
    const fromLeft = currentRect.left;
    const fromTop = currentRect.top;
    const targetLeft = targetRect.left;
    const targetTop = targetRect.top;
    let progress = 1;
    const animateBack = () => {
      progress -= 0.08;
      if (progress <= 0) {
        if (acetyl) acetyl.style.filter = '';
        dragObj.remove();
        return;
      }
      dragObj.style.left = (fromLeft * progress + targetLeft * (1 - progress)) + 'px';
      dragObj.style.top = (fromTop * progress + targetTop * (1 - progress)) + 'px';
      requestAnimationFrame(animateBack);
    }
    animateBack();
  }

  /**
   * Methyl toolbar: each drag spawns a new instance; the toolbar preview always remains.
   */
  createMethylGroup() {
    const toolbar = document.querySelector('.tool-column');
    if (!toolbar) return;
    if (toolbar.querySelector('.methyl-group-wrapper')) return;

    const outer = document.createElement('div');
    outer.className = 'methyl-group-wrapper';
    outer.style.position = 'relative';
    outer.style.display = 'flex';
    outer.style.flexDirection = 'column';
    outer.style.alignItems = 'center';
    outer.style.marginBottom = '2rem';
    outer.style.width = '100%';

    const source = document.createElement('div');
    source.className = 'methyl-group-source';
    const { dragObj: preview, methyl: prevM } = this._createMethylDragNode();
    source.appendChild(preview);
    outer.appendChild(source);
    toolbar.appendChild(outer);

    preview.addEventListener('mouseenter', () => {
      prevM.style.boxShadow = '0 0 14px rgba(250, 204, 21, 0.5), 0 0 24px rgba(254, 240, 138, 0.42), 0 2px 10px rgba(217, 122, 142, 0.26)';
      prevM.style.borderColor = '#df738a';
      prevM.style.transform = 'scale(1.03)';
    });
    preview.addEventListener('mouseleave', () => {
      prevM.style.boxShadow = '0 2px 8px rgba(217, 122, 142, 0.22)';
      prevM.style.borderColor = '#d97a8e';
      prevM.style.transform = 'scale(1)';
    });

    const _this = this;
    source.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const { dragObj, methyl } = _this._createMethylDragNode();
      const srcRect = source.getBoundingClientRect();
      document.body.appendChild(dragObj);
      dragObj.style.position = 'fixed';
      dragObj.style.zIndex = '2000';
      dragObj.style.left = srcRect.left + 'px';
      dragObj.style.top = srcRect.top + 'px';
      dragObj.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
      const origRect = dragObj.getBoundingClientRect();
      const startX = e.clientX;
      const startY = e.clientY;
      let isDragging = true;

      const onMove = (ev) => {
        if (!isDragging) return;
        const level = document.getElementById('level-container');
        if (!level) return;
        const levelRect = level.getBoundingClientRect();
        const offsetX = ev.clientX - startX;
        const offsetY = ev.clientY - startY;
        let newLeft = origRect.left + offsetX;
        let newTop = origRect.top + offsetY;
        if (
          newLeft + origRect.width > levelRect.left &&
          newLeft < levelRect.right &&
          newTop + origRect.height > levelRect.top &&
          newTop < levelRect.bottom
        ) {
          newLeft = Math.max(levelRect.left, Math.min(newLeft, levelRect.right - origRect.width));
          newTop = Math.max(levelRect.top, Math.min(newTop, levelRect.bottom - origRect.height));
        }
        dragObj.style.left = newLeft + 'px';
        dragObj.style.top = newTop + 'px';
      };

      const onUp = () => {
        if (!isDragging) return;
        isDragging = false;
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        const methylRect = dragObj.getBoundingClientRect();
        // Drop point translated into the level-container coordinate system,
        // used by the placement helpers below.
        const containerRect = _this.container.getBoundingClientRect();
        const dropX = (methylRect.left + methylRect.width / 2) - containerRect.left;
        const dropY = (methylRect.top + methylRect.height / 2) - containerRect.top;
        let droppedOnTarget = false;
        let targetElement = null;
        let targetIndex = -1;
        let onDNA = false;
        for (let i = 0; i < _this.dnaLinks.length; i++) {
          const dnaLinkRect = _this.dnaLinks[i].getBoundingClientRect();
          if (_this.checkOverlap(methylRect, dnaLinkRect)) {
            droppedOnTarget = true;
            targetElement = _this.dnaLinks[i];
            targetIndex = i;
            onDNA = true;
            break;
          }
        }
        if (!droppedOnTarget) {
          for (let i = 0; i < _this.nucleosomes.length; i++) {
            const nucleosomeRect = _this.nucleosomes[i].getBoundingClientRect();
            if (_this.checkOverlap(methylRect, nucleosomeRect)) {
              droppedOnTarget = true;
              targetElement = _this.nucleosomes[i];
              targetIndex = i;
              break;
            }
          }
        }
        if (droppedOnTarget) {
          if (onDNA) {
            const placement = _this._placeMethylOnDNALink(dragObj, targetElement, targetIndex, dropX, dropY);
            _this.placedMethyls.push({ dragObj, type: 'dna', targetIndex, s: placement.s });
          } else {
            _this._placeStickerOnNucleosome(dragObj, targetElement, targetIndex, dropX, dropY);
            _this.placedMethyls.push({ dragObj, type: 'nucleosome', targetIndex });
          }
          _this._animateCondensation();
          _this._showNotification('Methylation: Chromatin condensed!', true);
        } else {
          _this._returnMethylDragToSourceAndRemove(dragObj, methyl, outer);
          _this._showNotification('Methyl group must be placed on a DNA link or nucleosome.', false);
        }
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    });
  }

  /**
   * Place methyl group on a DNA link at the exact arc-length position
   * closest to the drop point, so multiple methyls can sit at different
   * spots along the same link.
   */
  _placeMethylOnDNALink(dragObj, dnaLink, linkIdx, dropContainerX, dropContainerY) {
    dragObj.style.position = 'absolute';
    const pathData = this._samplePathForLink(linkIdx);
    const idx = this._closestSampleIndex(pathData.samples, dropContainerX, dropContainerY);
    const s = pathData.samples[idx].s;
    this._positionMethylAlongDNALink(dragObj, linkIdx, s, pathData);
    this.container.appendChild(dragObj);
    dragObj.dataset.dnaLinkIndex = linkIdx;
    dragObj.dataset.attached = 'true';
    return { s };
  }

  /**
   * Re-applies the saved arc-length position of a methyl on a DNA link.
   * Reused both during initial placement and from _updateAttachedGroups so
   * the badge tracks the link as it bends/straightens.
   */
  _positionMethylAlongDNALink(dragObj, linkIdx, s, pathData) {
    pathData = pathData || this._samplePathForLink(linkIdx);
    const p = this._sampleAtArcLength(pathData.samples, s);
    dragObj.style.left = `${p.x}px`;
    dragObj.style.top = `${p.y - pathData.geom.dnaLinkThickness / 2 - 18}px`;
    dragObj.style.transform = 'translate(-50%, -50%)';
  }

  /** Read the current rotation (degrees) from a nucleosome's inline transform. */
  _getNucleosomeRotation(nucleosome) {
    const t = nucleosome && nucleosome.style ? nucleosome.style.transform : '';
    const m = t && t.match(/rotate\(([-+]?\d*\.?\d+)deg\)/);
    return m ? parseFloat(m[1]) : 0;
  }

  /**
   * Place a methyl OR acetyl badge anywhere on a nucleosome (wherever the
   * mouse let go), and parent it to the nucleosome so it inherits the
   * nucleosome's CSS rotation and translates with it as the chain animates.
   *
   * The drop point is "unrotated" by the nucleosome's current rotation so
   * the badge sticks to the underlying disc rather than to screen-space.
   */
  _placeStickerOnNucleosome(dragObj, nucleosome, nucIdx, dropContainerX, dropContainerY) {
    const nucSize = 77;
    const radius = nucSize / 2;
    const nucLeft = parseFloat(nucleosome.style.left) || 0;
    const nucTop = parseFloat(nucleosome.style.top) || 0;
    const nucCenterX = nucLeft + radius;
    const nucCenterY = nucTop + radius;

    // Vector from nucleosome center to drop point (container space).
    const dx = dropContainerX - nucCenterX;
    const dy = dropContainerY - nucCenterY;

    // Back out the nucleosome's current rotation so the drop point is
    // expressed in the nucleosome's local (pre-transform) frame.
    const rotRad = this._getNucleosomeRotation(nucleosome) * Math.PI / 180;
    const cos = Math.cos(-rotRad);
    const sin = Math.sin(-rotRad);
    let localDx = dx * cos - dy * sin;
    let localDy = dx * sin + dy * cos;

    // Keep the badge visually pinned to the disc (slightly inside the rim).
    const dist = Math.hypot(localDx, localDy);
    const maxDist = radius * 0.85;
    if (dist > maxDist && dist > 0) {
      localDx = (localDx / dist) * maxDist;
      localDy = (localDy / dist) * maxDist;
    }

    const localX = radius + localDx;
    const localY = radius + localDy;

    dragObj.style.position = 'absolute';
    dragObj.style.left = `${localX}px`;
    dragObj.style.top = `${localY}px`;
    dragObj.style.transform = 'translate(-50%, -50%)';
    dragObj.style.zIndex = '5';
    nucleosome.appendChild(dragObj);
    dragObj.dataset.nucleosomeIndex = nucIdx;
    dragObj.dataset.attached = 'true';
  }

  _returnMethylDragToSourceAndRemove(dragObj, methyl, sourceOuter) {
    const outer = sourceOuter || document.querySelector('.methyl-group-wrapper');
    if (!outer) {
      dragObj.remove();
      return;
    }
    dragObj.style.position = 'fixed';
    const currentRect = dragObj.getBoundingClientRect();
    const targetRect = outer.getBoundingClientRect();
    const fromLeft = currentRect.left;
    const fromTop = currentRect.top;
    const targetLeft = targetRect.left;
    const targetTop = targetRect.top;
    let progress = 1;
    const animateBack = () => {
      progress -= 0.08;
      if (progress <= 0) {
        if (methyl) {
          methyl.style.boxShadow = '';
          methyl.style.borderColor = '';
        }
        dragObj.remove();
        return;
      }
      dragObj.style.left = (fromLeft * progress + targetLeft * (1 - progress)) + 'px';
      dragObj.style.top = (fromTop * progress + targetTop * (1 - progress)) + 'px';
      requestAnimationFrame(animateBack);
    }
    animateBack();
  }
  /**
   * Smoothly tween this.spacing toward toVal so the DNA structure visibly
   * tightens/loosens just like the slider being dragged.
   * Cancels any in-flight tween and resumes from the current visual spacing
   * so multiple drops chain naturally.
   */
  _animateSpacingTransition(toVal, durationMs = 500) {
    if (this._spacingAnimFrame) {
      cancelAnimationFrame(this._spacingAnimFrame);
      this._spacingAnimFrame = null;
    }
    const fromVal = this.spacing;
    if (Math.abs(fromVal - toVal) < 0.05) {
      this.spacing = toVal;
      if (this.spacingSliderEl) this.spacingSliderEl.value = String(toVal);
      this.updateSpacing(this.dragOffsets);
      return;
    }
    const startTime = performance.now();
    const animate = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / durationMs);
      // ease-out cubic for a smooth, natural feel similar to dragging the slider
      const eased = 1 - Math.pow(1 - t, 3);
      this.spacing = fromVal + (toVal - fromVal) * eased;
      if (this.spacingSliderEl) {
        this.spacingSliderEl.value = String(this.spacing);
      }
      this.updateSpacing(this.dragOffsets);
      if (t < 1) {
        this._spacingAnimFrame = requestAnimationFrame(animate);
      } else {
        this.spacing = toVal;
        if (this.spacingSliderEl) this.spacingSliderEl.value = String(toVal);
        this.updateSpacing(this.dragOffsets);
        this._spacingAnimFrame = null;
      }
    };
    this._spacingAnimFrame = requestAnimationFrame(animate);
  }

  /** Animate condensation (slider up, DNA tightens) */
  _animateCondensation() {
    // Each methyl group increases tightening
    this.methylCondenseCount++;
    // Increment is reduced (~40% less than the previous 10px step) so each
    // drop produces a more subtle condensation that smoothly tweens.
    if (this._spacingTarget == null) this._spacingTarget = this.spacing;
    this._spacingTarget = Math.max(this.sliderMin, this._spacingTarget - 6);
    this._animateSpacingTransition(this._spacingTarget, 500);
    // Animate slider visually (move up)
    const sliderWrapper = document.querySelector('.slider-wrapper');
    if (sliderWrapper) {
      sliderWrapper.classList.add('condense-anim');
      setTimeout(() => sliderWrapper.classList.remove('condense-anim'), 400);
    }
  }

  /** Animate relaxation (slider down, DNA loosens) */
  _animateRelaxation() {
    this.acetylRelaxCount++;
    if (this._spacingTarget == null) this._spacingTarget = this.spacing;
    this._spacingTarget = Math.min(this.sliderMax, this._spacingTarget + 6);
    this._animateSpacingTransition(this._spacingTarget, 500);
    const sliderWrapper = document.querySelector('.slider-wrapper');
    if (sliderWrapper) {
      sliderWrapper.classList.add('relax-anim');
      setTimeout(() => sliderWrapper.classList.remove('relax-anim'), 400);
    }
  }
  /**
   * Reset all placed elements (methyl, acetyl, RNA polymerase) from the level.
   */
  createResetButton() {
    const toolbar = document.querySelector('.tool-column');
    if (!toolbar) return;
    if (toolbar.querySelector('.reset-btn-wrapper')) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'reset-btn-wrapper';
    const btn = document.createElement('button');
    btn.textContent = 'Reset';
    btn.className = 'reset-btn';
    btn.style.background = '#f87171';
    btn.style.color = '#fff';
    btn.style.border = 'none';
    btn.style.borderRadius = '8px';
    btn.style.padding = '0.5em 1.2em';
    btn.style.fontWeight = 'bold';
    btn.style.fontSize = '1rem';
    btn.style.cursor = 'pointer';
    btn.style.boxShadow = '0 2px 8px rgba(248,113,113,0.13)';
    btn.style.transition = 'background 0.2s';
    btn.addEventListener('mouseenter', () => btn.style.background = '#dc2626');
    btn.addEventListener('mouseleave', () => btn.style.background = '#f87171');
    btn.onclick = () => this._resetPlacedElements();
    wrapper.appendChild(btn);
    toolbar.appendChild(wrapper);
  }

  /**
   * Reset level contents (placements, slider) to the initial state. Used by UI Reset and the tutorial.
   * @param {{ silent?: boolean }} [opts] — if silent, do not show the "Reset complete" notification
   */
  _resetPlacedElements(opts = {}) {
    // Remove all methyls
    for (const m of this.placedMethyls) {
      if (m.dragObj.parentNode) m.dragObj.parentNode.removeChild(m.dragObj);
    }
    this.placedMethyls = [];
    // Remove all acetyls
    for (const a of this.placedAcetyls) {
      if (a.dragObj.parentNode) a.dragObj.parentNode.removeChild(a.dragObj);
    }
    this.placedAcetyls = [];
    // Remove all RNA polymerases
    const rnaPolymerases = this.container.querySelectorAll('.rna-polymerase-drag');
    rnaPolymerases.forEach(el => {
      if (el.parentNode) el.parentNode.removeChild(el);
    });
    // Cancel any in-flight spacing tween so reset is immediate.
    if (this._spacingAnimFrame) {
      cancelAnimationFrame(this._spacingAnimFrame);
      this._spacingAnimFrame = null;
    }
    // Reset slider to default
    this.spacing = 120;
    this._spacingTarget = 120;
    if (this.spacingSliderEl) {
      this.spacingSliderEl.value = String(this.spacing);
    }
    this.updateSpacing();
    this.methylCondenseCount = 0;
    this.acetylRelaxCount = 0;
    if (!opts.silent) {
      this._showNotification('Reset complete.', true);
    }
  }

  /** Public reset (e.g. tutorial end) without notification. */
  resetToInitialState() {
    this._resetPlacedElements({ silent: true });
  }

  /**
   * Show or hide the spacing slider + snap-back toggle. Used by the tutorial
   * to expose the slider only for the steps that introduce it, and to remove
   * it for the later epigenetic-mechanism steps and for levels 1-3.
   */
  setSliderVisible(visible) {
    this.sliderVisible = !!visible;
    if (this.sliderWrapperEl) {
      this.sliderWrapperEl.style.display = visible ? '' : 'none';
    }
    // Available area inside .level-container changes when the bottom strip
    // shrinks/grows, so re-run layout to keep the chain centered.
    requestAnimationFrame(() => this.updateSpacing(this.dragOffsets));
  }

  _updateAttachedGroups() {
    // DNA-attached methyls re-trace their stored arc-length so they slide
    // smoothly with the link as it bends or the chain tightens/loosens.
    for (const m of this.placedMethyls) {
      if (m.type === 'dna') {
        this._positionMethylAlongDNALink(m.dragObj, m.targetIndex, m.s);
      }
      // Nucleosome-attached methyls/acetyls are DOM children of the
      // nucleosome and inherit its translation + rotation automatically.
    }
  }

  createRNAPolymerase() {
    const _this = this; // Capture 'this' for use in nested functions.
    // Find toolbar
    const toolbar = document.querySelector('.tool-column');
    if (!toolbar) return;
    this.rnaPolymeraseToolbar = toolbar; // Store toolbar reference
    // Remove any existing polymerase
    if (toolbar.querySelector('.rna-polymerase-wrapper')) toolbar.querySelector('.rna-polymerase-wrapper').remove();
    // Wrapper for drag logic
    const wrapper = document.createElement('div');
    wrapper.className = 'rna-polymerase-wrapper';
    wrapper.style.position = 'relative';
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.alignItems = 'center';
    wrapper.style.marginBottom = '2rem';

    // Draggable object (contains label and shape)
    const dragObj = document.createElement('div');
    dragObj.className = 'rna-polymerase-drag';
    this.rnaPolymeraseDragObj = dragObj; // Store reference to drag object
    dragObj.style.position = 'relative';
    dragObj.style.display = 'flex';
    dragObj.style.flexDirection = 'column';
    dragObj.style.alignItems = 'center';
    dragObj.style.cursor = 'grab';

    // Oblong shape
    const rna = document.createElement('div');
    rna.className = 'rna-polymerase';
    rna.style.width = '80px';
    rna.style.height = '36px';
    rna.style.borderRadius = '22px/18px';
    rna.style.background = 'linear-gradient(90deg, #fef08a 70%, #fde047 100%)';
    rna.style.border = '2.5px solid #eab308';
    rna.style.boxShadow = '0 2px 8px rgba(200,180,60,0.13)';
    rna.style.position = 'relative';
    rna.style.display = 'flex';
    rna.style.alignItems = 'center';
    rna.style.justifyContent = 'center';
    rna.style.transition = 'box-shadow 0.2s, border 0.2s';
    dragObj.appendChild(rna);

    // Label is overlaid centered on the shape (single line, small font), so
    // the badge reads as one combined element instead of label-on-top-of-shape.
    const label = document.createElement('div');
    label.textContent = 'RNA Polymerase';
    this._styleToolLabel(label, '#713f12');
    rna.appendChild(label);

    wrapper.appendChild(dragObj);
    toolbar.appendChild(wrapper);

    // Drag logic
    let isDragging = false;
    let startX = 0, startY = 0;
    let origRect = null;
    let offsetX = 0, offsetY = 0;
    let animFrame;
    let startToolbarRect = null;

    dragObj.addEventListener('mouseenter', () => {
      rna.style.boxShadow = '0 0 12px rgba(250, 204, 21, 0.48), 0 0 20px rgba(254, 240, 138, 0.4), 0 2px 8px rgba(200,180,60,0.2)';
      rna.style.borderColor = '#facc15';
    });
    dragObj.addEventListener('mouseleave', () => {
      if (!isDragging) {
        rna.style.boxShadow = '0 2px 8px rgba(200,180,60,0.13)';
        rna.style.borderColor = '#eab308';
      }
    });

    dragObj.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      origRect = dragObj.getBoundingClientRect();
      startToolbarRect = wrapper.getBoundingClientRect();
      dragObj.style.zIndex = 1000;
      dragObj.style.cursor = 'grabbing';
      dragObj.style.position = 'fixed';
      dragObj.style.left = origRect.left + 'px';
      dragObj.style.top = origRect.top + 'px';
      document.body.style.userSelect = 'none';
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    });

    const onMove = (e) => {
      if (!isDragging) return;
      offsetX = e.clientX - startX;
      offsetY = e.clientY - startY;
      // Restrict to level-container bounds during drag
      const level = document.getElementById('level-container');
      const levelRect = level.getBoundingClientRect();
      let newLeft = origRect.left + offsetX;
      let newTop = origRect.top + offsetY;
      // Clamp only if inside level-container
      if (
        newLeft + origRect.width > levelRect.left &&
        newLeft < levelRect.right &&
        newTop + origRect.height > levelRect.top &&
        newTop < levelRect.bottom
      ) {
        newLeft = Math.max(levelRect.left, Math.min(newLeft, levelRect.right - origRect.width));
        newTop = Math.max(levelRect.top, Math.min(newTop, levelRect.bottom - origRect.height));
      }
      dragObj.style.left = newLeft + 'px';
      dragObj.style.top = newTop + 'px';
    }

    const onUp = (e) => {
      if (!isDragging) return;
      isDragging = false;
      dragObj.style.cursor = 'grab';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);

      const rnaPolymeraseRect = dragObj.getBoundingClientRect();
      let droppedOnTarget = false;
      let targetElement = null;
      let targetIndex = -1;

      // Check overlap with DNA links
      for (let i = 0; i < _this.dnaLinks.length; i++) {
        const dnaLinkRect = _this.dnaLinks[i].getBoundingClientRect();
        if (_this.checkOverlap(rnaPolymeraseRect, dnaLinkRect)) {
          droppedOnTarget = true;
          targetElement = _this.dnaLinks[i];
          targetIndex = i;
          console.log(`RNA Polymerase dropped on DNA Link ${i}`);
          break;
        }
      }

      // If not dropped on a DNA link, check overlap with nucleosomes
      if (!droppedOnTarget) {
        for (let i = 0; i < _this.nucleosomes.length; i++) {
          const nucleosomeRect = _this.nucleosomes[i].getBoundingClientRect();
          if (_this.checkOverlap(rnaPolymeraseRect, nucleosomeRect)) {
            droppedOnTarget = true;
            targetElement = _this.nucleosomes[i];
            targetIndex = i;
            console.log(`RNA Polymerase dropped on Nucleosome ${i}`);
            break;
          }
        }
      }

      if (droppedOnTarget) {
        const rnaPolymeraseWidth = 80; // From rna.style.width
        const movementDistance = 2 * rnaPolymeraseWidth;

        let proceedWithTranscription = false;
        let dropInfo = null;

        if (targetElement.classList.contains('dna-svg')) { // It's a DNA link
          // Project the polymerase center onto the link's path and check
          // that the *remaining* path (from drop point to the far end) is
          // long enough to actually transcribe — this lets the player drop
          // mid-link rather than only at the start.
          const containerRect = _this.container.getBoundingClientRect();
          const dropPx = (rnaPolymeraseRect.left + rnaPolymeraseRect.width / 2) - containerRect.left;
          const dropPy = (rnaPolymeraseRect.top + rnaPolymeraseRect.height / 2) - containerRect.top;
          const pathData = _this._samplePathForLink(targetIndex);
          const startIdx = _this._closestSampleIndex(pathData.samples, dropPx, dropPy);
          const startSample = pathData.samples[startIdx];
          const remainingLength = pathData.totalLength - startSample.s;
          if (remainingLength > movementDistance) {
            console.log(`DNA Link ${targetIndex}: remaining path ${remainingLength.toFixed(2)}px from drop point is sufficient (>${movementDistance}px).`);
            proceedWithTranscription = true;
            dropInfo = { startS: startSample.s, totalLength: pathData.totalLength, samples: pathData.samples };
          } else {
            console.log(`DNA Link ${targetIndex}: remaining path ${remainingLength.toFixed(2)}px from drop point is too short (need >${movementDistance}px).`);
          }
        } else { // It's a nucleosome
          console.log(`RNA Polymerase dropped on Nucleosome ${targetIndex}. Proceeding with transcription.`);
          proceedWithTranscription = true;
        }

        if (proceedWithTranscription) {
          console.log("RNA Polymerase successfully dropped on a target. Initiating transcription sequence.");
          dragObj.style.zIndex = '100';
          rna.style.boxShadow = '0 2px 8px rgba(200,180,60,0.13)';
          rna.style.borderColor = '#eab308';

          _this.rnaPolymeraseToolbar.querySelector('.rna-polymerase-wrapper').removeChild(dragObj);
          _this.container.appendChild(dragObj);

          _this._placeRNAPolymeraseOnTarget(dragObj, rnaPolymeraseRect, targetElement, targetIndex, dropInfo);
          _this._animateTranscription(dragObj);
          _this._showNotification("Transcription Successful!", true);
        } else {
          _this._returnRnaPolymeraseToToolbar(dragObj);
          _this._showNotification("Transcription Unsuccessful. DNA link too short.", false);
        }
      } else {
        _this._returnRnaPolymeraseToToolbar(dragObj);
        _this._showNotification("Transcription Unsuccessful. No valid target.", false);
      }
    }
  }

  createNucleosomes() {
    // Zig-zag pattern: alternate up/down, and store positions for tangency
    const nucRadius = 38.5;
    this.nucPositions = [];
    for (let i = 0; i < this.nucleosomeCount; i++) {
      this.nucPositions.push({ x: 0, y: 0 }); // Initialize with dummy y; will be set in updateSpacing
      // DNA Link (except first)
      if (i > 0) {
        // Use SVG for tangential DNA line, add directly to container
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'dna-svg');
        svg.style.position = 'absolute';
        svg.style.overflow = 'visible';
        svg.style.zIndex = 1;
        svg.style.cursor = 'grab';
        svg.dataset.index = i - 1;
        this.container.appendChild(svg);
        this.dnaLinks.push(svg);
        this.makeDNALinkInteractive(svg);
      }
      // Nucleosome: single core circle with crosshair + dual outlines
      const nuc = document.createElement('div');
      nuc.className = 'nucleosome';
      nuc.dataset.index = i;
      nuc.style.position = 'absolute';
      nuc.style.width = '77px';
      nuc.style.height = '77px';
      nuc.style.display = 'flex';
      nuc.style.alignItems = 'center';
      nuc.style.justifyContent = 'center';

      const core = document.createElement('div');
      core.style.position = 'absolute';
      core.style.width = '77px';
      core.style.height = '77px';
      core.style.borderRadius = '50%';
      core.style.background = 'radial-gradient(circle at 60% 40%, #b6c6e2 60%, #6b7fa6 100%)';
      core.style.border = '4px solid #4a5a7a'; // inner outline (non-DNA blue)
      core.style.boxSizing = 'border-box';
      core.style.overflow = 'hidden';
      core.style.zIndex = 2;

      const horizontalLine = document.createElement('div');
      horizontalLine.style.position = 'absolute';
      horizontalLine.style.left = '0';
      horizontalLine.style.right = '0';
      horizontalLine.style.top = '50%';
      horizontalLine.style.height = '2px';
      horizontalLine.style.transform = 'translateY(-50%)';
      horizontalLine.style.background = '#707d96';
      horizontalLine.style.borderRadius = '999px';
      core.appendChild(horizontalLine);

      const verticalLine = document.createElement('div');
      verticalLine.style.position = 'absolute';
      verticalLine.style.top = '0';
      verticalLine.style.bottom = '0';
      verticalLine.style.left = '50%';
      verticalLine.style.width = '2px';
      verticalLine.style.transform = 'translateX(-50%)';
      verticalLine.style.background = '#707d96';
      verticalLine.style.borderRadius = '999px';
      core.appendChild(verticalLine);
      nuc.appendChild(core);

      const dnaOutline = document.createElement('div');
      dnaOutline.style.position = 'absolute';
      dnaOutline.style.left = '-4px';
      dnaOutline.style.top = '-4px';
      dnaOutline.style.width = '77px';
      dnaOutline.style.height = '77px';
      dnaOutline.style.borderRadius = '50%';
      dnaOutline.style.border = '4px solid #3b82f6';
      dnaOutline.style.boxSizing = 'content-box';
      dnaOutline.style.pointerEvents = 'none';
      dnaOutline.style.zIndex = 1;
      nuc.appendChild(dnaOutline);
      this.container.appendChild(nuc);
      this.nucleosomes.push(nuc);
      this.makeDraggable(nuc, 'nucleosome');
    }
  }

  createSlider() {
    const sliderWrapper = document.createElement('div');
    sliderWrapper.className = 'slider-wrapper';
    sliderWrapper.style.display = 'flex';
    sliderWrapper.style.alignItems = 'center';

    // Slider
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = this.sliderMin;
    slider.max = this.sliderMax;
    slider.value = this.spacing;
    slider.step = 1;
    sliderWrapper.appendChild(slider);
    this.spacingSliderEl = slider;
    this.updateSliderBoundsFromContainer();
    this._onResizeSpacing = () => this.updateSliderBoundsFromContainer();
    window.addEventListener('resize', this._onResizeSpacing);

    // Snap-back switch
    const switchLabel = document.createElement('label');
    switchLabel.style.display = 'flex';
    switchLabel.style.alignItems = 'center';
    switchLabel.style.marginLeft = '1.5rem';
    switchLabel.style.userSelect = 'none';
    switchLabel.style.fontSize = '1rem';
    switchLabel.innerHTML = '<span style="margin-right:0.5em;">Snap Back</span>';
    const snapSwitch = document.createElement('input');
    snapSwitch.type = 'checkbox';
    snapSwitch.checked = true;
    snapSwitch.style.width = '22px';
    snapSwitch.style.height = '22px';
    snapSwitch.style.marginRight = '0.5em';
    switchLabel.appendChild(snapSwitch);
    sliderWrapper.appendChild(switchLabel);

    const levelControlsHost = document.querySelector('.level-bottom-controls') || this.container;
    levelControlsHost.appendChild(sliderWrapper);
    this.sliderWrapperEl = sliderWrapper;
    if (!this.sliderVisible) {
      sliderWrapper.style.display = 'none';
    }

    slider.addEventListener('input', (e) => {
      this.spacing = parseInt(e.target.value);
      // Keep the drop-target spacing synced with manual slider use, so a later
      // methyl/acetyl drop steps from the user's chosen value (not a stale one).
      this._spacingTarget = this.spacing;
      if (this._spacingAnimFrame) {
        cancelAnimationFrame(this._spacingAnimFrame);
        this._spacingAnimFrame = null;
      }
      this.updateSpacing();
    });

    snapSwitch.addEventListener('change', (e) => {
      this.snapBack = snapSwitch.checked;
      if (this.snapBack) {
        // Reset all drag offsets to zero and update positions
        this.dragOffsets = {};
        this.dnaDragControls = {};
        this.updateSpacing();
      }
    });

    this.updateSpacing();
  }

  /** Horizontal footprint of one nucleosome (box + DNA ring). */
  getNucleosomeFootprintWidth() {
    return 85;
  }

  /** Max spacing so the whole chain fits inside the level container width. */
  computeMaxSpacingForContainer() {
    const w = this.container.getBoundingClientRect().width || 900;
    const n = this.nucleosomeCount;
    const foot = this.getNucleosomeFootprintWidth();
    if (n <= 1) return Math.max(this.sliderMin + 1, 220);
    const raw = (w - foot) / (n - 1);
    return Math.max(this.sliderMin + 1, Math.floor(raw));
  }

  updateSliderBoundsFromContainer() {
    const maxS = this.computeMaxSpacingForContainer();
    this.sliderMax = maxS;
    if (this.spacingSliderEl) {
      this.spacingSliderEl.max = String(maxS);
      if (this.spacing > maxS) {
        this.spacing = maxS;
        this.spacingSliderEl.value = String(maxS);
      }
    }
  }

  updateSpacing(offsets = {}) {
    // offsets: { [index]: {dx, dy} } for nucleosome drag
    // Center the nucleosome chain in the level-container
    this.updateSliderBoundsFromContainer();
    const containerRect = this.container.getBoundingClientRect();
    const nucRadius = 38.5; // Define nucRadius once at the top of the function

    const verticalPadding = 20; // Padding from top/bottom of the container
    const availableHeight = (containerRect.height || 220) - (2 * nucRadius) - (2 * verticalPadding);

    // Calculate amplitude based on slider spacing
    const minSpacing = this.sliderMin;
    const maxSpacing = this.sliderMax;
    const currentSpacing = this.spacing;

    const minVerticalAmplitude = 10; // Minimum amplitude when spacing is at sliderMin
    const maxVerticalAmplitude = Math.max(0, availableHeight / 2); // Maximum amplitude when spacing is at sliderMax

    // Normalize currentSpacing between 0 and 1
    let normalizedSpacing = (currentSpacing - minSpacing) / (maxSpacing - minSpacing);
    normalizedSpacing = Math.max(0, Math.min(1, normalizedSpacing)); // Clamp between 0 and 1

    // Interpolate amplitude
    const amplitude = minVerticalAmplitude + (maxVerticalAmplitude - minVerticalAmplitude) * normalizedSpacing;
    // Center the chain vertically by accounting for the nucleosome's own
    // height (baseY is the top-left y of each nucleosome, not its center)
    // and bias slightly upward so the zig-zag never crosses into the
    // .level-bottom-controls strip below.
    const extraUpShift = 12;
    const baseY = ((containerRect.height || 220) / 2) - nucRadius - extraUpShift;

    const totalWidth = (this.nucleosomeCount - 1) * this.spacing;
    // Slight leftward bias keeps the rightmost nucleosome (and any acetyl/
    // methyl pinned to its right edge) clear of the level-container border.
    const extraLeftShift = 18;
    const centerX = ((containerRect.width || 900) / 2) - extraLeftShift;
    let x0 = centerX - totalWidth / 2;
    this.currentLinkLengths = new Array(Math.max(0, this.nucleosomeCount - 1)).fill(0);
    const restLinkLengths = new Array(Math.max(0, this.nucleosomeCount - 1)).fill(0);
    const minSpacingStraightLengths = new Array(Math.max(0, this.nucleosomeCount - 1)).fill(0);
    const sMin = this.sliderMin;
    const totalWidthMin = (this.nucleosomeCount - 1) * sMin;
    const x0Min = centerX - totalWidthMin / 2;
    const nLinks = Math.max(0, this.nucleosomeCount - 1);
    const actualRightAttach = new Array(nLinks);
    const restRightAttach = new Array(nLinks);
    const minRightAttach = new Array(nLinks);
    for (let i = 0; i < this.nucleosomes.length; i++) {
      // Calculate base position centered
      let x = x0 + i * this.spacing;
      this.nucPositions[i].x = x;
      // Apply drag offset if present (no clamping here)
      let dx = offsets[i]?.dx || 0;
      let dy = offsets[i]?.dy || 0;
      // Calculate zig-zag Y dynamically based on amplitude
      const y = baseY + (i % 2 === 0 ? -amplitude : amplitude);
      this.nucPositions[i].y = y; // Update nucPositions with dynamic Y
      let nx = x + dx;
      let ny = y + dy; // Use the dynamic Y
      this.nucleosomes[i].style.left = nx + 'px';
      this.nucleosomes[i].style.top = ny + 'px';
      // Update DNA connector
      if (i > 0) {
        // Left link: tangent point on left nucleosome; right link: antipodal point on right nucleosome
        const prevX = this.nucPositions[i - 1].x + (offsets[i - 1]?.dx || 0);
        const prevY = this.nucPositions[i - 1].y + (offsets[i - 1]?.dy || 0);
        const currX = x + dx;
        const currY = this.nucPositions[i].y + dy;
        const svg = this.dnaLinks[i - 1];
        const linkIndex = i - 1;
        const control = this.dnaDragControls[linkIndex];
        const isHovered = !!this.dnaHoverLinks[linkIndex];
        const isBent = !!control;

        // Get tangent point on left nucleosome
        const cxPrev = prevX + nucRadius;
        const cyPrev = prevY + nucRadius;
        const cxCurr = currX + nucRadius;
        const cyCurr = currY + nucRadius;
        // Angle from left to right
        const dxC = cxCurr - cxPrev;
        const dyC = cyCurr - cyPrev;
        const dC = Math.hypot(dxC, dyC) || 1e-9;
        const ux = dxC / dC;
        const uy = dyC / dC;
        const nx = -uy;
        const ny = ux;
        const side = (linkIndex % 2 === 0) ? -1 : 1;
        // Left tangent point (now left endpoint)
        const x1 = cxPrev + side * nucRadius * nx;
        const y1 = cyPrev + side * nucRadius * ny;
        // Right endpoint (now right endpoint)
        const x2 = cxCurr - side * nucRadius * nx;
        const y2 = cyCurr - side * nucRadius * ny;

        const controlX = control ? control.x : (x1 + x2) / 2;
        const controlY = control ? control.y : (y1 + y2) / 2;

        let c1absX;
        let c1absY;
        let c2absX;
        let c2absY;
        if (isBent) {
          const Lseg = this.distance(x1, y1, x2, y2) || 1e-9;
          const ux2 = (x2 - x1) / Lseg;
          const uy2 = (y2 - y1) / Lseg;
          const px2 = -uy2;
          const py2 = ux2;
          const midAbsX = (x1 + x2) / 2;
          const midAbsY = (y1 + y2) / 2;
          const pullAbsX = controlX - midAbsX;
          const pullAbsY = controlY - midAbsY;
          const lateral = pullAbsX * px2 + pullAbsY * py2;
          const tanLen = Math.max(18, Lseg * 0.28);
          c1absX = x1 + ux2 * tanLen + px2 * lateral * 0.65;
          c1absY = y1 + uy2 * tanLen + py2 * lateral * 0.65;
          c2absX = x2 - ux2 * tanLen + px2 * lateral * 0.65;
          c2absY = y2 - uy2 * tanLen + py2 * lateral * 0.65;
        } else {
          c1absX = (x1 + x2) / 2;
          c1absY = (y1 + y2) / 2;
          c2absX = c1absX;
          c2absY = c1absY;
        }

        // Position SVG at (min x/y of endpoints + control point)
        const minX = Math.min(x1, x2, controlX, c1absX, c2absX);
        const minY = Math.min(y1, y2, controlY, c1absY, c2absY);
        const maxX = Math.max(x1, x2, controlX, c1absX, c2absX);
        const maxY = Math.max(y1, y2, controlY, c1absY, c2absY);
        svg.style.left = minX + 'px';
        svg.style.top = minY + 'px';
        svg.setAttribute('width', Math.max(2, maxX - minX + 2));
        svg.setAttribute('height', Math.max(2, maxY - minY + 2));
        svg.innerHTML = '';
        const startX = x1 - minX + 1;
        const startY = y1 - minY + 1;
        const endX = x2 - minX + 1;
        const endY = y2 - minY + 1;
        const c1x = c1absX - minX + 1;
        const c1y = c1absY - minY + 1;
        const c2x = c2absX - minX + 1;
        const c2y = c2absY - minY + 1;
        const pathD = isBent
          ? `M ${startX} ${startY} C ${c1x} ${c1y} ${c2x} ${c2y} ${endX} ${endY}`
          : `M ${startX} ${startY} L ${endX} ${endY}`;
        this.currentLinkLengths[linkIndex] = isBent
          ? this.approximateCubicLength(x1, y1, c1absX, c1absY, c2absX, c2absY, x2, y2)
          : this.distance(x1, y1, x2, y2);

        const hitPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        hitPath.setAttribute('d', pathD);
        hitPath.setAttribute('stroke', 'transparent');
        hitPath.setAttribute('stroke-width', '18');
        hitPath.setAttribute('fill', 'none');
        hitPath.setAttribute('stroke-linecap', 'round');
        hitPath.style.pointerEvents = 'stroke';
        svg.appendChild(hitPath);

        const visiblePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        visiblePath.setAttribute('d', pathD);
        visiblePath.setAttribute('stroke', isHovered ? '#60a5fa' : '#3b82f6');
        visiblePath.setAttribute('stroke-width', '4.5');
        visiblePath.setAttribute('fill', 'none');
        visiblePath.setAttribute('stroke-linecap', 'round');
        svg.appendChild(visiblePath);
        svg.style.filter = isHovered
          ? 'drop-shadow(0 0 8px rgba(250, 204, 21, 0.55)) drop-shadow(0 0 14px rgba(254, 240, 138, 0.45))'
          : 'none';
      }
    }

    // Rotate nucleosomes: drag/bend vs straight-at-current-spacing, plus slider vs min-spacing layout.
    const rotationScaleDegPerPx = 0.85;
    const tieEpsilon = 0.3;
    const combineLinkDeltas = (hasLeft, hasRight, leftD, rightD) => {
      const leftActive = hasLeft && Math.abs(leftD) > tieEpsilon;
      const rightActive = hasRight && Math.abs(rightD) > tieEpsilon;
      let rot = 0;
      if (leftActive && rightActive && Math.sign(leftD) === Math.sign(rightD)) {
        rot = leftD * rotationScaleDegPerPx;
      } else {
        if (leftActive) rot += leftD * rotationScaleDegPerPx;
        if (rightActive) rot -= rightD * rotationScaleDegPerPx;
      }
      return rot;
    };
    for (let i = 0; i < this.nucleosomes.length; i++) {
      const hasLeft = i > 0;
      const hasRight = i < this.nucleosomes.length - 1;
      const leftDrag = hasLeft ? (this.currentLinkLengths[i - 1] - restLinkLengths[i - 1]) : 0;
      const rightDrag = hasRight ? (this.currentLinkLengths[i] - restLinkLengths[i]) : 0;
      const leftLayout = hasLeft ? (restLinkLengths[i - 1] - minSpacingStraightLengths[i - 1]) : 0;
      const rightLayout = hasRight ? (restLinkLengths[i] - minSpacingStraightLengths[i]) : 0;
      const rotationDeg =
        combineLinkDeltas(hasLeft, hasRight, leftDrag, rightDrag) +
        combineLinkDeltas(hasLeft, hasRight, leftLayout, rightLayout);
      this.nucleosomes[i].style.transform = `rotate(${rotationDeg}deg)`;
    }

    // Update wrapped DNA to match connector thickness
    for (let i = 0; i < this.nucleosomes.length; i++) {
      const wrapped = this.nucleosomes[i].querySelector('.dna-wrapped');
      if (wrapped) {
        wrapped.style.borderWidth = '6px';
        wrapped.style.height = '35.2px';
        wrapped.style.opacity = '0.8';
      }
    }
    this._updateAttachedGroups();
  }

  makeDraggable(element, type) {
    let isDragging = false;
    let startX = 0, startY = 0;
    let origX = 0, origY = 0;
    let animFrame;
    element.addEventListener('mouseenter', () => {
      element.style.filter = 'drop-shadow(0 0 8px rgba(250, 204, 21, 0.55)) drop-shadow(0 0 14px rgba(254, 240, 138, 0.45))';
    });
    element.addEventListener('mouseleave', () => {
      if (!isDragging) {
        element.style.filter = '';
      }
    });
    element.addEventListener('mousedown', (e) => {
      if (type !== 'nucleosome') return; // Only nucleosomes are draggable
      isDragging = true;
      const idx = parseInt(element.dataset.index);
      startX = e.clientX;
      startY = e.clientY;
      origX = this.dragOffsets[idx]?.dx || 0;
      origY = this.dragOffsets[idx]?.dy || 0;
      document.body.style.userSelect = 'none';
      element.classList.add('dragging');
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    });
    const onMove = (e) => {
      if (!isDragging) return;
      const idx = parseInt(element.dataset.index);
      let dx = origX + (e.clientX - startX);
      let dy = origY + (e.clientY - startY);
      // Clamp drag so nucleosome stays within bounds of level-container
      const containerRect = this.container.getBoundingClientRect();
      const nucRadius = 38.5;
      const foot = this.getNucleosomeFootprintWidth();
      const totalWidth = (this.nucleosomeCount - 1) * this.spacing;
      const centerX = (containerRect.width || 900) / 2;
      let baseX = centerX - totalWidth / 2 + idx * this.spacing;
      let leftBound = 0;
      let rightBound = (containerRect.width || 900) - foot;
      let topBound = 0;
      let bottomBound = (containerRect.height || 220) - 2 * nucRadius;
      let nx = Math.max(leftBound, Math.min(baseX + dx, rightBound));
      let ny = Math.max(topBound, Math.min(this.nucPositions[idx].y + dy, bottomBound));
      dx = nx - baseX;
      dy = ny - this.nucPositions[idx].y;
      this.dragOffsets[idx] = { dx, dy };
      this.updateSpacing(this.dragOffsets);
    };
    const onUp = (e) => {
      if (!isDragging) return;
      isDragging = false;
      element.classList.remove('dragging');
      element.style.filter = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      const idx = parseInt(element.dataset.index);
      if (this.snapBack) {
        // Animate nucleosome back to original position
        let from = this.dragOffsets[idx] || { dx: 0, dy: 0 };
        let progress = 1;
        const animateBack = () => {
          progress -= 0.08;
          if (progress <= 0) {
            this.dragOffsets[idx] = { dx: 0, dy: 0 };
            this.updateSpacing(this.dragOffsets);
            return;
          }
          this.dragOffsets[idx] = {
            dx: from.dx * progress,
            dy: from.dy * progress
          };
          this.updateSpacing(this.dragOffsets);
          animFrame = requestAnimationFrame(animateBack);
        };
        animateBack();
      }
      // If snapBack is false, do nothing (leave in place)
    };
  }

  distance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
  }

  /**
   * External tangent segment between equal-radius circles (bobbin / thread).
   * linkIndex alternates which side of the center line the thread sits on (zig-zag).
   */
  getBobbinEndpoints(cx1, cy1, cx2, cy2, linkIndex, r) {
    const dx = cx2 - cx1;
    const dy = cy2 - cy1;
    const d = Math.hypot(dx, dy) || 1e-9;
    const ux = dx / d;
    const uy = dy / d;
    const nx = -uy;
    const ny = ux;
    const side = (linkIndex % 2 === 0) ? 1 : -1;
    return {
      x1: cx1 + side * r * nx,
      y1: cy1 + side * r * ny,
      x2: cx2 + side * r * nx,
      y2: cy2 + side * r * ny
    };
  }

  /** Project (px,py) onto circle centered (cx,cy) with radius r. */
  projectOntoCircle(cx, cy, px, py, r) {
    const vx = px - cx;
    const vy = py - cy;
    const len = Math.hypot(vx, vy) || 1e-9;
    return {
      x: cx + (vx / len) * r,
      y: cy + (vy / len) * r
    };
  }

  /**
   * DNA segment between two nucleosome centers: first link uses bobbin tangent;
   * later links start on the left nucleus at the antipode of the previous link's
   * attachment (balanced opposite sides), and end on the corresponding opposite
   * tangent side of the right nucleus.
   */
  computeBalancedLinkEndpoints(cxL, cyL, cxR, cyR, linkIndex, r, prevRightOnLeftNucleus) {
    if (!prevRightOnLeftNucleus) {
      return this.getBobbinEndpoints(cxL, cyL, cxR, cyR, linkIndex, r);
    }
    const ax = 2 * cxL - prevRightOnLeftNucleus.x;
    const ay = 2 * cyL - prevRightOnLeftNucleus.y;
    const pL = this.projectOntoCircle(cxL, cyL, ax, ay, r);
    const dx = cxR - cxL;
    const dy = cyR - cyL;
    const d = Math.hypot(dx, dy) || 1e-9;
    const ux = dx / d;
    const uy = dy / d;
    const nx = -uy;
    const ny = ux;
    const rvx = pL.x - cxL;
    const rvy = pL.y - cyL;
    const side = (rvx * nx + rvy * ny) >= 0 ? 1 : -1;
    return {
      x1: pL.x,
      y1: pL.y,
      x2: cxR + side * r * nx,
      y2: cyR + side * r * ny
    };
  }

  checkOverlap(rect1, rect2) {
    return !(rect1.right < rect2.left ||
             rect1.left > rect2.right ||
             rect1.bottom < rect2.top ||
             rect1.top > rect2.bottom);
  }

  cubicPoint(t, p0, p1, p2, p3) {
    const u = 1 - t;
    return (
      (u * u * u * p0) +
      (3 * u * u * t * p1) +
      (3 * u * t * t * p2) +
      (t * t * t * p3)
    );
  }

  approximateCubicLength(x0, y0, x1, y1, x2, y2, x3, y3) {
    const samples = 24;
    let total = 0;
    let prevX = x0;
    let prevY = y0;
    for (let i = 1; i <= samples; i++) {
      const t = i / samples;
      const nextX = this.cubicPoint(t, x0, x1, x2, x3);
      const nextY = this.cubicPoint(t, y0, y1, y2, y3);
      total += this.distance(prevX, prevY, nextX, nextY);
      prevX = nextX;
      prevY = nextY;
    }
    return total;
  }

  /**
   * Sample a DNA link path into points with running arc-length.
   * Returned coordinates are in container-local space (matching nucleosome
   * absolute positions). Used to:
   *   • find the drop point along the link for the RNA polymerase
   *   • walk a fixed arc-length distance during the transcription animation
   */
  _samplePathForLink(linkIndex, numSamples = 80) {
    const geom = this._calculateDNALinkGeometry(linkIndex);
    const { x1, y1, x2, y2, isBent, c1absX, c1absY, c2absX, c2absY } = geom;
    const samples = new Array(numSamples + 1);
    let prevX = x1;
    let prevY = y1;
    let s = 0;
    samples[0] = { t: 0, x: x1, y: y1, s: 0 };
    for (let i = 1; i <= numSamples; i++) {
      const t = i / numSamples;
      let px;
      let py;
      if (isBent) {
        px = this.cubicPoint(t, x1, c1absX, c2absX, x2);
        py = this.cubicPoint(t, y1, c1absY, c2absY, y2);
      } else {
        px = x1 + (x2 - x1) * t;
        py = y1 + (y2 - y1) * t;
      }
      s += this.distance(prevX, prevY, px, py);
      samples[i] = { t, x: px, y: py, s };
      prevX = px;
      prevY = py;
    }
    return { samples, totalLength: s, geom };
  }

  /** Find the sample index closest to (px, py). */
  _closestSampleIndex(samples, px, py) {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < samples.length; i++) {
      const dx = samples[i].x - px;
      const dy = samples[i].y - py;
      const d = dx * dx + dy * dy;
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    return bestIdx;
  }

  /**
   * Interpolate a position + tangent angle along the sampled path at arc
   * length s (clamped to [0, totalLength]).
   */
  _sampleAtArcLength(samples, s) {
    const last = samples[samples.length - 1];
    if (s <= 0) {
      const a = samples[0];
      const b = samples[1] || a;
      return { x: a.x, y: a.y, angleDeg: Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI };
    }
    if (s >= last.s) {
      const b = last;
      const a = samples[samples.length - 2] || last;
      return { x: b.x, y: b.y, angleDeg: Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI };
    }
    let lo = 0;
    let hi = samples.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (samples[mid].s < s) lo = mid + 1; else hi = mid;
    }
    const idx = Math.max(1, lo);
    const a = samples[idx - 1];
    const b = samples[idx];
    const span = (b.s - a.s) || 1e-9;
    const u = (s - a.s) / span;
    const x = a.x + (b.x - a.x) * u;
    const y = a.y + (b.y - a.y) * u;
    const angleDeg = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
    return { x, y, angleDeg };
  }

  // Helper to calculate DNA link geometry (endpoints, midpoint, angle)
  _calculateDNALinkGeometry(linkIndex) {
    const nucRadius = 38.5; // Nucleosome radius
    const dnaLinkThickness = 8; // From styles.css .dna-svg height

    // Get calculated nucleosome positions (after drag offsets and dynamic spacing are applied)
    // These are the center coordinates of the nucleosomes
    const prevNucPos = this.nucPositions[linkIndex];
    const currNucPos = this.nucPositions[linkIndex + 1];

    const prevOffsets = this.dragOffsets[linkIndex] || { dx: 0, dy: 0 };
    const currOffsets = this.dragOffsets[linkIndex + 1] || { dx: 0, dy: 0 };

    const cxPrev = prevNucPos.x + nucRadius + prevOffsets.dx;
    const cyPrev = prevNucPos.y + nucRadius + prevOffsets.dy;
    const cxCurr = currNucPos.x + nucRadius + currOffsets.dx;
    const cyCurr = currNucPos.y + nucRadius + currOffsets.dy;

    // Determine DNA link endpoints on the circumference of the nucleosomes
    // This logic is directly from updateSpacing
    const dxC = cxCurr - cxPrev;
    const dyC = cyCurr - cyPrev;
    const dC = Math.hypot(dxC, dyC) || 1e-9;
    const ux = dxC / dC;
    const uy = dyC / dC;
    const nx = -uy;
    const ny = ux;
    const side = (linkIndex % 2 === 0) ? -1 : 1; // This determines the zig-zag side

    const x1 = cxPrev + side * nucRadius * nx;
    const y1 = cyPrev + side * nucRadius * ny;
    const x2 = cxCurr - side * nucRadius * nx;
    const y2 = cyCurr - side * nucRadius * ny;

    // Check if the link is bent (dragged)
    const control = this.dnaDragControls[linkIndex];
    const isBent = !!control;

    let c1absX, c1absY, c2absX, c2absY;
    if (isBent) {
      const Lseg = this.distance(x1, y1, x2, y2) || 1e-9;
      const ux2 = (x2 - x1) / Lseg;
      const uy2 = (y2 - y1) / Lseg;
      const px2 = -uy2;
      const py2 = ux2;
      const midAbsX = (x1 + x2) / 2;
      const midAbsY = (y1 + y2) / 2;
      const pullAbsX = control.x - midAbsX;
      const pullAbsY = control.y - midAbsY;
      const lateral = pullAbsX * px2 + pullAbsY * py2;
      const tanLen = Math.max(18, Lseg * 0.28);
      c1absX = x1 + ux2 * tanLen + px2 * lateral * 0.65;
      c1absY = y1 + uy2 * tanLen + py2 * lateral * 0.65;
      c2absX = x2 - ux2 * tanLen + px2 * lateral * 0.65;
      c2absY = y2 - uy2 * tanLen + py2 * lateral * 0.65;
    } else {
      c1absX = (x1 + x2) / 2;
      c1absY = (y1 + y2) / 2;
      c2absX = c1absX;
      c2absY = c1absY;
    }

    // The midpoint of the *actual path* (straight or bezier)
    let midX, midY;
    if (isBent) {
      // For Bezier, the visual midpoint is not simply (x1+x2)/2.
      // We can approximate it by taking the midpoint of the control points,
      // or evaluate the curve at t=0.5. Let's evaluate at t=0.5 for accuracy.
      midX = this.cubicPoint(0.5, x1, c1absX, c2absX, x2);
      midY = this.cubicPoint(0.5, y1, c1absY, c2absY, y2);
    } else {
      midX = (x1 + x2) / 2;
      midY = (y1 + y2) / 2;
    }

    // Calculate the angle of the DNA link at the midpoint.
    // For straight links, it's just the angle between x1,y1 and x2,y2.
    // For bent links, we need the tangent at the midpoint (t=0.5) of the Bezier curve.
    let angleRad;
    if (isBent) {
      // Derivative of Bezier at t=0.5 gives tangent vector
      // B'(t) = 3(1-t)^2(P1-P0) + 6(1-t)t(P2-P1) + 3t^2(P3-P2)
      // At t=0.5: B'(0.5) = 3(0.25)(P1-P0) + 6(0.25)(P2-P1) + 3(0.25)(P3-P2)
      //                   = 0.75(P1-P0) + 1.5(P2-P1) + 0.75(P3-P2)
      // This is for the tangent *vector*.
      const tangentDx = 3 * Math.pow(0.5, 2) * (c1absX - x1) +
                        6 * 0.5 * 0.5 * (c2absX - c1absX) +
                        3 * Math.pow(0.5, 2) * (x2 - c2absX);
      const tangentDy = 3 * Math.pow(0.5, 2) * (c1absY - y1) +
                        6 * 0.5 * 0.5 * (c2absY - c1absY) +
                        3 * Math.pow(0.5, 2) * (y2 - c2absY);
      angleRad = Math.atan2(tangentDy, tangentDx);
    } else {
      angleRad = Math.atan2(y2 - y1, x2 - x1);
    }
    const angleDeg = angleRad * 180 / Math.PI;

    return {
      x1, y1, x2, y2, midX, midY, angleDeg, nucRadius, dnaLinkThickness,
      isBent, c1absX, c1absY, c2absX, c2absY
    };
  }

  // Handles placement and rotation of RNA Polymerase onto the target
  _placeRNAPolymeraseOnTarget(dragObj, rnaPolymeraseRect, targetElement, targetIndex, dropInfo) {
    dragObj.style.position = 'absolute';

    // Assume rnaPolymeraseRect has been calculated from the original dragObj
    const rnaElement = dragObj.querySelector('.rna-polymerase');
    const rnaPolymeraseWidth = parseFloat(rnaElement.style.width); // 80px
    const rnaPolymeraseHeight = parseFloat(rnaElement.style.height); // 36px

    let targetX, targetY, targetAngleDeg;

    if (targetElement.classList.contains('dna-svg')) {
      // Dropped on a DNA link. Use the projected drop point along the path
      // so the polymerase appears where the user actually let go, not at the
      // link's midpoint.
      const { dnaLinkThickness } = this._calculateDNALinkGeometry(targetIndex);
      const samples = dropInfo && dropInfo.samples ? dropInfo.samples : this._samplePathForLink(targetIndex).samples;
      const startS = (dropInfo && typeof dropInfo.startS === 'number') ? dropInfo.startS : 0;
      const startPoint = this._sampleAtArcLength(samples, startS);
      targetX = startPoint.x;
      targetY = startPoint.y - (rnaPolymeraseHeight / 2) - (dnaLinkThickness / 2);
      targetAngleDeg = startPoint.angleDeg;

      // Store target data in dataset for later use by transcription animation
      dragObj.dataset.targetType = 'dnaLink';
      dragObj.dataset.targetIndex = targetIndex;
      dragObj.dataset.startS = String(startS);
      dragObj.dataset.totalLength = String(dropInfo ? dropInfo.totalLength : 0);
      dragObj.dataset.dnaLinkThickness = dnaLinkThickness;

      console.log(`RNA Polymerase placed on DNA link ${targetIndex} at (${targetX.toFixed(2)}, ${targetY.toFixed(2)}) with angle ${targetAngleDeg.toFixed(2)}. Drop arc-length: ${startS.toFixed(2)}px. DNA Link Thickness: ${dnaLinkThickness}. Polymerase Height: ${rnaPolymeraseHeight}`);
    } else {
      // Dropped on a nucleosome
      const nucleosomeRect = targetElement.getBoundingClientRect();
      const nucleosomeCenterX = nucleosomeRect.left + nucleosomeRect.width / 2;
      const nucleosomeCenterY = nucleosomeRect.top + nucleosomeRect.height / 2;

      targetX = nucleosomeCenterX;
      targetY = nucleosomeCenterY - (nucleosomeRect.height / 2) - (rnaPolymeraseHeight / 2) - 5; // 5px gap above nucleosome
      targetAngleDeg = 0; // No rotation for nucleosome

      // Store target data in dataset for later use by transcription animation
      dragObj.dataset.targetType = 'nucleosome';
      dragObj.dataset.targetIndex = targetIndex;
      dragObj.dataset.nucleosomeCenterX = nucleosomeCenterX;
      dragObj.dataset.nucleosomeCenterY = nucleosomeCenterY;

      console.log(`RNA Polymerase placed on nucleosome ${targetIndex} at (${targetX.toFixed(2)}, ${targetY.toFixed(2)}) with angle ${targetAngleDeg.toFixed(2)}. Polymerase Height: ${rnaPolymeraseHeight}`);
    }

    // Apply position and rotation. Use translate(-50%, -50%) to center the element
    // around its calculated targetX, targetY.
    dragObj.style.left = `${targetX}px`;
    dragObj.style.top = `${targetY}px`;
    dragObj.style.transform = `translate(-50%, -50%) rotate(${targetAngleDeg}deg)`;
  }

  // Handles the transcription animation sequence
  _animateTranscription(dragObj) {
    console.log("Initiating transcription animation...");
    const _this = this;

    const targetType = dragObj.dataset.targetType;
    const targetIndex = parseInt(dragObj.dataset.targetIndex);
    const rnaElement = dragObj.querySelector('.rna-polymerase');
    const rnaPolymeraseWidth = parseFloat(rnaElement.style.width); // 80px
    const rnaPolymeraseHeight = parseFloat(rnaElement.style.height); // 36px

    // Movement distance the polymerase needs to traverse along the DNA path.
    const movementDistance = rnaPolymeraseWidth * 2;

    if (targetType === 'dnaLink') {
      // Snapshot the path at the start so we walk a stable curve even if
      // the DNA reshapes (e.g. another methyl drops) mid-transcription.
      const pathData = _this._samplePathForLink(targetIndex);
      const samples = pathData.samples;
      const totalLength = pathData.totalLength;
      const dnaLinkThickness = pathData.geom.dnaLinkThickness;
      const startS = parseFloat(dragObj.dataset.startS || '0');
      const endS = Math.min(totalLength, startS + movementDistance);
      const span = endS - startS;
      const pxPerSecond = 80; // steady, readable transcription speed
      const durationMs = Math.max(150, (span / pxPerSecond) * 1000);
      let elapsed = 0;
      let prevTs = null;

      function animateMovement(ts) {
        if (prevTs == null) prevTs = ts;
        elapsed += ts - prevTs;
        prevTs = ts;
        const t = Math.min(1, elapsed / durationMs);
        const s = startS + span * t;
        const p = _this._sampleAtArcLength(samples, s);
        dragObj.style.left = `${p.x}px`;
        dragObj.style.top = `${p.y - (rnaPolymeraseHeight / 2) - (dnaLinkThickness / 2)}px`;
        dragObj.style.transform = `translate(-50%, -50%) rotate(${p.angleDeg}deg)`;
        if (t < 1) {
          requestAnimationFrame(animateMovement);
        } else {
          console.log("RNA Polymerase movement along DNA link complete.");
          _this._returnRnaPolymeraseToToolbar(dragObj);
        }
      }
      requestAnimationFrame(animateMovement);

    } else { // targetType === 'nucleosome'
      // No movement along nucleosome for now, as per instruction "down the DNA link"
      console.log("RNA Polymerase dropped on nucleosome. Movement along nucleosome not yet implemented.");
    }
  }

  _returnRnaPolymeraseToToolbar(dragObj) {
    const _this = this;
    const rna = dragObj.querySelector('.rna-polymerase');

    // Ensure it's positioned absolutely for animation
    dragObj.style.position = 'absolute';

    // Get current position (relative to viewport)
    const currentRect = dragObj.getBoundingClientRect();

    // Calculate target position in toolbar (relative to viewport)
    const startToolbarRect = _this.rnaPolymeraseToolbar.getBoundingClientRect();
    // We want to center it within the toolbar's available space, or simply put it back where it was.
    // For now, let's assume it snaps back to the top-left of the toolbar for simplicity
    // If it was part of the normal flow, its left/top would be auto.
    // Since we're animating it back, we need concrete coordinates.

    // We need to move it back to its original wrapper within the toolbar
    // For simplicity, animate to the toolbar's top-left and then reset styles.
    // This might need refinement to place it correctly within the toolbar's flex layout.
    const targetLeft = startToolbarRect.left + (startToolbarRect.width / 2);
    const targetTop = startToolbarRect.top + (startToolbarRect.height / 2);

    let fromLeft = currentRect.left + currentRect.width / 2;
    let fromTop = currentRect.top + currentRect.height / 2;

    let progress = 1;
    let animFrame;

    // If dragObj is currently a child of _this.container, move it back to toolbarWrapper first
    if (dragObj.parentNode === _this.container) {
      _this.rnaPolymeraseToolbar.querySelector('.rna-polymerase-wrapper').appendChild(dragObj);
    }

    // Reset transform to 0 before calculating animation path, so `fromLeft`/`fromTop` is accurate
    dragObj.style.transform = 'none';
    // Recalculate current position after transform reset
    fromLeft = dragObj.getBoundingClientRect().left;
    fromTop = dragObj.getBoundingClientRect().top;

    function animateBack() {
      progress -= 0.08;
      if (progress <= 0) {
        // Reset styles to integrate back into toolbar's flow
        dragObj.style.position = 'relative';
        dragObj.style.left = '';
        dragObj.style.top = '';
        dragObj.style.zIndex = '';
        dragObj.style.transform = ''; // Clear any rotations
        rna.style.boxShadow = '0 2px 8px rgba(200,180,60,0.13)';
        rna.style.borderColor = '#eab308';

        // Ensure it's back in the wrapper in the toolbar
        const wrapper = _this.rnaPolymeraseToolbar.querySelector('.rna-polymerase-wrapper');
        if (dragObj.parentNode !== wrapper) {
          wrapper.appendChild(dragObj);
        }
        return;
      }
      // Interpolate position
      dragObj.style.left = (fromLeft * progress + targetLeft * (1 - progress)) + 'px';
      dragObj.style.top = (fromTop * progress + targetTop * (1 - progress)) + 'px';
      animFrame = requestAnimationFrame(animateBack);
    }
    animateBack();
  }

  // Helper to show notification dialogs
  _showNotification(message, isSuccess) {
    const dialog = document.getElementById('notification-dialog');
    const msgElement = document.getElementById('notification-message');
    if (!dialog || !msgElement) return;

    msgElement.textContent = message;
    dialog.className = 'notification-dialog show';
    if (isSuccess) {
      dialog.classList.add('success');
      dialog.classList.remove('error');
    } else {
      dialog.classList.add('error');
      dialog.classList.remove('success');
    }

    setTimeout(() => {
      this._hideNotification();
    }, 3000); // Hide after 3 seconds
  }

  _hideNotification() {
    const dialog = document.getElementById('notification-dialog');
    if (dialog) {
      dialog.classList.remove('show');
      // Remove success/error classes after transition
      setTimeout(() => {
        dialog.classList.remove('success');
        dialog.classList.remove('error');
      }, 300);
    }
  }

  makeDNALinkInteractive(svg) {
    svg.addEventListener('mouseenter', () => {
      const linkIndex = parseInt(svg.dataset.index, 10);
      this.dnaHoverLinks[linkIndex] = true;
      this.updateSpacing(this.dragOffsets);
    });

    svg.addEventListener('mouseleave', () => {
      const linkIndex = parseInt(svg.dataset.index, 10);
      delete this.dnaHoverLinks[linkIndex];
      this.updateSpacing(this.dragOffsets);
    });

    svg.addEventListener('mousedown', (e) => {
      const linkIndex = parseInt(svg.dataset.index, 10);
      const containerRect = this.container.getBoundingClientRect();
      this.dnaDragControls[linkIndex] = {
        x: e.clientX - containerRect.left,
        y: e.clientY - containerRect.top
      };
      svg.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
      this.updateSpacing(this.dragOffsets);

      const onMove = (moveEvent) => {
        const bounds = this.container.getBoundingClientRect();
        this.dnaDragControls[linkIndex] = {
          x: moveEvent.clientX - bounds.left,
          y: moveEvent.clientY - bounds.top
        };
        this.updateSpacing(this.dragOffsets);
      };

      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        document.body.style.userSelect = '';
        svg.style.cursor = 'grab';
        if (this.snapBack) {
          delete this.dnaDragControls[linkIndex];
        }
        this.updateSpacing(this.dragOffsets);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    });
  }
}
