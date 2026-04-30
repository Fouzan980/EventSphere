import React from 'react';
import './Skeleton.css';

const Skeleton = ({ className, style, count = 1, type = "text" }) => {
  const elements = [];
  for (let i = 0; i < count; i++) {
    elements.push(
      <div 
        key={i} 
        className={`skeleton skeleton-${type} ${className || ''}`}
        style={style}
      />
    );
  }
  return <>{elements}</>;
};

export const PageSkeleton = () => (
  <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Skeleton type="title" style={{ width: '250px' }} />
      <Skeleton type="button" style={{ width: '120px' }} />
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem' }}>
          <Skeleton type="avatar" style={{ marginBottom: '1rem' }} />
          <Skeleton type="title" style={{ width: '60%', marginBottom: '0.5rem' }} />
          <Skeleton type="text" count={2} />
        </div>
      ))}
    </div>
  </div>
);

export default Skeleton;
