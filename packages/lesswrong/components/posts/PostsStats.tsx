import { Components as C, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles, createStyles } from '@material-ui/core/styles';

const styles = createStyles(theme => ({
  root: {
    opacity:.5,
    [theme.breakpoints.down('sm')]: {
      display:"none"
    }
  }
}))

const PostsStats = ({post, classes}) => {

  return (
    <span className={classes.root}>
      {post.score &&
        <C.MetaInfo title="Score">
          {Math.floor(post.score*10000)/10000}
        </C.MetaInfo>
      }
      <C.MetaInfo title="Views">
        {post.viewCount || 0}
      </C.MetaInfo>
    </span>
  )
}

const PostsStatsComponent = registerComponent('PostsStats', PostsStats, withStyles(styles, {name: "PostsStats"}));

declare global {
  interface ComponentTypes {
    PostsStats: typeof PostsStatsComponent
  }
}