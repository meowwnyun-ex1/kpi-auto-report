import React, { useState } from 'react';

/**
 * ContactWidget - Floating contact button
 * Shows contact.png (80px), swaps to contact2.png (120px) on hover
 * Links to email chat on click
 */
const ContactWidget: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    // Open email client with the team email
    window.location.href = 'mailto:thammaphon.chittasuwanna.a3q@ap.denso.com';
  };

  return (
    <div
      className="fixed bottom-0 right-0 z-50 cursor-pointer p-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      title="Contact Team">
      <img
        src={isHovered ? '/contact/contact2.png' : '/contact/contact.png'}
        alt="Contact"
        className="h-auto w-auto object-contain"
        style={{
          maxHeight: isHovered ? '160px' : '80px',
          maxWidth: isHovered ? '160px' : '80px',
        }}
      />
    </div>
  );
};

export default ContactWidget;
