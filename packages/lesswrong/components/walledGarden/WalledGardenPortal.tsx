import React, {useCallback, useEffect, useState} from 'react';
import {Components, getFragment, registerComponent} from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { useLocation } from "../../lib/routeUtil";
import { postBodyStyles } from '../../themes/stylePiping'
import { DatabasePublicSetting, gatherTownRoomId, gatherTownRoomName } from '../../lib/publicSettings';
import { Link } from '../../lib/reactRouterWrapper';
import { GardenCodes } from "../../lib/collections/gardencodes/collection";
import { useSingle } from "../../lib/crud/withSingle";
import { ExpandedDate } from "../common/FormatDate";
import moment from '../../lib/moment-timezone';
import { gardenOpenToPublic } from './GatherTown';
import {useMulti} from "../../lib/crud/withMulti";
import {Tags} from "../../lib/collections/tags/collection";

const gatherTownLeftMenuWidth = 55 // We want to hide this menu, so we apply a negative margin on the iframe

const styles = (theme) => ({
  messageStyling: {
    ...postBodyStyles(theme),
    marginTop: "100px"
  },
  innerPortalPositioning: {
    position: "absolute",
    top: 0,
    width: "100vw",
    height: "calc(100vh - 65px)",
    zIndex: theme.zIndexes.gatherTownIframe,
    display: 'flex',
    flexDirection: 'column',

  },
  iframePositioning: {
    width: `calc(100% + ${gatherTownLeftMenuWidth}px)`,
    height: "100%",
    border: "none",
    marginLeft: -gatherTownLeftMenuWidth
  },
  portalBarPositioning: {
    width: "100%",
  },
})


const WalledGardenPortal = ({classes}:{classes:ClassesType}) => {
  const { SingleColumnSection, LoginPopupButton, AnalyticsTracker, WalledGardenPortalBar, WalledGardenMessage } = Components
  const currentUser = useCurrentUser();
  const isOpenToPublic = gardenOpenToPublic.get()

  const { query } = useLocation();
  const { code: inviteCodeQuery } = query;

  const { results } = useMulti({
    terms: {
      view: "gardenCodeByCode",
      code: inviteCodeQuery
    },
    collection: GardenCodes,
    fragmentName: "GardenCodeFragment",
    limit: 1,
    ssr: true,
  });

  const gardenCode = (results && results.length>0 && (results[0] as HasIdType)._id) ? results[0] as FragmentTypes["GardenCodeFragment"]|null : null

  const validateGardenCode = (gardenCode: GardenCodeFragment | null ) => {
    return !gardenCode?.deleted && moment().isBetween(gardenCode?.startTime, gardenCode?.endTime)
  }
  const moreThanFourHoursAfterCodeExpiry = useCallback((gardenCode) =>
    moment(gardenCode?.endTime).add(4,'hours').isBefore(new Date())
  , [])

  const [onboarded, setOnboarded] = useState(false);
  const [expiredGardenCode, setExpiredGardenCode] = useState(moreThanFourHoursAfterCodeExpiry(gardenCode));

  useEffect(() => {
    const interval = setInterval(() => {
      setExpiredGardenCode(moreThanFourHoursAfterCodeExpiry(gardenCode)) //kick someone out 4 hours after code-entry expiry
    }, 1000*10);
    return () => clearInterval(interval)
  }, [setExpiredGardenCode, moreThanFourHoursAfterCodeExpiry, gardenCode]);
  // console.log({
  //   gardenCode,
  //   expiredGardenCode,
  //   endTime: gardenCode?.endTime,
  //   now: new Date(),
  //   endTimePlus8: moment(gardenCode?.endTime).add(4,'hours'),
  //   all: moreThanFourHoursAfterCodeExpiry(gardenCode),
  //   validCode: validateGardenCode(gardenCode)
  // })

  const gatherTownURL = `https://gather.town/app/${gatherTownRoomId.get()}/${gatherTownRoomName.get()}`

  const onboardingMessage = <SingleColumnSection className={classes.messageStyling}>
    {!!gardenCode && <div>
      <p>
        Congratulations! Your invite code to <strong>{gardenCode.title}</strong> is valid (and will be for next many hours).
        Please take a look at our guidelines below, then join the party!
      </p>
      <hr/>
    </div>
    }
    <p><strong>Welcome to the Walled Garden, a curated space for truthseekers!</strong></p>
    <p>Here you can socialize, co-work, play games, and attend events. The Garden is open to everyone on Sundays from 12pm to 4pm PT. Otherwise, it is open by invite only.</p>
    <ul>
      <li>Please wear headphones, preferably with a microphone! Try to be in a low-background noise environment.</li>
      <li>Technical Problems? Refresh the tab.</li>
      <li>Lost or stuck? Respawn (<i>gear icon</i> &gt; <i>respawn</i>)</li>
      <li>Interactions are voluntary. It's okay to leave conversations.</li>
      <li>Please report any issues, both technical and social, to the LessWrong team via Intercom (bottom right) or
        email (team@lesswrong.com).</li>
    </ul>
    <AnalyticsTracker eventType="walledGardenEnter" captureOnMount eventProps={{isOpenToPublic, inviteCodeQuery, isMember: currentUser?.walledGardenInvite}}>
      <a onClick={() => setOnboarded(true)}>
        <b>Enter the Garden</b>
      </a>
    </AnalyticsTracker>
  </SingleColumnSection>
  const innerPortal = <div className={classes.innerPortalPositioning}>
      <iframe className={classes.iframePositioning} src={gatherTownURL} allow={`camera ${gatherTownURL}; microphone ${gatherTownURL}`}></iframe>
      <div className={classes.portalBarPositioning}>
        {!!currentUser && currentUser.walledGardenInvite && <WalledGardenPortalBar />}
      </div>
    </div>

  const codeExpiredDuringSession = onboarded && expiredGardenCode
  const codeExpiredBeforeSession = moment(gardenCode?.endTime).isBefore(new Date())
  const codeNotYetValid = moment(gardenCode?.startTime).isAfter(new Date())
  const codeIsValid = validateGardenCode(gardenCode)
  const deletedOrMalformedCode = (!!inviteCodeQuery && !gardenCode) || gardenCode?.deleted


  //passed through authorized users
  if (currentUser?.walledGardenInvite || isOpenToPublic || codeIsValid) {
     if (onboarded) return innerPortal
    else return onboardingMessage
  }

  //Access Denied Messages
  if (codeExpiredDuringSession) return <WalledGardenMessage>
    <p>Our apologies, your invite link has now expired (actually several hours ago, but we hate to rush people).</p>
    <p>We hope you had a really great time! :)</p>}/>})
  </WalledGardenMessage>

  if (codeNotYetValid) return <WalledGardenMessage>
    <p>Your invite code is for an event that has yet started! Please come back at <strong><ExpandedDate date={gardenCode?.startTime}/></strong></p>}
  </WalledGardenMessage>

  if (codeExpiredBeforeSession) return <WalledGardenMessage>
    <p>Unfortunately, your invite code is for an event that has already ended. Please request another link from your host or return when the Garden is open to the public on Sunday between 12pm and 4pm PT.
    </p>
  </WalledGardenMessage>

  if (deletedOrMalformedCode) return <WalledGardenMessage>
    <p>Unfortunately, your invite link to the Garden is not valid.
      Please request another link from your host or return when the Garden is open to the public on Sundays between 12pm and 4pm PT.
    </p>
  </WalledGardenMessage>

  //Default Access Denied Message
  return <SingleColumnSection className={classes.messageStyling}>
    <p>The Walled Garden is a private virtual space managed by the LessWrong team.</p>
    <p>It is closed right now. Please return on Sunday between noon and 4pm PT, when it is open to everyone. If you have a non-Sunday invite, you may need to {currentUser ? 'log in' : <LoginPopupButton><b>Log In</b></LoginPopupButton>}.</p>
  </SingleColumnSection>
}


const WalledGardenPortalComponent = registerComponent("WalledGardenPortal", WalledGardenPortal, {styles});

declare global {
  interface ComponentTypes {
    WalledGardenPortal: typeof WalledGardenPortalComponent
  }
}