import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import { withStyles, createStyles } from '@material-ui/core/styles';
import * as _ from 'underscore';

export const rowStyles = {
  root: {
    fontSize: 16,
    lineHeight: 1.3,
  },
  row: {
    display: "flex",
    cursor: "pointer",
  },
  name: {
    marginRight: 10,
    flexGrow: 1,
  },
  middleColumn: {
    marginRight: 10,
    minWidth: 100,
  },
  lastRun: {
    minWidth: 140,
  },
}
const styles = createStyles(theme => rowStyles);

const MigrationsDashboardRow = ({migration: {name, dateWritten, runs, lastRun}, classes}) => {
  const [expanded, setExpanded] = React.useState(false);
  
  let status;
  if (runs.length === 0) {
    status = "Not run";
  } else if (_.some(runs, run=>run.succeeded)) {
    status = "Succeeded";
  } else if (_.some(runs, run=>!run.finished)) {
    status = "In Progress";
  } else {
    status = "Failed";
  }
  
  const toggleExpanded = React.useCallback(
    ev => setExpanded(!expanded),
    [expanded, setExpanded]
  );
  
  return <div className={classes.root}>
    <div className={classes.row} onClick={toggleExpanded}>
      <span className={classes.name}>{name}</span>
      <span className={classes.middleColumn}>{dateWritten}</span>
      <span className={classes.middleColumn}>{status}</span>
      <span className={classes.lastRun}>{lastRun}</span>
    </div>
    {expanded && <ul className={classes.runs}>
      {runs.map(run => <li key={run.started}>
        Started {run.started}
        {run.finished && <>, finished {run.finished}</>}
        {run.failed && <>, FAILED</>}
      </li>)}
    </ul>}
  </div>
}

const MigrationsDashboardRowComponent = registerComponent(
  "MigrationsDashboardRow", MigrationsDashboardRow,
  withStyles(styles, {name: "MigrationsDashboardRow"}));

declare global {
  interface ComponentTypes {
    MigrationsDashboardRow: typeof MigrationsDashboardRowComponent
  }
}