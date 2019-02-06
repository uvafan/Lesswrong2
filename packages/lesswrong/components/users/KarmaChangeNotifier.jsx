import React, { PureComponent } from 'react';
import { Components, registerComponent, withEdit } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import withUser from '../common/withUser';
import withErrorBoundary from '../common/withErrorBoundary'
import Popper from '@material-ui/core/Popper';
import Paper from '@material-ui/core/Paper';
import IconButton from '@material-ui/core/IconButton';
import { Link } from 'react-router';
import Users from 'meteor/vulcan:users';
import Typography from '@material-ui/core/Typography';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import Badge from '@material-ui/core/Badge';
import StarIcon from '@material-ui/icons/Star';
import StarBorderIcon from '@material-ui/icons/StarBorder';
import { getHeaderTextColor } from '../common/Header';
import MenuItem from '@material-ui/core/MenuItem';
import { karmaNotificationTimingChoices } from './KarmaChangeNotifierSettings'

const styles = theme => ({
  karmaNotifierButton: {
  },
  karmaNotifierPaper: {
    paddingTop: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit * 2
  },
  karmaNotifierPopper: {
    zIndex: theme.zIndexes.karmaChangeNotifier,
  },
  starIcon: {
    color: getHeaderTextColor(theme),
  },
  title: {
    color: theme.palette.grey[800],
    paddingTop: 16,
    paddingLeft: 16,
    paddingRight: 16
  },
  votedItems: {
    paddingTop: 10,
  },
  votedItemRow: {
    height: 20
  },
  votedItemScoreChange: {
    display: "inline-block",
    width: 20,
    textAlign: "right",
  },
  votedItemDescription: {
    display: "inline-block",
    marginLeft: 5,
    whiteSpace: "nowrap",
    overflow: "hidden",
    maxWidth: 250,
    textOverflow: "ellipsis"
  },
  
  singleLinePreview: {
    whiteSpace: "nowrap",
    overflow: "hidden",
    maxWidth: 300,
  },
  pointBadge: {
    fontSize: '0.9rem'
  },
  gainedPoints: {
    color: theme.palette.primary.main,
  },
  zeroPoints: {
  },
  lostPoints: {
    color: theme.palette.error.main,
  },
  settings: {
    display: 'block',
    textAlign: 'right',
    color: theme.palette.grey[600],
    marginTop: theme.spacing.unit * 2,
    paddingRight: 16,
  }
});

// Given a number, return a span of it as a string, with a plus sign if it's
// positive, and green, red, or black coloring for positive, negative, and
// zero, respectively.
const ColoredNumber = ({n, classes}) => {
  if (n>0) {
    return <span className={classes.gainedPoints}>{`+${n}`}</span>
  } else if (n==0) {
    return <span className={classes.zeroPoints}>{n}</span>
  } else {
    return <span className={classes.lostPoints}>{n}</span>
  }
}

const KarmaChangesDisplay = ({karmaChanges, classes, handleClose, currentUser}) => {
  const { posts, comments, updateFrequency } = karmaChanges
  const noKarmaChanges = !((posts && (posts.length > 0)) || (comments && (comments.length > 0)))
  return (
    <Typography variant="body2">
      {/* Recent karma changes between <FormatDate date={karmaChanges.startDate}/> and <FormatDate date={karmaChanges.endDate}/> */}
      {noKarmaChanges ? 
        <span className={classes.title}>{ karmaNotificationTimingChoices[updateFrequency].emptyText }</span> : 
        <div>
          <span className={classes.title}>{ karmaNotificationTimingChoices[updateFrequency].infoText }</span>
          <div className={classes.votedItems}>
            {karmaChanges.posts && karmaChanges.posts.map((postChange,i) => (
              <MenuItem 
                className={classes.votedItemRow} 
                component={Link} to={postChange.post.pageUrlRelative} key={i} >
                <span className={classes.votedItemScoreChange}>
                  <ColoredNumber n={postChange.scoreChange} classes={classes}/>
                </span>
                <div className={classes.votedItemDescription}>
                  {postChange.post.title}
                </div>
                </MenuItem>   
            ))}
            {karmaChanges.comments && karmaChanges.comments.map((commentChange,i) => (
              <MenuItem className={classes.votedItemRow} 
                component={Link} to={commentChange.comment.pageUrlRelative} key={i}
                >
                <span className={classes.votedItemScoreChange}>
                  <ColoredNumber n={commentChange.scoreChange} classes={classes}/>
                </span>
                <div className={classes.votedItemDescription}>
                  {commentChange.comment.plaintextExcerpt}
                </div>
              </MenuItem>
            ))}
          </div>
        </div>
        }
      <Link to={`/account`} className={classes.settings} onClick={handleClose}> Change Settings </Link>
    </Typography>
  );
}

class KarmaChangeNotifier extends PureComponent {
  state = {
    cleared: false,
    open: false,
    anchorEl: null,
    karmaChanges: this.props.currentUser && this.props.currentUser.karmaChanges,
    karmaChangeLastOpened: this.props.currentUser && this.props.currentUser.karmaChangeLastOpened
  };
  
  handleOpen = (event) => {
    this.setState({
      open: true,
      anchorEl: event.currentTarget,
      karmaChangeLastOpened: new Date()
    });
  }

  handleToggle = (e) => {
    const { open } = this.state
    if (open) {
      this.handleClose() // When closing from toggle, force a close by not providing an event
    } else {
      this.handleOpen(e)
    }
  }
  
  handleClose = (e) => {
    const { anchorEl } = this.state
    if (e && anchorEl.contains(e.target)) {
      return;
    }
    this.setState({
      open: false,
      anchorEl: null,
    });
    if (this.props.currentUser && this.props.currentUser.karmaChanges) {
      this.props.editMutation({
        documentId: this.props.currentUser._id,
        set: {
          karmaChangeLastOpened: this.props.currentUser.karmaChanges.endDate
        }
      });
      
      if (this.props.currentUser.karmaChanges.updateFrequency === "realtime") {
        this.setState({cleared: true});
      }
    }
  }
  
  render() {
    const {classes, currentUser} = this.props;
    const {open, anchorEl, karmaChanges, karmaChangeLastOpened} = this.state;
    if (!currentUser || !karmaChanges) return null;
    
    const { karmaChangeNotifierSettings: settings } = currentUser
    if (settings && settings.updateFrequency === "disabled")
      return null;
    
    const { posts, comments, endDate, totalChange } = karmaChanges
    //Check if user opened the karmaChangeNotifications for the current interval
    const newKarmaChangesSinceLastVisit = (new Date(karmaChangeLastOpened || 0) - new Date(endDate || 0)) < 0 
    return <div>
        <IconButton onClick={this.handleToggle} className={classes.karmaNotifierButton}>
          {((comments.length===0 && posts.length===0) || this.state.cleared || !newKarmaChangesSinceLastVisit)
            ? <StarBorderIcon className={classes.starIcon}/>
            : <Badge badgeContent={<span className={classes.pointBadge}><ColoredNumber n={totalChange} classes={classes}/></span>}>
                <StarIcon className={classes.starIcon}/>
              </Badge>
          }
        </IconButton>
        <Popper
          open={open}
          anchorEl={anchorEl}
          placement="bottom-end"
          className={classes.karmaNotifierPopper}
          popperOptions={{
            // Don't use CSS transform3d to position the popper, because that
            // causes blurry text under some circumstances
            modifiers: {
              computeStyle: {
                gpuAcceleration: false,
              }
            }
          }}
        >
          <ClickAwayListener onClickAway={this.handleClose}>
            <Paper className={classes.karmaNotifierPaper}>
              <KarmaChangesDisplay karmaChanges={karmaChanges}classes={classes} handleClose={this.handleClose} />
            </Paper> 
          </ClickAwayListener>
        </Popper>
      </div>  
      
  }
}

const withEditOptions = {
  collection: Users,
  fragmentName: 'UsersCurrent',
};

registerComponent('KarmaChangeNotifier', KarmaChangeNotifier,
  withUser, withErrorBoundary,
  [withEdit, withEditOptions],
  withStyles(styles, {name: 'KarmaChangeNotifier'})
);