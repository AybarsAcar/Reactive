import {
  action,
  computed,
  makeObservable,
  observable,
  runInAction,
} from 'mobx';
import { history } from '../..';
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

      runInAction(() => {
        // then assign
        this.user = user;
        this.rootStore.commonStore.setToken(user.token);
        this.rootStore.modalStore.closeModal();
        history.push('/activities');
      });
    } catch (error) {
      throw error.response;
    }
  };

  @action
  register = async (values: IUserFormValues) => {
    try {
      const user = await agent.User.register(values);
      runInAction(() => {
        this.rootStore.commonStore.setToken(user.token);
        this.rootStore.modalStore.closeModal();
        history.push('/activities');
      });
    } catch (error) {
      throw error.response;
    }
  };

  @action
  getUser = async () => {
    try {
      const user = await agent.User.current();
      runInAction(() => {
        this.user = user;
      });
    } catch (error) {
      console.log(error);
    }
  };

  @action
  logout = () => {
    this.rootStore.commonStore.setToken(null);
    this.user = null;
    history.push('/');
  };
}
