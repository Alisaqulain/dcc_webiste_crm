'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export const useCrmAccess = () => {
  const { data: session, status } = useSession();
  const [hasCrmAccess, setHasCrmAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkCrmAccess = async () => {
      if (status === 'loading') return;
      
      if (!session) {
        setHasCrmAccess(false);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/user/crm-access');
        if (response.ok) {
          const data = await response.json();
          setHasCrmAccess(data.hasCrmAccess);
        } else {
          setHasCrmAccess(false);
        }
      } catch (error) {
        console.error('Error checking CRM access:', error);
        setHasCrmAccess(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkCrmAccess();
  }, [session, status]);

  return { hasCrmAccess, isLoading };
};
