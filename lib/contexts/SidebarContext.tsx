'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SidebarContextType {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

/**
 * useSidebar Hook
 * Provides access to sidebar state and control functions
 * Returns fallback values during SSR or before provider initialization
 */
export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    // Return fallback during SSR or before provider is ready
    return {
      isOpen: true,
      toggle: () => {},
      open: () => {},
      close: () => {}
    };
  }
  return context;
}

interface SidebarProviderProps {
  children: ReactNode;
}

/**
 * SidebarProvider Component
 * Manages sidebar open/closed state across the application
 * Automatically closes sidebar on mobile devices
 */
export function SidebarProvider({ children }: SidebarProviderProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Set initial state based on screen size but don't auto-change on resize
  useEffect(() => {
    if (window.innerWidth < 768) { // md breakpoint
      setIsOpen(false);
    }
  }, []);

  /**
   * Toggles sidebar visibility
   */
  const toggle = () => setIsOpen(prev => !prev);
  
  /**
   * Opens the sidebar
   */
  const open = () => setIsOpen(true);
  
  /**
   * Closes the sidebar
   */
  const close = () => setIsOpen(false);

  return (
    <SidebarContext.Provider value={{ isOpen, toggle, open, close }}>
      {children}
    </SidebarContext.Provider>
  );
}