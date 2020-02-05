import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import { withStyles, createStyles } from '@material-ui/core/styles';
import classNames from 'classnames'

const styles = createStyles((theme) => ({
  root: {
    marginLeft: theme.spacing.unit*2.5
  }
}))

const SubSection = ({children, classes, className}: {
  children?: any,
  classes: any,
  className?: string,
}) => {
  return <div className={classNames(classes.root, className)}>
    {children}
  </div>
}

const SubSectionComponent = registerComponent('SubSection', SubSection, withStyles(styles, {name: 'SubSection'}))

declare global {
  interface ComponentTypes {
    SubSection: typeof SubSectionComponent
  }
}