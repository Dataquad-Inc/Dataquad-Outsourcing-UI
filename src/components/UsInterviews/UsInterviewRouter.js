import React from 'react';
import { useSelector } from 'react-redux';
import AllInterviews from './AllInterviews';
import SalesInterviews from './SalesInterviews';
import TeamInterviews from './TeamInterviews';

const UsInterviewsRouter = () => {
  const { role } = useSelector(state => state.auth);
  
  // Check user role and render appropriate component
  if (role === 'SUPERADMIN') {
    return <AllInterviews />;
  } else if (role === 'SALESEXECUTIVE') {
    return <SalesInterviews />;
  } else if (role === 'TEAMLEAD') {
    return <TeamInterviews />;
  } else {
    // Fallback for other roles or no role
    return (
      <div style={{ padding: '16px', textAlign: 'center' }}>
        <div style={{
          backgroundColor: '#fff3e0',
          border: '1px solid #ff9800',
          color: '#e65100',
          padding: '12px',
          borderRadius: '4px',
          marginTop: '16px'
        }}>
          Access denied. You don't have permission to view interviews.
        </div>
      </div>
    );
  }
};

export default UsInterviewsRouter;