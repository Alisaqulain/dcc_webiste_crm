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
        const response = await fetch('/api/user/crm-access', {
          credentials: 'include', // Ensure cookies are sent with request
          cache: 'no-store' // Don't cache the response
        });
        
        if (response.ok) {
          const data = await response.json();
          setHasCrmAccess(data.hasCrmAccess || false);
          // Log for debugging
          if (data.hasCrmAccess) {
            console.log('CRM access granted. Courses:', data.crmCourses);
          } else {
            console.log('CRM access denied. User has courses but none have CRM access.');
          }
        } else if (response.status === 401) {
          // Unauthorized - session expired
          console.warn('Session expired while checking CRM access');
          setHasCrmAccess(false);
        } else {
          console.error('Error checking CRM access:', response.status, response.statusText);
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
