import { createContext } from 'react';
import ActivityStore from './activityStore';
import UserStore from './userStore';

export class RootStore {
  // add the individual stores as class props
  activityStore: ActivityStore;
  userStore: UserStore;

  constructor() {
    this.activityStore = new ActivityStore(this);
    this.userStore = new UserStore(this);
  }
}

export const RootStoreContext = createContext(new RootStore());
