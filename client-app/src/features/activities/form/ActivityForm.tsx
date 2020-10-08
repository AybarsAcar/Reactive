import React, { useContext, useEffect, useState } from 'react';
import { Button, Form, Grid, Segment } from 'semantic-ui-react';
import { ActivityFormValues } from '../../../app/models/activity';
import { v4 as uuid } from 'uuid';
import { observer } from 'mobx-react-lite';
import { RouteComponentProps } from 'react-router-dom';
import { Form as FinalForm, Field } from 'react-final-form';
import TextInput from '../../../app/common/form/TextInput';
import TextAreaInput from '../../../app/common/form/TextAreaInput';
import SelectInput from '../../../app/common/form/SelectInput';
import { category } from '../../../app/common/options/categoryOptions';
import DateInput from '../../../app/common/form/DateInput';
import { combineDatesAndTime } from '../../../app/common/util/util';
import {
  combineValidators,
  composeValidators,
  hasLengthGreaterThan,
  isRequired,
} from 'revalidate';
import { RootStoreContext } from '../../../app/stores/rootStore';

const validate = combineValidators({
  title: isRequired({ message: 'Event title is required' }),
  category: isRequired({ message: 'Category is required' }),
  description: composeValidators(
    isRequired({ message: 'Description is Required' }),
    hasLengthGreaterThan(20)({
      message: 'Description needs to be at least 20 characters',
    })
  ),
  city: isRequired('city'),
  venue: isRequired('venue'),
  time: isRequired('time'),
  date: isRequired('date'),
});

interface DetailParams {
  id: string;
}

/* 
Rendered in the ActivityDashboard
*/
const ActivityForm: React.FC<RouteComponentProps<DetailParams>> = ({
  match,
  history,
}) => {
  const { activityStore } = useContext(RootStoreContext);
  const {
    createActivity,
    editActivity,
    submitting,
    loadActivity,
  } = activityStore;

  const [activity, setActivity] = useState(new ActivityFormValues());

  // we use some local state to indicate loading
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (match.params.id) {
      setLoading(true);
      loadActivity(match.params.id)
        .then((activity) => {
          setActivity(new ActivityFormValues(activity));
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [loadActivity, match.params.id]);

  const handleFinalFormSubmit = async (values: any) => {
    const dateAndTime = combineDatesAndTime(values.date, values.time);
    const { date, time, ...activity } = values;
    activity.date = dateAndTime;

    if (!activity.id) {
      // add the id to our new activity
      let newActivity = {
        ...activity,
        id: uuid(),
      };
      await createActivity(newActivity);
    } else {
      await editActivity(activity);
    }
  };

  return (
    <Grid>
      <Grid.Column width={10}>
        <Segment clearing>
          <FinalForm
            validate={validate}
            initialValues={activity}
            onSubmit={handleFinalFormSubmit}
            render={({ handleSubmit, invalid, pristine }) => (
              <Form onSubmit={handleSubmit} loading={loading}>
                <Field
                  name="title"
                  placeholder="Title"
                  value={activity.title}
                  component={TextInput}
                />
                <Field
                  name="description"
                  rows={2}
                  placeholder="Description"
                  value={activity.description}
                  component={TextAreaInput}
                />
                <Field
                  name="category"
                  placeholder="Category"
                  options={category}
                  value={activity.category}
                  component={SelectInput}
                />
                <Form.Group widths="equal">
                  <Field
                    name="date"
                    placeholder="Date"
                    value={activity.date}
                    component={DateInput}
                    date
                  />
                  <Field
                    name="time"
                    placeholder="Time"
                    value={activity.time}
                    component={DateInput}
                    time
                  />
                </Form.Group>
                <Field
                  name="city"
                  placeholder="City"
                  value={activity.city}
                  component={TextInput}
                />
                <Field
                  name="venue"
                  placeholder="Venue"
                  value={activity.venue}
                  component={TextInput}
                />
                <Button
                  loading={submitting}
                  floated="right"
                  positive
                  type="submit"
                  content="Submit"
                  disabled={loading || pristine || invalid}
                />
                <Button
                  onClick={
                    activity.id
                      ? () => history.push(`/activities/${activity.id}`)
                      : () => history.push('/activities')
                  }
                  floated="right"
                  type="button"
                  content="Cancel"
                  disabled={loading}
                />
              </Form>
            )}
          />
        </Segment>
      </Grid.Column>
    </Grid>
  );
};

export default observer(ActivityForm);
