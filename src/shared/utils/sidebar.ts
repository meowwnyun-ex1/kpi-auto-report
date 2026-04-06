export const SidebarStandards = {
  DEFAULT: {
    keyboardShortcut: 'b',
    widthExpanded: '16rem',
    widthCollapsed: '4rem',
  },
  COMPACT: {
    keyboardShortcut: 'b',
    widthExpanded: '16rem',
    widthCollapsed: '4rem',
  },
} as const;

export function handleSidebarShortcut(
  event: KeyboardEvent,
  toggleSidebar: () => void
): void {
  if (
    (event.metaKey || event.ctrlKey) &&
    event.key.toLowerCase() === SidebarStandards.DEFAULT.keyboardShortcut
  ) {
    event.preventDefault();
    toggleSidebar();
  }
}
