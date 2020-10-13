/* 
we have our API calls, HTTP requests in this file
*/
import axios, { AxiosResponse } from 'axios';
import { toast } from 'react-toastify';
import { history } from '../..';
import { IActivitiesEnvelope, IActivity } from '../models/activity';
import { IPhoto, IProfile } from '../models/profile';
import { IUser, IUserFormValues } from '../models/user';

axios.defaults.baseURL = process.env.REACT_APP_API_URL;

/* 
Sending our JWT with all of our requests
*/
axios.interceptors.request.use(
  (config) => {
    const token = window.localStorage.getItem('jwt');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/* 
Error interceptors on the client
*/
axios.interceptors.response.use(undefined, (error) => {
  if (error.message === 'Network Error' && !error.response) {
    toast.error('Network error - Server is not Running');
  }

  const { status, data, config, headers } = error.response;

  if (status === 404) {
    history.push('/not-found');
  }

  // check if the user token expires
  if (
    status === 401 &&
    headers['www-authenticate'].includes('The token expired')
  ) {
    console.log('HERE');
    console.log(error.response.headers);

    window.localStorage.removeItem('jwt');
    history.push('/');
    toast.info('Your session has expired, please login again');
  }

  if (
    status === 400 &&
    config.method === 'get' &&
    data.errors.hasOwnProperty('id')
  ) {
    history.push('/not-found');
  }

  if (status === 500) {
    toast.error('Server Error - check the terminal for more info!');
  }
  throw error;
});

const responseBody = (response: AxiosResponse) => response.data;

// const sleep = (ms: number) => (response: AxiosResponse) => {
//   return new Promise<AxiosResponse>((resolve) =>
//     setTimeout(() => resolve(response), ms)
//   );
// };

const requests = {
  get: (url: string) => axios.get(url).then(responseBody),
  post: (url: string, body: {}) => axios.post(url, body).then(responseBody),
  put: (url: string, body: {}) => axios.put(url, body).then(responseBody),
  del: (url: string) => axios.delete(url).then(responseBody),
  postForm: (url: string, file: Blob) => {
    let formData = new FormData();
    // make sure the key matches our Servers
    formData.append('File', file);
    return axios
      .post(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then(responseBody);
  },
};

/* 
our Activities CRUD on the client side
*/
const Activities = {
  list: (params: URLSearchParams): Promise<IActivitiesEnvelope> =>
    axios.get('/activities', { params: params }).then(responseBody),
  details: (id: string): Promise<IActivity> =>
    requests.get(`/activities/${id}`),
  create: (activity: IActivity) => requests.post('/activities', activity),
  update: (activitiy: IActivity) =>
    requests.put(`/activities/${activitiy.id}`, activitiy),
  delete: (id: string) => requests.del(`/activities/${id}`),
  attend: (id: string) => requests.post(`/activities/${id}/attend`, {}),
  unattend: (id: string) => requests.del(`/activities/${id}/attend`),
};

/* 
user operations
*/
const User = {
  current: (): Promise<IUser> => requests.get('/user'),
  login: (user: IUserFormValues): Promise<IUser> =>
    requests.post(`/user/login`, user),
  register: (user: IUserFormValues): Promise<IUser> =>
    requests.post(`/user/register`, user),

  // we get the accessToken from fb
  fbLogin: (accessToken: string) =>
    requests.post(`/user/facebook`, { accessToken }),
};

/* 
Profile Related Requests
*/
const Profiles = {
  get: (username: string): Promise<IProfile> =>
    requests.get(`/profiles/${username}`),
  upoadPhoto: (photo: Blob): Promise<IPhoto> =>
    requests.postForm(`/photos`, photo),
  setMainPhoto: (id: string) => requests.post(`/photos/${id}/setMain`, {}),
  deletePhoto: (id: string) => requests.del(`/photos/${id}`),
  updateProfile: (profile: Partial<IProfile>) =>
    requests.put(`/profiles`, profile),
  follow: (username: string) =>
    requests.post(`/profiles/${username}/follow`, {}),
  unfollow: (username: string) => requests.del(`/profiles/${username}/follow`),
  listFollowings: (username: string, predicate: string) =>
    requests.get(`/profiles/${username}/follow?predicate=${predicate}`),
  listActivities: (username: string, predicate: string) =>
    requests.get(`/profiles/${username}/activities?predicate=${predicate}`),
};

export default {
  Activities,
  User,
  Profiles,
};
