'use client';

import { useEffect } from 'react';
import { marcarLeidosAction } from './actions';

export function MarkAsRead({ vinculacionId }: { vinculacionId: string }) {
  useEffect(() => {
    marcarLeidosAction(vinculacionId);
  }, [vinculacionId]);
  return null;
}
