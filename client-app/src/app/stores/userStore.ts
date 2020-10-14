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
  refreshTokenTimeout: any;

  rootStore: RootStore;

  @observable user: IUser | null = null;
  @observable loading = false;

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
      });
      this.rootStore.commonStore.setToken(user.token);
      this.startRefreshTokenTimer(user);
      this.rootStore.modalStore.closeModal();
      history.push('/activities');
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
        this.startRefreshTokenTimer(user);
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
      this.rootStore.commonStore.setToken(user.token);
      this.startRefreshTokenTimer(user);
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

  @action
  fbLogin = async (response: any) => {
    console.log(response);
    this.loading = true;

    try {
      const user = await agent.User.fbLogin(response.accessToken);
      runInAction(() => {
        this.user = user;
        this.rootStore.commonStore.setToken(user.token);
        this.startRefreshTokenTimer(user);
        this.rootStore.modalStore.closeModal();
      });

      history.push('/activities');
    } catch (err) {
      throw err;
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  };

  @action
  refreshToken = async () => {
    this.stopRefreshTokenTimer();
    try {
      const user = await agent.User.refreshToken();
      runInAction(() => {
        // update
        this.user = user;
      });
      // update the token
      this.rootStore.commonStore.setToken(user.token);

      // start the time after the refresh token succeeds
      this.startRefreshTokenTimer(user);
    } catch (err) {
      console.log(err);
    }
  };

  //
  private startRefreshTokenTimer(user: IUser) {
    // get the payload from the token
    const jwtToken = JSON.parse(atob(user.token.split('.')[1]));

    const expires = new Date(jwtToken.exp * 1000);

    // because we want to call this before 1 min of the expiry
    const timeout = expires.getTime() - Date.now() - 60 * 1000;

    this.refreshTokenTimeout = setTimeout(this.refreshToken, timeout);
  }

  private stopRefreshTokenTimer() {
    clearTimeout(this.refreshTokenTimeout);
  }
}
