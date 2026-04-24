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
    this.init();
  }

  init() {
    this.container.innerHTML = '';
    this.levelWrapper = this.container; // For compatibility in code
    this.createNucleosomes();
    this.createSlider();
    this.createRNAPolymerase();
    this.createMethylGroup();
  }

  createMethylGroup() {
    const toolbar = document.querySelector('.tool-column');
    if (!toolbar) return;
    if (toolbar.querySelector('.methyl-group-wrapper')) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'methyl-group-wrapper';
    wrapper.style.position = 'relative';
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.alignItems = 'center';
    wrapper.style.marginBottom = '2rem';

    const dragObj = document.createElement('div');
    dragObj.className = 'methyl-group-drag';
    dragObj.style.position = 'relative';
    dragObj.style.display = 'flex';
    dragObj.style.flexDirection = 'column';
    dragObj.style.alignItems = 'center';
    dragObj.style.cursor = 'grab';

    const label = document.createElement('div');
    label.textContent = 'Methyl Group';
    label.style.fontWeight = 'bold';
    label.style.fontSize = '0.95rem';
    label.style.textAlign = 'center';
    label.style.position = 'absolute';
    label.style.top = '-1.3em';
    label.style.left = '50%';
    label.style.transform = 'translateX(-50%)';
    label.style.pointerEvents = 'none';
    dragObj.appendChild(label);

    const methyl = document.createElement('div');
    methyl.className = 'methyl-group-shape';
    methyl.style.width = '34px';
    methyl.style.height = '34px';
    methyl.style.borderRadius = '50%';
    methyl.style.background = 'radial-gradient(circle at 30% 28%, #ffd5dd 15%, #f7a8b5 70%, #ea8da0 100%)';
    methyl.style.border = '2px solid #d97a8e';
    methyl.style.boxShadow = '0 2px 8px rgba(217, 122, 142, 0.22)';
    methyl.style.transition = 'box-shadow 0.2s, border-color 0.2s, transform 0.2s';
    dragObj.appendChild(methyl);
    wrapper.appendChild(dragObj);
    toolbar.appendChild(wrapper);

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let origRect = null;
    let offsetX = 0;
    let offsetY = 0;
    let animFrame;
    let startToolbarRect = null;

    dragObj.addEventListener('mouseenter', () => {
      methyl.style.boxShadow = '0 0 14px rgba(250, 204, 21, 0.5), 0 0 24px rgba(254, 240, 138, 0.42), 0 2px 10px rgba(217, 122, 142, 0.26)';
      methyl.style.borderColor = '#df738a';
      methyl.style.transform = 'scale(1.03)';
    });
    dragObj.addEventListener('mouseleave', () => {
      if (!isDragging) {
        methyl.style.boxShadow = '0 2px 8px rgba(217, 122, 142, 0.22)';
        methyl.style.borderColor = '#d97a8e';
        methyl.style.transform = 'scale(1)';
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

    function onMove(e) {
      if (!isDragging) return;
      offsetX = e.clientX - startX;
      offsetY = e.clientY - startY;
      const level = document.getElementById('level-container');
      const levelRect = level.getBoundingClientRect();
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
    }

    function onUp() {
      if (!isDragging) return;
      isDragging = false;
      dragObj.style.cursor = 'grab';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      const fromLeft = parseFloat(dragObj.style.left);
      const fromTop = parseFloat(dragObj.style.top);
      const targetLeft = startToolbarRect.left;
      const targetTop = startToolbarRect.top;
      let progress = 1;
      function animateBack() {
        progress -= 0.08;
        if (progress <= 0) {
          dragObj.style.position = 'relative';
          dragObj.style.left = '';
          dragObj.style.top = '';
          dragObj.style.zIndex = '';
          methyl.style.boxShadow = '0 2px 8px rgba(217, 122, 142, 0.22)';
          methyl.style.borderColor = '#d97a8e';
          methyl.style.transform = 'scale(1)';
          return;
        }
        dragObj.style.left = (fromLeft * progress + targetLeft * (1 - progress)) + 'px';
        dragObj.style.top = (fromTop * progress + targetTop * (1 - progress)) + 'px';
        animFrame = requestAnimationFrame(animateBack);
      }
      animateBack();
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

    // Label (overlays/follows shape)
    const label = document.createElement('div');
    label.textContent = 'RNA Polymerase';
    label.style.fontWeight = 'bold';
    label.style.fontSize = '0.95rem';
    label.style.textAlign = 'center';
    label.style.position = 'absolute';
    label.style.top = '-1.3em';
    label.style.left = '50%';
    label.style.transform = 'translateX(-50%)';
    label.style.pointerEvents = 'none';
    dragObj.appendChild(label);

    // Oblong shape
    const rna = document.createElement('div');
    rna.className = 'rna-polymerase';
    rna.style.width = '80px';
    rna.style.height = '36px';
    rna.style.borderRadius = '22px/18px';
    rna.style.background = 'linear-gradient(90deg, #fef08a 70%, #fde047 100%)';
    rna.style.border = '2.5px solid #eab308';
    rna.style.boxShadow = '0 2px 8px rgba(200,180,60,0.13)';
    rna.style.display = 'flex';
    rna.style.alignItems = 'center';
    rna.style.justifyContent = 'center';
    rna.style.transition = 'box-shadow 0.2s, border 0.2s';
    dragObj.appendChild(rna);
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

    function onMove(e) {
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

    function onUp(e) {
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

        let proceedWithTranscription = false;

        if (targetElement.classList.contains('dna-svg')) { // It's a DNA link
          const dnaLinkLength = _this.currentLinkLengths[targetIndex];
          if (dnaLinkLength > 2 * rnaPolymeraseWidth) {
            console.log(`DNA Link ${targetIndex} length (${dnaLinkLength.toFixed(2)}px) is sufficient (>${(2 * rnaPolymeraseWidth)}px) for transcription.`);
            proceedWithTranscription = true;
          } else {
            console.log(`DNA Link ${targetIndex} length (${dnaLinkLength.toFixed(2)}px) is too short (not >${(2 * rnaPolymeraseWidth)}px) for transcription. Returning to toolbar.`);
          }
        } else { // It's a nucleosome
          console.log(`RNA Polymerase dropped on Nucleosome ${targetIndex}. Proceeding with transcription.`);
          proceedWithTranscription = true;
        }

        if (proceedWithTranscription) {
          // For now, just log and prevent snap-back.
          // The transcription animation logic will go here.
          console.log("RNA Polymerase successfully dropped on a target. Initiating transcription sequence.");
          // We will add the transcription animation here later.
          // For now, reset zIndex and style.
          dragObj.style.zIndex = '100'; // Bring RNA polymerase to front
          rna.style.boxShadow = '0 2px 8px rgba(200,180,60,0.13)';
          rna.style.borderColor = '#eab308';

          // Move dragObj to the main container to ensure z-index works correctly
          _this.rnaPolymeraseToolbar.querySelector('.rna-polymerase-wrapper').removeChild(dragObj);
          _this.container.appendChild(dragObj);

          _this._placeRNAPolymeraseOnTarget(dragObj, rnaPolymeraseRect, targetElement, targetIndex);
          _this._animateTranscription(dragObj);
          _this._showNotification("Transcription Successful!", true);
        } else {
          // Animate back to toolbar if condition not met for DNA link
          _this._returnRnaPolymeraseToToolbar(dragObj);
          _this._showNotification("Transcription Unsuccessful. DNA link too short.", false);
        }
      } else {
        // Animate back to toolbar
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

    this.container.appendChild(sliderWrapper);

    slider.addEventListener('input', (e) => {
      this.spacing = parseInt(e.target.value);
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
    const baseY = (containerRect.height || 220) / 2;

    const totalWidth = (this.nucleosomeCount - 1) * this.spacing;
    const centerX = (containerRect.width || 900) / 2;
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
  _placeRNAPolymeraseOnTarget(dragObj, rnaPolymeraseRect, targetElement, targetIndex) {
    dragObj.style.position = 'absolute';

    // Assume rnaPolymeraseRect has been calculated from the original dragObj
    const rnaElement = dragObj.querySelector('.rna-polymerase');
    const rnaPolymeraseWidth = parseFloat(rnaElement.style.width); // 80px
    const rnaPolymeraseHeight = parseFloat(rnaElement.style.height); // 36px

    let targetX, targetY, targetAngleDeg;

    if (targetElement.classList.contains('dna-svg')) {
      // Dropped on a DNA link
      const { midX, midY, angleDeg, dnaLinkThickness } = this._calculateDNALinkGeometry(targetIndex);
      targetX = midX;
      targetY = midY;
      targetAngleDeg = angleDeg; // Rotate to make its longer side parallel to the DNA link

      // Adjust targetY to place RNA polymerase visually "on top" of the DNA link
      targetY = midY - (rnaPolymeraseHeight / 2) - (dnaLinkThickness / 2);

      // Store target data in dataset for later use by transcription animation
      dragObj.dataset.targetType = 'dnaLink';
      dragObj.dataset.targetIndex = targetIndex;
      dragObj.dataset.dnaMidX = midX;
      dragObj.dataset.dnaMidY = midY;
      dragObj.dataset.dnaAngleDeg = angleDeg;
      dragObj.dataset.dnaLinkThickness = dnaLinkThickness;

      console.log(`RNA Polymerase placed on DNA link ${targetIndex} at (${targetX.toFixed(2)}, ${targetY.toFixed(2)}) with angle ${targetAngleDeg.toFixed(2)}. DNA Link Thickness: ${dnaLinkThickness}. Polymerase Height: ${rnaPolymeraseHeight}`);
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

    let startX = parseFloat(dragObj.style.left);
    let startY = parseFloat(dragObj.style.top);
    // Extract current rotation angle from transform property
    const currentTransform = dragObj.style.transform;
    const rotateMatch = currentTransform.match(/rotate\(([-+]?\d*\.?\d+)(deg|rad)\)/);
    let startAngleDeg = rotateMatch ? parseFloat(rotateMatch[1]) : 0;

    // Define movement distance as RNA polymerase width
    const movementDistance = rnaPolymeraseWidth * 2;

    if (targetType === 'dnaLink') {
      const { x1, y1, x2, y2, dnaLinkThickness, isBent, c1absX, c1absY, c2absX, c2absY } = _this._calculateDNALinkGeometry(targetIndex);

      // For movement along the DNA link, we need to find points along its path.
      // The instruction "move 'down' the DNA link (which would just be to the right, or counter clockwise)"
      // implies moving from the start of the link towards the end.

      let pathProgress = 0; // 0 to 1, representing progress along the DNA link's length
      const totalLinkLength = _this.currentLinkLengths[targetIndex];
      const segmentProgress = movementDistance / totalLinkLength; // How much of the path to cover

      function animateMovement(timestamp) {
        if (!previousTimestamp) previousTimestamp = timestamp;
        const deltaTime = timestamp - previousTimestamp;
        previousTimestamp = timestamp;

        pathProgress += (deltaTime / 1000) * (1 / 2); // Adjust speed as needed, 1 unit per second

        if (pathProgress >= segmentProgress) {
          pathProgress = segmentProgress; // Ensure it doesn't overshoot
          // Movement complete, proceed to next animation step
          console.log("RNA Polymerase movement along DNA link complete.");
          _this._returnRnaPolymeraseToToolbar(dragObj); // Return to toolbar after movement
          return;
        }

        let newX, newY, newAngleDeg;

        if (isBent) {
          // Calculate point on cubic Bezier curve using pre-calculated control points
          newX = _this.cubicPoint(pathProgress, x1, c1absX, c2absX, x2);
          newY = _this.cubicPoint(pathProgress, y1, c1absY, c2absY, y2);

          // Calculate tangent angle for rotation along the curve
          // Derivative of Bezier at t gives tangent vector
          const tangentDx = 3 * Math.pow((1 - pathProgress), 2) * (c1absX - x1) +
                            6 * (1 - pathProgress) * pathProgress * (c2absX - c1absX) +
                            3 * Math.pow(pathProgress, 2) * (x2 - c2absX);
          const tangentDy = 3 * Math.pow((1 - pathProgress), 2) * (c1absY - y1) +
                            6 * (1 - pathProgress) * pathProgress * (c2absY - c1absY) +
                            3 * Math.pow(pathProgress, 2) * (y2 - c2absY);
          newAngleDeg = Math.atan2(tangentDy, tangentDx) * 180 / Math.PI;

        } else {
          // Calculate point on a straight line
          newX = x1 + (x2 - x1) * pathProgress;
          newY = y1 + (y2 - y1) * pathProgress;
          newAngleDeg = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI; // Dynamic angle for straight link
        }

        // Adjust for positioning "on top" and centering
        const adjustedX = newX;
        const adjustedY = newY - (rnaPolymeraseHeight / 2) - (dnaLinkThickness / 2);

        dragObj.style.left = `${adjustedX}px`;
        dragObj.style.top = `${adjustedY}px`;
        dragObj.style.transform = `translate(-50%, -50%) rotate(${newAngleDeg}deg)`;

        requestAnimationFrame(animateMovement);
      }

      let previousTimestamp;
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
