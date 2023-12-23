import React from 'react';
import './assests/TodayDate.css';

function TodayDate() {
  const today = new Date();
  const options = { weekday: 'long', day: 'numeric' };
  const formattedDate = today.toLocaleDateString('en-US', options);

  return (
    <div>
      <div id='date'>{formattedDate}</div>
    </div>
  );
}

export default TodayDate;
