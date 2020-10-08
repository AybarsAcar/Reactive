export interface IUser {
  username: string;
  displayName: string;
  token: string;
  image?: string;
}

/* 
Properties we want to send up to the server
*/
export interface IUserFormValues {
  email: string;
  password: string;
  displayName?: string;
  userName?: string;
}
