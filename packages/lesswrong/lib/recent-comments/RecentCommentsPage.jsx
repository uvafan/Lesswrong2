import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';

const RecentCommentsPage = (props, context) => {
  const terms = _.isEmpty(props.location && props.location.query) ? {view: 'recentComments'}: props.location.query;

  return (
    <div className="recent-comments-page">
      <Components.RecentComments terms={terms}/>
    </div>
  )
};

registerComponent('RecentCommentsPage', RecentCommentsPage);
