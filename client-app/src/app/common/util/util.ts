import { IActivity, IAttendee } from '../../models/activity';
import { IUser } from '../../models/user';

/* 
Combining our date and time before submitting in our form
*/
export const combineDatesAndTime = (date: Date, time: Date) => {
  const timeString = time.getHours() + ':' + time.getMinutes() + ':00';

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const dateString = `${year}-${month}-${day}`;

  return new Date(dateString + ' ' + timeString);
};

/*
cehck the if currenctly logged in user isGoing or isHost
also the date too
*/
export const setActivityProps = (activity: IActivity, user: IUser) => {
  activity.date = new Date(activity.date);

  // check for isGoing ans isHoser
  activity.isGoing = activity.attendees.some(
    (a) => a.username === user.userName
  );
  activity.isHost = activity.attendees.some(
    (a) => a.username === user.userName && a.isHost
  );

  return activity;
};

export const createAttendee = (user: IUser): IAttendee => {
  return {
    displayName: user.displayName,
    isHost: false,
    username: user.userName,
    image: user.image!,
  };
};
