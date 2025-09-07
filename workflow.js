// workflow.js - Synchronized workflow animation with IntersectionObserver
(function() {
  'use strict';
  
  // Global state
  let workflowState = {
    currentStep: 0,
    totalDuration: 0,
    startTime: 0,
    elapsed: 0,
    isAnimating: false,
    isInView: false,
    hasCountersAnimated: false,
    animationFrameId: null,
    shouldLoop: false,
    steps: [],
    stepDurations: [],
    stepStartTimes: []
  };
  
  // DOM Elements cache
  const elements = {
    workflowSection: null,
    progressBar: null,
    progressBarAria: null,
    workflowSteps: null,
    flowArrows: null,
    sectionHeader: null,
    workflowContainer: null,
    valueProposition: null,
    statItems: null,
    statNumbers: null
  };
  
  // Initialize the workflow animation
  function initWorkflow() {
    cacheDOMElements();
    calculateStepDurations();
    setupObservers();
  }
  
  // Cache DOM elements for performance
  function cacheDOMElements() {
    elements.workflowSection = document.querySelector('.workflow-section');
    elements.progressBar = document.getElementById('progressBar');
    elements.progressBarAria = elements.progressBar ? elements.progressBar.querySelector('.sr-only') : null;
    elements.workflowSteps = document.querySelectorAll('.workflow-step');
    elements.flowArrows = document.querySelectorAll('.flow-arrow');
    elements.sectionHeader = document.querySelector('.section-header');
    elements.workflowContainer = document.querySelector('.workflow-container');
    elements.valueProposition = document.querySelector('.value-proposition');
    elements.statItems = document.querySelectorAll('.stat-item');
    elements.statNumbers = document.querySelectorAll('.stat-number');
    
    // Check if looping is enabled
    workflowState.shouldLoop = elements.workflowSection && 
      elements.workflowSection.getAttribute('data-loop') === 'true';
  }
  
  // Calculate step durations and total animation time
  function calculateStepDurations() {
    workflowState.stepDurations = [];
    workflowState.stepStartTimes = [];
    workflowState.totalDuration = 0;
    
    elements.workflowSteps.forEach((step, index) => {
      // Get duration from data attribute or default to 2500ms
      const duration = step.getAttribute('data-duration') ? 
        parseInt(step.getAttribute('data-duration')) : 2500;
      
      workflowState.stepDurations[index] = duration;
      workflowState.stepStartTimes[index] = workflowState.totalDuration;
      workflowState.totalDuration += duration;
    });
  }
  
  // Set up Intersection Observers
  function setupObservers() {
    // Observer for workflow section
    const workflowObserver = new IntersectionObserver(
      (entries) => handleWorkflowIntersection(entries),
      { threshold: 0.3 }
    );
    
    // Observer for value proposition (counters)
    const countersObserver = new IntersectionObserver(
      (entries) => handleCountersIntersection(entries),
      { threshold: 0.3 }
    );
    
    if (elements.workflowSection) {
      workflowObserver.observe(elements.workflowSection);
    }
    
    if (elements.valueProposition) {
      countersObserver.observe(elements.valueProposition);
    }
  }
  
  // Handle workflow section intersection
  function handleWorkflowIntersection(entries) {
    entries.forEach(entry => {
      workflowState.isInView = entry.isIntersecting;
      
      if (entry.isIntersecting) {
        // First time in view - initialize animation
        if (!workflowState.isAnimating) {
          initAnimation();
          startWorkflow();
        } else {
          // Resume animation if paused
          resumeWorkflow();
        }
      } else {
        // Pause animation when out of view
        pauseWorkflow();
      }
    });
  }
  
  // Handle counters section intersection
  function handleCountersIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting && !workflowState.hasCountersAnimated) {
        startCountersOnce();
        workflowState.hasCountersAnimated = true;
      }
    });
  }
  
  // Initialize animation elements
  function initAnimation() {
    // Animate section header
    if (elements.sectionHeader) {
      elements.sectionHeader.classList.add('animate');
    }
    
    // Animate workflow container
    setTimeout(() => {
      if (elements.workflowContainer) {
        elements.workflowContainer.classList.add('animate');
      }
    }, 300);
    
    // Animate value proposition
    setTimeout(() => {
      if (elements.valueProposition) {
        elements.valueProposition.classList.add('animate');
      }
    }, 600);
    
    // Animate stat items with staggered delay
    if (elements.statItems) {
      elements.statItems.forEach((item, index) => {
        setTimeout(() => {
          item.classList.add('animate');
        }, 900 + (index * 200));
      });
    }
    
    // Reset workflow state
    resetWorkflow();
  }
  
  // Start the workflow animation
  function startWorkflow() {
    if (workflowState.isAnimating) return;
    
    workflowState.isAnimating = true;
    workflowState.startTime = performance.now() - workflowState.elapsed;
    
    // Start the animation loop
    animateWorkflow();
  }
  
  // Resume workflow animation
  function resumeWorkflow() {
    if (!workflowState.isAnimating) {
      workflowState.isAnimating = true;
      workflowState.startTime = performance.now() - workflowState.elapsed;
      animateWorkflow();
    }
  }
  
  // Pause workflow animation
  function pauseWorkflow() {
    workflowState.isAnimating = false;
    if (workflowState.animationFrameId) {
      cancelAnimationFrame(workflowState.animationFrameId);
      workflowState.animationFrameId = null;
    }
  }
  
  // Reset workflow to initial state
  function resetWorkflow() {
    // Reset steps
    if (elements.workflowSteps) {
      elements.workflowSteps.forEach(step => {
        step.classList.remove('active', 'completed', 'animate');
      });
    }
    
    // Reset arrows
    if (elements.flowArrows) {
      elements.flowArrows.forEach(arrow => {
        arrow.classList.remove('active', 'animate');
      });
    }
    
    // Reset progress bar
    updateProgressBar(0);
    
    // Reset state
    workflowState.currentStep = 0;
    workflowState.elapsed = 0;
  }
  
  // Main animation loop using requestAnimationFrame
  function animateWorkflow() {
    if (!workflowState.isAnimating) return;
    
    const now = performance.now();
    workflowState.elapsed = now - workflowState.startTime;
    
    // Calculate progress (0 to 1)
    const progress = Math.min(workflowState.elapsed / workflowState.totalDuration, 1);
    
    // Update progress bar
    updateProgressBar(progress * 100);
    
    // Update step states based on current time
    updateStepStates();
    
    // Check if animation is complete
    if (progress >= 1) {
      handleAnimationComplete();
    } else {
      // Continue animation
      workflowState.animationFrameId = requestAnimationFrame(animateWorkflow);
    }
  }
  
  // Update progress bar width and ARIA attributes
  function updateProgressBar(percentage) {
    if (elements.progressBar) {
      elements.progressBar.style.width = `${percentage}%`;
      
      // Update ARIA attributes
      elements.progressBar.setAttribute('aria-valuenow', Math.round(percentage));
      
      if (elements.progressBarAria) {
        elements.progressBarAria.textContent = `Progress: ${Math.round(percentage)}%`;
      }
    }
  }
  
  // Update step states based on current elapsed time
  function updateStepStates() {
    for (let i = 0; i < workflowState.stepStartTimes.length; i++) {
      const stepStartTime = workflowState.stepStartTimes[i];
      const stepDuration = workflowState.stepDurations[i];
      const stepElement = elements.workflowSteps[i];
      const arrowElement = elements.flowArrows[i];
      
      // Show step when it's time
      if (workflowState.elapsed >= stepStartTime && !stepElement.classList.contains('animate')) {
        stepElement.classList.add('animate');
      }
      
      // Activate step when it's time
      if (workflowState.elapsed >= stepStartTime && 
          workflowState.elapsed < stepStartTime + stepDuration && 
          !stepElement.classList.contains('active')) {
        
        // Complete previous steps
        for (let j = 0; j < i; j++) {
          elements.workflowSteps[j].classList.remove('active');
          elements.workflowSteps[j].classList.add('completed');
        }
        
        // Activate current step
        stepElement.classList.add('active');
        workflowState.currentStep = i;
        
        // Activate arrow after previous step (if exists)
        if (i > 0 && arrowElement) {
          arrowElement.classList.add('animate');
          setTimeout(() => {
            arrowElement.classList.add('active');
          }, 300);
        }
      }
    }
  }
  
  // Handle animation completion
  function handleAnimationComplete() {
    // Complete all steps
    if (elements.workflowSteps) {
      elements.workflowSteps.forEach(step => {
        step.classList.remove('active');
        step.classList.add('completed');
      });
    }
    
    // Complete all arrows
    if (elements.flowArrows) {
      elements.flowArrows.forEach(arrow => {
        arrow.classList.add('animate', 'active');
      });
    }
    
    // Set progress to 100%
    updateProgressBar(100);
    
    // Handle looping
    if (workflowState.shouldLoop && workflowState.isInView) {
      setTimeout(() => {
        resetWorkflow();
        startWorkflow();
      }, 2000);
    } else {
      workflowState.isAnimating = false;
    }
  }
  
  // Animate counters once when in view
  function startCountersOnce() {
    if (!elements.statNumbers) return;
    
    elements.statNumbers.forEach(counter => {
      const target = parseInt(counter.getAttribute('data-target'));
      const prefix = counter.getAttribute('data-prefix') || '';
      const suffix = counter.getAttribute('data-suffix') || '';
      const duration = parseInt(counter.getAttribute('data-duration')) || 2000;
      const decimals = parseInt(counter.getAttribute('data-decimals')) || 0;
      
      animateValue(counter, 0, target, duration, prefix, suffix, decimals);
    });
  }
  
  // Animate a counter value
  function animateValue(element, start, end, duration, prefix, suffix, decimals) {
    const startTime = performance.now();
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    function updateCounter(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const value = start + (end - start) * (reduceMotion ? 1 : easeOutQuart);
      
      // Format the value with decimals
      const formattedValue = value.toFixed(decimals);
      
      // Update the element text
      element.textContent = `${prefix}${formattedValue}${suffix}`;
      
      // Continue animation if not complete
      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      }
    }
    
    requestAnimationFrame(updateCounter);
  }
  
  // Initialize when DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWorkflow);
  } else {
    initWorkflow();
  }
})();