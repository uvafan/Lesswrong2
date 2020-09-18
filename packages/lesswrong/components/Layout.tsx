import { Components, registerComponent } from '../lib/vulcan-lib';
import { withUpdate } from '../lib/crud/withUpdate';
import React, { PureComponent } from 'react';
import Users from '../lib/collections/users/collection';
import { Helmet } from 'react-helmet';
import CssBaseline from '@material-ui/core/CssBaseline';
import classNames from 'classnames'
import Intercom from 'react-intercom';
import moment from '../lib/moment-timezone';
import { withCookies } from 'react-cookie'
import LogRocket from 'logrocket'
import { Random } from 'meteor/random';

import { withTheme } from '@material-ui/core/styles';
import { withLocation } from '../lib/routeUtil';
import { AnalyticsContext } from '../lib/analyticsEvents'
import { UserContext } from './common/withUser';
import { TimezoneContext } from './common/withTimezone';
import { DialogManager } from './common/withDialog';
import { CommentBoxManager } from './common/withCommentBox';
import { TableOfContentsContext } from './posts/TableOfContents/TableOfContents';
import { PostsReadContext } from './common/withRecordPostView';
import { pBodyStyle } from '../themes/stylePiping';
import { DatabasePublicSetting, googleTagManagerIdSetting, logRocketApiKeySetting } from '../lib/publicSettings';
import { forumTypeSetting } from '../lib/instanceSettings';

const intercomAppIdSetting = new DatabasePublicSetting<string>('intercomAppId', 'wtb8z7sj')
const logRocketSampleDensitySetting = new DatabasePublicSetting<number>('logRocket.sampleDensity', 5)

// From https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript
// Simple hash for randomly sampling users. NOT CRYPTOGRAPHIC.
const hashCode = function(str: string): number {
  var hash = 0, i, chr;
  if (str.length === 0) return hash;
  for (i = 0; i < str.length; i++) {
    chr   = str.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

// These routes will have the standalone TabNavigationMenu (aka sidebar)
//
// Refer to routes.js for the route names. Or console log in the route you'd
// like to include
const standaloneNavMenuRouteNames: Record<string,string[]> = {
  'LessWrong': [
    'home', 'allPosts', 'questions', 'sequencesHome', 'Shortform', 'Codex',
    'HPMOR', 'Rationality', 'Sequences', 'collections', 'nominations', 'reviews'
  ],
  'AlignmentForum': ['alignment.home', 'sequencesHome', 'allPosts', 'questions', 'Shortform'],
  'EAForum': ['home', 'allPosts', 'questions', 'Community', 'Shortform'],
}

const styles = (theme: ThemeType): JssStyles => ({
  main: {
    paddingTop: 50,
    paddingBottom: 15,
    marginLeft: "auto",
    marginRight: "auto",
    background: theme.palette.background.default,
    minHeight: "100vh",
    gridArea: 'main', 
    [theme.breakpoints.down('sm')]: {
      paddingTop: 0,
      paddingLeft: theme.spacing.unit/2,
      paddingRight: theme.spacing.unit/2,
    },
  },
  gridActivated: {
    '@supports (grid-template-areas: "title")': {
      display: 'grid',
      gridTemplateAreas: `
        "navSidebar ... main ... sunshine"
      `,
      gridTemplateColumns: `
      minmax(0, min-content)
      minmax(0, 1fr)
      minmax(0, 765px)
      minmax(0, 1.4fr)
      minmax(0, min-content)
    `,
    },
    [theme.breakpoints.down('md')]: {
      display: 'block'
    }
  },
  navSidebar: {
    gridArea: 'navSidebar'
  },
  sunshine: {
    gridArea: 'sunshine'
  },
  whiteBackground: {
    background: "white",
  },
  '@global': {
    p: pBodyStyle,
    '.mapboxgl-popup': {
      willChange: 'auto !important',
      zIndex: theme.zIndexes.styledMapPopup
    },
    // Font fallback to ensure that all greek letters just directly render as Arial
    '@font-face': {
      fontFamily: "GreekFallback",
      src: "local('Arial')",
      unicodeRange: 'U+0370-03FF, U+1F00-1FFF' // Unicode range for greek characters
    },
    // Hide the CKEditor table alignment menu
    '.ck-table-properties-form__alignment-row': {
      display: "none !important"
    },
  },
  searchResultsArea: {
    position: "absolute",
    zIndex: theme.zIndexes.layout,
    top: 0,
    width: "100%",
  },
})

interface ExternalProps {
  currentUser: UsersCurrent,
  messages: any,
  children?: React.ReactNode,
}
interface LayoutProps extends ExternalProps, WithLocationProps, WithStylesProps, WithUpdateUserProps {
  cookies: any,
  theme: ThemeType,
}
interface LayoutState {
  timezone: string,
  toc: any,
  postsRead: Record<string,boolean>,
  hideNavigationSidebar: boolean,
}

class Layout extends PureComponent<LayoutProps,LayoutState> {
  searchResultsAreaRef: React.RefObject<HTMLDivElement>
  
  constructor (props: LayoutProps) {
    super(props);
    const { cookies, currentUser } = this.props;
    const savedTimezone = cookies?.get('timezone');

    this.state = {
      timezone: savedTimezone,
      toc: null,
      postsRead: {},
      hideNavigationSidebar: !!(currentUser?.hideNavigationSidebar),
    };

    this.searchResultsAreaRef = React.createRef<HTMLDivElement>();
  }

  setToC = (document, sectionData) => {
    if (document) {
      this.setState({
        toc: {
          document: document,
          sections: sectionData && sectionData.sections
        }
      });
    } else {
      this.setState({
        toc: null,
      });
    }
  }

  toggleStandaloneNavigation = () => {
    const { updateUser, currentUser } = this.props
    this.setState(prevState => {
      if (currentUser) {
        updateUser({
          selector: { _id: currentUser._id},
          data: {
            hideNavigationSidebar: !prevState.hideNavigationSidebar
          },
        })
      }
      return {
        hideNavigationSidebar: !prevState.hideNavigationSidebar
      }
    })
  }

  getUniqueClientId = () => {
    const { currentUser, cookies } = this.props

    if (currentUser) return currentUser._id

    const cookieId = cookies.get('clientId')
    if (cookieId) return cookieId

    const newId = Random.id()
    cookies.set('clientId', newId)
    return newId
  }

  initializeLogRocket = () => {
    const { currentUser } = this.props
    const logRocketKey = logRocketApiKeySetting.get()
    if (logRocketKey) {
      // If the user is logged in, always log their sessions
      if (currentUser) {
        LogRocket.init(logRocketKey)
        return
      }

      // If the user is not logged in, only track 1/5 of the sessions
      const clientId = this.getUniqueClientId()
      const hash = hashCode(clientId)
      if (hash % logRocketSampleDensitySetting.get() === 0) {
        LogRocket.init(logRocketKey)
      }
    }
  }

  componentDidMount() {
    const { cookies } = this.props;
    const newTimezone = moment.tz.guess();
    if(this.state.timezone !== newTimezone) {
      cookies.set('timezone', newTimezone);
      this.setState({
        timezone: newTimezone
      });
    }

    this.initializeLogRocket()
  }

  render () {
    const {currentUser, location, children, classes, theme} = this.props;
    const {hideNavigationSidebar} = this.state
    const { NavigationStandalone, SunshineSidebar, ErrorBoundary, Footer, Header, FlashMessages, AnalyticsClient, AnalyticsPageInitializer, NavigationEventSender, PetrovDayWrapper } = Components

    const showIntercom = (currentUser: UsersCurrent|null) => {
      if (currentUser && !currentUser.hideIntercom) {
        return <div id="intercome-outer-frame">
          <ErrorBoundary>
            <Intercom
              appID={intercomAppIdSetting.get()}
              user_id={currentUser._id}
              email={currentUser.email}
              name={currentUser.displayName}/>
          </ErrorBoundary>
        </div>
      } else if (!currentUser) {
        return <div id="intercome-outer-frame">
            <ErrorBoundary>
              <Intercom appID={intercomAppIdSetting.get()}/>
            </ErrorBoundary>
          </div>
      } else {
        return null
      }
    }

    // Check whether the current route is one which should have standalone
    // navigation on the side. If there is no current route (ie, a 404 page),
    // then it should.
    // FIXME: This is using route names, but it would be better if this was
    // a property on routes themselves.

    const currentRoute = location.currentRoute
    const standaloneNavigation = !currentRoute ||
      standaloneNavMenuRouteNames[forumTypeSetting.get()]
        .includes(currentRoute?.name)
        
    const shouldUseGridLayout = standaloneNavigation

    return (
      <AnalyticsContext path={location.pathname}>
      <UserContext.Provider value={currentUser}>
      <TimezoneContext.Provider value={this.state.timezone}>
      <PostsReadContext.Provider value={{
        postsRead: this.state.postsRead,
        setPostRead: (postId: string, isRead: boolean): void => {
          this.setState({
            postsRead: {...this.state.postsRead, [postId]: isRead}
          })
        }
      }}>
      <TableOfContentsContext.Provider value={this.setToC}>
        <div className={classNames("wrapper", {'alignment-forum': forumTypeSetting.get() === 'AlignmentForum'}) } id="wrapper">
          <DialogManager>
            <CommentBoxManager>
              <CssBaseline />
              <Helmet>
                <link rel="stylesheet" type="text/css" href="https://fonts.googleapis.com/icon?family=Material+Icons"/>
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/instantsearch.css@7.0.0/themes/reset-min.css"/>
                <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500"/>
                { theme.typography.fontDownloads &&
                    theme.typography.fontDownloads.map(
                      (url: string)=><link rel="stylesheet" key={`font-${url}`} href={url}/>
                    )
                }
                <meta httpEquiv="Accept-CH" content="DPR, Viewport-Width, Width"/>
                <link rel="stylesheet" href="https://use.typekit.net/jvr1gjm.css"/>
              </Helmet>

              <AnalyticsClient/>
              <AnalyticsPageInitializer/>
              <NavigationEventSender/>

              {/* Sign up user for Intercom, if they do not yet have an account */}
              {showIntercom(currentUser)}
              <noscript className="noscript-warning"> This website requires javascript to properly function. Consider activating javascript to get access to all site functionality. </noscript>
              {/* Google Tag Manager i-frame fallback */}
              <noscript><iframe src={`https://www.googletagmanager.com/ns.html?id=${googleTagManagerIdSetting.get()}`} height="0" width="0" style={{display:"none", visibility:"hidden"}}/></noscript>
              <Header
                toc={this.state.toc}
                searchResultsArea={this.searchResultsAreaRef}
                standaloneNavigationPresent={standaloneNavigation}
                toggleStandaloneNavigation={this.toggleStandaloneNavigation}
              />
              {currentRoute?.name == "home" && <PetrovDayWrapper/>}
              <div className={shouldUseGridLayout ? classes.gridActivated : null}>
                {standaloneNavigation && <div className={classes.navSidebar}>
                  <NavigationStandalone sidebarHidden={hideNavigationSidebar}/>
                </div>}
                <div ref={this.searchResultsAreaRef} className={classes.searchResultsArea} />
                <div className={classNames(classes.main, {
                  [classes.whiteBackground]: currentRoute?.background === "white"
                })}>
                  <ErrorBoundary>
                    <FlashMessages />
                  </ErrorBoundary>
                  <ErrorBoundary>
                    {children}
                  </ErrorBoundary>
                  <Footer />
                </div>
                {currentRoute?.sunshineSidebar && <div className={classes.sunshine}>
                    <SunshineSidebar/>
                  </div>
                  }
              </div>
            </CommentBoxManager>
          </DialogManager>
        </div>
      </TableOfContentsContext.Provider>
      </PostsReadContext.Provider>
      </TimezoneContext.Provider>
      </UserContext.Provider>
      </AnalyticsContext>
    )
  }
}

const LayoutComponent = registerComponent<ExternalProps>(
  'Layout', Layout, { styles, hocs: [
    withLocation, withCookies,
    withUpdate({
      collection: Users,
      fragmentName: 'UsersCurrent',
    }),
    withTheme()
  ]}
);

declare global {
  interface ComponentTypes {
    Layout: typeof LayoutComponent
  }
}
