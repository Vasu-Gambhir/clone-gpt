'use client';

import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/lib/contexts/SidebarContext';

export function SidebarToggle() {
  const { isOpen, toggle } = useSidebar();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      className="rounded-lg p-2 hover:bg-muted transition-colors"
      title={isOpen ? 'Close sidebar' : 'Open sidebar'}
    >
      {isOpen ? (
        <X className="h-5 w-5" />
      ) : (
        <Menu className="h-5 w-5" />
      )}
      <span className="sr-only">Toggle sidebar</span>
    </Button>
  );
}