import {
  HubConnection,
  HubConnectionBuilder,
  LogLevel,
} from '@microsoft/signalr';
import {
  observable,
  action,
  makeObservable,
  computed,
  runInAction,
  reaction,
  toJS,
} from 'mobx';
import { SyntheticEvent } from 'react';
import { toast } from 'react-toastify';
import { history } from '../..';
import agent from '../api/agent';
import { createAttendee, setActivityProps } from '../common/util/util';
import { IActivity } from '../models/activity';
import { RootStore } from './rootStore';

const LIMIT = 2;

export default class ActivityStore {
  rootStore: RootStore;

  @observable activityRegistry = new Map();
  @observable loadingInitial: boolean = false;
  @observable activity: IActivity | null = null;
  @observable submitting = false;
  @observable target = '';
  @observable loading = false;
  // hub connection
  @observable.ref hubConnection: HubConnection | null = null;
  // pagination observables
  @observable activityCount = 0;
  @observable page = 0;
  // query opitons
  @observable predicate = new Map();

  constructor(rootStore: RootStore) {
    makeObservable(this);
    this.rootStore = rootStore;

    reaction(
      () => this.predicate.keys(),
      () => {
        this.page = 0;
        this.activityRegistry.clear();
        this.loadActivities();
      }
    );
  }

  @action
  setPredicate = (predicate: string, value: string | Date) => {
    this.predicate.clear();

    if (predicate !== 'all') {
      this.predicate.set(predicate, value);
    }
  };

  @computed
  get axiosParams() {
    const params = new URLSearchParams();
    params.append('limit', String(LIMIT));
    params.append('offset', `${this.page ? this.page * LIMIT : 0}`);
    this.predicate.forEach((value, key) => {
      if (key === 'startDate') {
        params.append(key, value.toISOString());
      } else {
        params.append(key, value);
      }
    });

    return params;
  }

  @computed
  get totalPages() {
    return Math.ceil(this.activityCount / LIMIT);
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
  setPage = (page: number) => {
    this.page = page;
  };

  @action
  loadActivities = async () => {
    this.loadingInitial = true;

    try {
      const activitiesEnvelope = await agent.Activities.list(this.axiosParams);
      const { activities, activityCount } = activitiesEnvelope;

      runInAction(() => {
        activities.forEach((activity) => {
          // call the function to set the props of activity
          setActivityProps(activity, this.rootStore.userStore.user!);

          this.activityRegistry.set(activity.id, activity);
        });
        this.activityCount = activityCount;
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
      return toJS(activity);
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
      activity.comments = [];
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

  /* 
  Hub connection for signalr
  */
  @action
  createHubConnection = (activityId: string) => {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl(process.env.REACT_APP_API_CHAT_URL!, {
        accessTokenFactory: () => this.rootStore.commonStore.token!,
      })
      .configureLogging(LogLevel.Information)
      .build();

    // start the connection
    this.hubConnection
      .start()
      .then(() => console.log(this.hubConnection!.state))
      .then(() => {
        console.log('Attemting to join group');

        if (this.hubConnection!.state === 'Connected') {
          this.hubConnection!.invoke('AddToGroup', activityId);
        }
      })
      .catch((err) => console.log('Error establishing connection: ', err));

    // when we receive a comment
    this.hubConnection.on('RecieveComment', (comment) => {
      runInAction(() => {
        this.activity!.comments.push(comment);
      });
    });
  };

  @action
  stopHubConnection = () => {
    this.hubConnection!.invoke('RemoveFromGroup', this.activity!.id)
      .then(() => {
        this.hubConnection!.stop();
      })
      .then(() => console.log('Connection Stopped'))
      .catch((err) => console.log(err));
  };

  @action
  addComment = async (values: any) => {
    // valued has to match our Create.cs in our App.Comment
    values.activityId = this.activity!.id;

    try {
      await this.hubConnection!.invoke('SendComment', values);
    } catch (err) {
      console.log(err);
    }
  };
}
