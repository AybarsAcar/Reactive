import {
  observable,
  action,
  makeObservable,
  computed,
  runInAction,
} from 'mobx';
import { SyntheticEvent } from 'react';
import { toast } from 'react-toastify';
import { history } from '../..';
import agent from '../api/agent';
import { createAttendee, setActivityProps } from '../common/util/util';
import { IActivity } from '../models/activity';
import { RootStore } from './rootStore';

export default class ActivityStore {
  rootStore: RootStore;

  @observable activityRegistry = new Map();
  @observable loadingInitial: boolean = false;
  @observable activity: IActivity | null = null;
  @observable submitting = false;
  @observable target = '';
  @observable loading = false;

  constructor(rootStore: RootStore) {
    makeObservable(this);
    this.rootStore = rootStore;
  }

  @computed
  get activitiesByDate() {
    return this.groupActivitiesByDate(
      Array.from(this.activityRegistry.values())
    );
  }

  groupActivitiesByDate(activities: IActivity[]) {
    const sortedActivities = activities
      .slice()
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    return Object.entries(
      // group by the activity date
      sortedActivities.reduce((activities, activity) => {
        const date = activity.date.toISOString().split('T')[0];
        activities[date] = activities[date]
          ? [...activities[date], activity]
          : [activity];

        return activities;
      }, {} as { [key: string]: IActivity[] })
    );
  }

  @action
  loadActivities = async () => {
    this.loadingInitial = true;

    try {
      const res = await agent.Activities.list();

      runInAction(() => {
        res.forEach((activity) => {
          // call the function to set the props of activity
          setActivityProps(activity, this.rootStore.userStore.user!);

          this.activityRegistry.set(activity.id, activity);
        });
      });
    } catch (err) {
      runInAction(() => {
        console.log(err);
      });
    } finally {
      runInAction(() => {
        this.loadingInitial = false;
      });
    }
  };

  @action
  loadActivity = async (id: string) => {
    let activity = this.getActivity(id);

    if (activity) {
      this.activity = activity;
      return activity;
    } else {
      // go grab it from the api
      this.loadingInitial = true;
      try {
        activity = await agent.Activities.details(id);
        runInAction(() => {
          setActivityProps(activity, this.rootStore.userStore.user!);

          this.activity = activity;
          this.activityRegistry.set(activity.id, activity);
        });
        return activity;
      } catch (err) {
        runInAction(() => {
          console.log(err);
        });
      } finally {
        runInAction(() => {
          this.loadingInitial = false;
        });
      }
    }
  };

  @action
  clearActivity = () => {
    this.activity = null;
  };

  getActivity = (id: string) => {
    return this.activityRegistry.get(id);
  };

  @action
  createActivity = async (activity: IActivity) => {
    this.submitting = true;
    try {
      await agent.Activities.create(activity);

      const attendee = createAttendee(this.rootStore.userStore.user!);
      attendee.isHost = true;
      let attendees = [];
      attendees.push(attendee);
      activity.attendees = attendees;
      activity.isHost = true;

      runInAction(() => {
        this.activityRegistry.set(activity.id, activity);
      });
      history.push(`/activities/${activity.id}`);
    } catch (err) {
      runInAction(() => {
        console.log(err);
      });
      toast.error('Problem Submitting Data');
    } finally {
      runInAction(() => {
        this.submitting = false;
      });
    }
  };

  @action
  editActivity = async (activity: IActivity) => {
    this.submitting = true;
    try {
      await agent.Activities.update(activity);
      runInAction(() => {
        this.activityRegistry.set(activity.id, activity);
        this.activity = activity;
      });
      history.push(`/activities/${activity.id}`);
    } catch (err) {
      runInAction(() => {
        toast.error('Problem Submitting Data');
        console.log(err);
      });
    } finally {
      runInAction(() => {
        this.submitting = false;
      });
    }
  };

  @action
  deleteActivity = async (
    event: SyntheticEvent<HTMLButtonElement>,
    id: string
  ) => {
    this.submitting = true;
    this.target = event.currentTarget.name;
    try {
      await agent.Activities.delete(id);

      runInAction(() => {
        this.activityRegistry.delete(id);
        this.activity = null;
      });
    } catch (err) {
      runInAction(() => {
        console.log(err);
      });
    } finally {
      runInAction(() => {
        this.submitting = false;
        this.target = '';
      });
    }
  };

  @action
  attendActivity = async () => {
    const attendee = createAttendee(this.rootStore.userStore.user!);
    this.loading = true;

    try {
      await agent.Activities.attend(this.activity!.id);

      runInAction(() => {
        if (this.activity) {
          this.activity.attendees.push(attendee);
          this.activity.isGoing = true;
          // update the activity in the act registry
          this.activityRegistry.set(this.activity.id, this.activity);
        }
      });
    } catch (err) {
      runInAction(() => {
        toast.error('Problem signing up to activity');
        console.log(err);
      });
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  };

  @action
  cancelAttendence = async () => {
    this.loading = true;
    try {
      await agent.Activities.unattend(this.activity!.id);

      runInAction(() => {
        if (this.activity) {
          this.activity.attendees = this.activity.attendees.filter(
            (a) => a.username !== this.rootStore.userStore.user!.userName
          );
          this.activity.isGoing = false;
          this.activityRegistry.set(this.activity.id, this.activity);
        }
      });
    } catch (err) {
      runInAction(() => {
        toast.error('Problem cancelling attendance');
        console.log(err);
      });
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  };
}
