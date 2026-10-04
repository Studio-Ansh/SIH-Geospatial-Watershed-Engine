import { Transition, Variants } from 'motion/react';

// Standard easing and springs as specified in Prompt 2
export const standardEasing = [0.22, 1, 0.36, 1] as const;

export const softSpring: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 28
};

export const microTransition: Transition = {
  duration: 0.2,
  ease: standardEasing
};

export const viewTransition: Transition = {
  duration: 0.35,
  ease: standardEasing
};

// Tab / View Transitions: fade + 8px upward slide
export const tabViewVariants: Variants = {
  initial: {
    opacity: 0,
    y: 8
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: standardEasing
    }
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.2,
      ease: standardEasing
    }
  }
};

// Modal Backdrops & Dialogs
export const modalBackdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

export const modalPanelVariants: Variants = {
  initial: { opacity: 0, scale: 0.96, y: 12 },
  animate: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: softSpring
  },
  exit: { 
    opacity: 0, 
    scale: 0.97, 
    y: 8,
    transition: { duration: 0.2, ease: standardEasing }
  }
};

// Stagger Containers
export const staggerContainer = (staggerChildren = 0.04): Variants => ({
  initial: {},
  animate: {
    transition: {
      staggerChildren
    }
  }
});

// Stagger Item (fade up)
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: standardEasing
    }
  }
};

// Bottom Feature Card (Map)
export const bottomCardVariants: Variants = {
  initial: { opacity: 0, y: 60, scale: 0.98 },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: softSpring
  },
  exit: { 
    opacity: 0, 
    y: 40, 
    scale: 0.98,
    transition: { duration: 0.2, ease: standardEasing }
  }
};

// Floating Layer Manager Panel (Map)
export const layerPanelVariants: Variants = {
  initial: { opacity: 0, scale: 0.95, y: -8 },
  animate: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { duration: 0.22, ease: standardEasing }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    y: -8,
    transition: { duration: 0.18, ease: standardEasing }
  }
};

// Primary button interaction props
export const buttonTapProps = {
  whileHover: { scale: 1.015, y: -1 },
  whileTap: { scale: 0.97 }
};
