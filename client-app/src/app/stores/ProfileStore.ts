import {
  action,
  computed,
  makeObservable,
  observable,
  reaction,
  runInAction,
} from 'mobx';
import { toast } from 'react-toastify';
import agent from '../api/agent';
import { IPhoto, IProfile } from '../models/profile';
import { RootStore } from './rootStore';

export default class ProfileStore {
  rootStore: RootStore;

  @observable profile: IProfile | null = null;
  @observable loadingProfile = true;
  @observable uploadingPhoto = false;
  @observable loading = false;
  @observable followings: IProfile[] = [];
  @observable activeTab: number = 0;

  constructor(rootStore: RootStore) {
    makeObservable(this);
    this.rootStore = rootStore;

    reaction(
      () => this.activeTab,
      (activeTab) => {
        if (activeTab === 3 || activeTab === 4) {
          const predicate = activeTab === 3 ? 'followers' : 'following';
          this.loadFollowings(predicate);
        } else {
          this.followings = [];
        }
      }
    );
  }

  @computed
  get isCurrentUser() {
    if (this.rootStore.userStore.user && this.profile) {
      return this.rootStore.userStore.user.userName === this.profile.username;
    } else {
      return false;
    }
  }

  @action
  setActiveTab = (activeIndex: number) => {
    this.activeTab = activeIndex;
  };

  @action
  loadProfile = async (username: string) => {
    this.loadingProfile = true;
    try {
      const profile = await agent.Profiles.get(username);
      runInAction(() => {
        this.profile = profile;
      });
    } catch (err) {
      console.log(err);
    } finally {
      runInAction(() => {
        this.loadingProfile = false;
      });
    }
  };

  @action
  uploadPhoto = async (file: Blob) => {
    this.uploadingPhoto = true;

    try {
      const photo = await agent.Profiles.upoadPhoto(file);
      runInAction(() => {
        if (this.profile) {
          this.profile.photos.push(photo);

          if (photo.isMain && this.rootStore.userStore.user) {
            this.rootStore.userStore.user.image = photo.url;
            this.profile.image = photo.url;
          }
        }
      });
    } catch (err) {
      console.log(err);
      toast.error('Problem uploading photo');
    } finally {
      runInAction(() => {
        this.uploadingPhoto = false;
      });
    }
  };

  @action
  setMainPhoto = async (photo: IPhoto) => {
    this.loading = true;

    try {
      await agent.Profiles.setMainPhoto(photo.id);
      runInAction(() => {
        this.rootStore.userStore.user!.image = photo.url;
        this.profile!.photos.find((a) => a.isMain)!.isMain = false;
        this.profile!.photos.find((a) => a.id === photo.id)!.isMain = true;
        this.profile!.image = photo.url;
      });
    } catch (err) {
      toast.error('Problem setting photo as main');
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  };

  @action
  deletePhoto = async (photo: IPhoto) => {
    this.loading = true;

    try {
      await agent.Profiles.deletePhoto(photo.id);
      runInAction(() => {
        this.profile!.photos = this.profile!.photos.filter(
          (a) => a.id !== photo.id
        );
      });
    } catch (err) {
      toast.error('Problem deleting the photo');
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  };

  @action
  updateProfile = async (profile: Partial<IProfile>) => {
    try {
      await agent.Profiles.updateProfile(profile);
      runInAction(() => {
        if (
          profile.displayName !== this.rootStore.userStore.user!.displayName
        ) {
          this.rootStore.userStore.user!.displayName = profile.displayName!;
        }
        this.profile = { ...this.profile!, ...profile };
      });
    } catch (err) {
      toast.error('Problem updating Profile');
    }
  };

  /* 
  User following and unfollowing actions
  */
  @action
  follow = async (username: string) => {
    this.loading = true;

    try {
      await agent.Profiles.follow(username);
      runInAction(() => {
        this.profile!.following = true;
        this.profile!.followersCount++;
      });
    } catch (err) {
      toast.error('Problem following user');
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  };

  @action
  unfollow = async (username: string) => {
    this.loading = true;

    try {
      await agent.Profiles.unfollow(username);
      runInAction(() => {
        this.profile!.following = false;
        this.profile!.followersCount--;
      });
    } catch (err) {
      toast.error('Problem unfollowing user');
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  };

  @action
  loadFollowings = async (predicate: string) => {
    this.loading = true;

    try {
      const profiles = await agent.Profiles.listFollowings(
        this.profile!.username,
        predicate
      );
      runInAction(() => {
        this.followings = profiles;
      });
    } catch (err) {
      toast.error('Problem loading followings');
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  };
}