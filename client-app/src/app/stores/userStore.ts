import { action, computed, makeObservable, observable, values } from 'mobx';
import agent from '../api/agent';
import { IUser, IUserFormValues } from '../models/user';
import { RootStore } from './rootStore';

export default class UserStore {
  rootStore: RootStore;

  @observable user: IUser | null = null;

  constructor(rootStore: RootStore) {
    makeObservable(this);
    this.rootStore = rootStore;
  }

  @computed
  get isLoggedIn() {
    return !!this.user;
  }

  @action
  login = async (values: IUserFormValues) => {
    try {
      // get the user from the request
      const user = await agent.User.login(values);
      // then assign
      this.user = user;
    } catch (err) {
      console.log(err);
    }
  };
}
