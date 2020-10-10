import { observer } from 'mobx-react-lite';
import React, { useContext, useEffect } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { Grid } from 'semantic-ui-react';
import LoadingComponent from '../../../app/layout/LoadingComponent';
import { RootStoreContext } from '../../../app/stores/rootStore';
import ActivityDetailedChat from './ActivityDetailedChat';
import ActivityDetailedInfo from './ActivityDetailedInfo';
import ActivityDetailedSidebar from './ActivityDetailedSidebar';
import ActivityDetaledHeader from './ActivityDetaledHeader';

interface DetailParams {
  id: string;
}

/* 
this is a Page of its own
*/
const ActivityDetail: React.FC<RouteComponentProps<DetailParams>> = ({
  match,
  history,
}) => {
  const { activityStore } = useContext(RootStoreContext);
  const { activity, loadActivity, loadingInitial } = activityStore;

  useEffect(() => {
    loadActivity(match.params.id);
  }, [loadActivity, match.params.id, history]);

  if (loadingInitial) {
    return <LoadingComponent content="Loading Activity . . ." />;
  }

  if (!activity) {
    return <h2>Activity not found</h2>;
  }

  return (
    <Grid>
      <Grid.Column width={10}>
        <ActivityDetaledHeader activity={activity} />
        <ActivityDetailedInfo activity={activity} />
        <ActivityDetailedChat />
      </Grid.Column>
      <Grid.Column width={6}>
        <ActivityDetailedSidebar attendees={activity.attendees} />
      </Grid.Column>
    </Grid>
  );
};

export default observer(ActivityDetail);
