import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    span: 'span',
    p: 'p',
    button: 'button',
    a: 'a',
    img: 'img',
  },
  AnimatePresence: ({ children }: any) => children,
}));
