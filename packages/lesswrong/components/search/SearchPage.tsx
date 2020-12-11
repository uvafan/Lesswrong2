import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { Hits, Configure, Index, InstantSearch, SearchBox, CurrentRefinements } from 'react-instantsearch-dom';
import { algoliaIndexNames, isAlgoliaEnabled, getSearchClient } from '../../lib/algoliaUtil';
import SearchIcon from '@material-ui/icons/Search';
import { useLocation } from '../../lib/routeUtil';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    width: "100%",
    maxWidth: 1200,
    margin: "auto",
    [theme.breakpoints.down('sm')]: {
      paddingTop: 24,
    }
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    padding: 8,
  },
  columns: {
    display: "flex",
    justifyContent: "space-around",
    flexWrap: "wrap"
  },
  searchList: {
    width: 300,
    [theme.breakpoints.down('sm')]: {
      width: "100%",
      borderBottom: "solid 1px rgba(0,0,0,.1)",
      order: 1,
      maxWidth: 625,
    },
  },
  usersList: {
    width: 220,
    [theme.breakpoints.down('sm')]: {
      width: "100%",
      maxWidth: 625,
      borderBottom: "solid 1px rgba(0,0,0,.1)",
      paddingBottom: 8
    }
  },
  tagsList: {
    width: 220,
    [theme.breakpoints.down('sm')]: {
      width: "100%",
      maxWidth: 625,
      borderBottom: "solid 1px rgba(0,0,0,.1)",
      paddingBottom: 8
    }
  },
  searchIcon: {
    marginLeft: 12
  },
  searchInputArea: {
    display: "flex",
    alignItems: "center",
    margin: "auto",
    width: 625,
    marginLeft: "auto",
    marginRight: "auto",
    marginTop: 24,
    marginBottom: 40,
    height: 48,
    border: "solid 1px rgba(0,0,0,.3)",
    borderRadius: 3,
    [theme.breakpoints.down('xs')]: {
      width: "100%",
      marginTop: 12,
      marginBottom: 12,
    },
    "& .ais-SearchBox": {
      display: 'inline-block',
      position: 'relative',
      width: '100%',
      marginLeft: 12,
      height: 46,
      whiteSpace: 'nowrap',
      boxSizing: 'border-box',
      fontSize: 14,
    },
    "& .ais-SearchBox-form": {
      height: '100%'
    },
    "& .ais-SearchBox-submit":{
      display: "none"
    },
    // This is a class generated by React InstantSearch, which we don't have direct control over so
    // are doing a somewhat hacky thing to style it.
    "& .ais-SearchBox-input": {
      height: "100%",
      width: "100%",
      paddingRight: 0,
      verticalAlign: "bottom",
      borderStyle: "none",
      boxShadow: "none",
      backgroundColor: "transparent",
      fontSize: 'inherit',
      "-webkit-appearance": "none",
      cursor: "text",
    },
  }
})

const SearchPage = ({classes}:{
  classes: ClassesType
}) => {

  const { ErrorBoundary, SearchPagination, UsersSearchHit, PostsSearchHit, CommentsSearchHit, TagsSearchHit, Typography } = Components

  const {query} = useLocation()

  if(!isAlgoliaEnabled) {
    return <div className={classes.root}>
      Search is disabled (Algolia App ID not configured on server)
    </div>
  }

  return <div className={classes.root}>
    <InstantSearch
      indexName={algoliaIndexNames.Posts}
      searchClient={getSearchClient()}
    >
      <div className={classes.searchInputArea}>
        <SearchIcon className={classes.searchIcon}/>
        {/* Ignored because SearchBox is incorrectly annotated as not taking null for its reset prop, when
          * null is the only option that actually suppresses the extra X button.
         // @ts-ignore */}
        <SearchBox defaultRefinement={query.terms} reset={null} focusShortcuts={[]} autoFocus={true} />
      </div>
      <CurrentRefinements />
      <div className={classes.columns}>
      <ErrorBoundary>
        <div className={classes.usersList}>
          <Index indexName={algoliaIndexNames.Users}>
            <div className={classes.header}>
              <Typography variant="body1">
                Users
              </Typography>
              <SearchPagination />
            </div>
            <Configure hitsPerPage={6} />
            <Hits hitComponent={(props) => <UsersSearchHit {...props} />} />
          </Index>
        </div>
      </ErrorBoundary>
      <ErrorBoundary>
          <div className={classes.searchList}>
            <Index indexName={algoliaIndexNames.Posts}>
              <div className={classes.header}>
                <Typography variant="body1">
                  Posts
                </Typography>
                <SearchPagination />
              </div>

              <Configure hitsPerPage={6} />
              <Hits hitComponent={(props) => <PostsSearchHit {...props} />} />
            </Index>
          </div>
        </ErrorBoundary>
        <ErrorBoundary>
          <div className={classes.searchList}>
            <Index indexName={algoliaIndexNames.Comments}>
              <div className={classes.header}>
                <Typography variant="body1">
                  Comments
                </Typography>
                <SearchPagination />
              </div>
              <Configure hitsPerPage={6} />
              <Hits hitComponent={(props) => <CommentsSearchHit {...props} />} />
            </Index>
          </div>
        </ErrorBoundary>
        <ErrorBoundary>
          <div className={classes.tagsList}>
            <Index indexName={algoliaIndexNames.Tags}>
              <div className={classes.header}>
                <Typography variant="body1">
                  Tags and Wiki
                </Typography>
                <SearchPagination />
              </div>
              <Configure hitsPerPage={6} />
              <Hits hitComponent={(props) => <TagsSearchHit {...props} />} />
            </Index>
          </div>
        </ErrorBoundary>
      </div>
    </InstantSearch>
  </div>
}

const SearchPageComponent = registerComponent("SearchPage", SearchPage, {styles})

declare global {
  interface ComponentTypes {
    SearchPage: typeof SearchPageComponent
  }
}
