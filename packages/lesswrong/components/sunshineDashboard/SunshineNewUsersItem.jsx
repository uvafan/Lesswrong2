/* global confirm */
import { Components, registerComponent, withEdit, withCurrentUser } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import Users from 'meteor/vulcan:users';
import { Link } from 'react-router'
import FontIcon from 'material-ui/FontIcon';
import moment from 'moment';
import PropTypes from 'prop-types';
import Typography from '@material-ui/core/Typography';
import withHover from '../common/withHover'
import Popper from '@material-ui/core/Popper';

class SunshineNewUsersItem extends Component {

  handleReview = () => {
    const { currentUser, user, editMutation } = this.props
    editMutation({
      documentId: user._id,
      set: {reviewedByUserId: currentUser._id},
      unset: {}
    })
  }

  handlePurge = () => {
    const { currentUser, user, editMutation } = this.props
    if (confirm("Are you sure you want to delete all this user's posts, comments and votes?")) {
      editMutation({
        documentId: user._id,
        set: {
          reviewedByUserId: currentUser._id,
          nullifyVotes: true,
          voteBanned: true,
          deleteContent: true,
          banned: moment().add(12, 'months').toDate()
        },
        unset: {}
      })
    }
  }

  render () {
    const { user, hover, anchorEl } = this.props
    return (
        <Components.SunshineListItem>
          <Popper open={hover} anchorEl={anchorEl} placement="left-start">
            <Components.SidebarHoverOver width={250}>
              <Typography variant="body2">
                <Link to={Users.getProfileUrl(user)}>
                  { user.displayName }
                </Link>
                <br/>
                <Components.MetaInfo>
                  <div>Posts: { user.postCount || 0 }</div>
                  <div>Comments: { user.commentCount || 0 }</div>
                  <hr />
                  <div>Big Upvotes: { user.bigUpvoteCount || 0 }</div>
                  <div>Upvotes: { user.smallUpvoteCount || 0 }</div>
                  <div>Big Downvotes: { user.bigDownvoteCount || 0 }</div>
                  <div>Downvotes: { user.smallDownvoteCount || 0 }</div>
                </Components.MetaInfo>
              </Typography>
            </Components.SidebarHoverOver>
          </Popper>
          <div>
            <Components.MetaInfo>
              <Link to={Users.getProfileUrl(user)}>
                  {user.displayName}
              </Link>
            </Components.MetaInfo>
            <Components.MetaInfo>
              { user.karma || 0 }
            </Components.MetaInfo>
            <Components.MetaInfo>
              { user.email }
            </Components.MetaInfo>
            <Components.MetaInfo>
              { moment(new Date(user.createdAt)).fromNow() }
            </Components.MetaInfo>
          </div>
          { hover && <Components.SidebarItemActions>
            <div
              className="sunshine-sidebar-posts-action purge"
              title="Purge User (delete and ban)"
              onClick={this.handlePurge}>
                <FontIcon
                  style={{fontSize: "18px", color:"rgba(0,0,0,.25)"}}
                  className="material-icons">
                    delete_forever
                </FontIcon>
                <div className="sunshine-sidebar-posts-item-delete-overlay" />
            </div>
            <span
              className="sunshine-sidebar-posts-action review"
              title="Mark as Reviewed"
              onClick={this.handleReview}>
              <FontIcon
                style={{fontSize: "18px", color:"rgba(0,0,0,.25)"}}
                className="material-icons">
                  done
              </FontIcon>
            </span>
          </Components.SidebarItemActions>
          }
        </Components.SunshineListItem>
    )
  }
}

SunshineNewUsersItem.propTypes = {
  user: PropTypes.object.isRequired,
}

const withEditOptions = {
  collection: Users,
  fragmentName: 'SunshineUsersList',
}
registerComponent('SunshineNewUsersItem', SunshineNewUsersItem, [withEdit, withEditOptions], withCurrentUser, withHover);
