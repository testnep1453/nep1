import { supabase } from '../config/supabase';

let isLogging = false;

/**
 * Explicitly log an error to the dashboard.
 */
export const logManualError = async (error: any) => {
  await sharedLogError(error);
};

/**
 * Initializes global error listeners to catch and log front-end crashes.
 * Integrated with Supabase 'error_logs' table.
 */
export const initErrorLogger = () => {
  // 1. Hook into window errors
  window.addEventListener('error', (event) => {
    sharedLogError(event);
  });

  // 2. Hook into unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    sharedLogError(event);
  });
  
  console.log('🛡️ GLOBAL ERROR RADAR: Activated. Watching for anomalies...');
};

const sharedLogError = async (error: Error | ErrorEvent | PromiseRejectionEvent | any) => {
    // Prevent infinite loops if Supabase insert itself fails
    if (isLogging) return;
    
    try {
      isLogging = true;
      
      let message = '';
      let stack = '';
      
      if (error instanceof ErrorEvent) {
        message = error.message;
        stack = error.error?.stack || 'No stack trace available';
      } else if (error instanceof PromiseRejectionEvent) {
        message = error.reason?.message || String(error.reason);
        stack = error.reason?.stack || 'No stack trace available';
      } else if (error instanceof Error) {
        message = error.message;
        stack = error.stack || 'No stack trace available';
      } else {
        message = error?.message || 'Unknown Error';
        stack = error?.stack || JSON.stringify(error);
      }

      // Identify the user
      const studentId = localStorage.getItem('studentId');
      let userId = 'Guest';
      let userType = 'agent';

      if (studentId) {
        userId = studentId;
        userType = studentId === '1002' ? 'admin' : 'agent';
      }

      // Log to Supabase
      const { error: supabaseError } = await supabase.from('error_logs').insert([
        {
          message: message,
          stack_trace: stack,
          user_id: userId,
          user_type: userType,
          created_at: new Date().toISOString()
        }
      ]);

      if (supabaseError) {
        // Fallback to console if Supabase fails (but without triggering the listener recursively)
        console.warn('Silent Radar - Supabase logging failed:', supabaseError.message);
      }
    } catch (err) {
      // Final catch-all to prevent app death
      console.warn('Silent Radar - Internal logger failure:', err);
    } finally {
      isLogging = false;
    }
};
