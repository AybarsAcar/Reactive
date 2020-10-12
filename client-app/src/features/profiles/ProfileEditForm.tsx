import React from 'react';
import { IProfile } from '../../app/models/profile';
import { Form as FinalForm, Field } from 'react-final-form';

import { combineValidators, isRequired } from 'revalidate';
import TextInput from '../../app/common/form/TextInput';
import TextAreaInput from '../../app/common/form/TextAreaInput';
import { Button, Form } from 'semantic-ui-react';

interface IProps {
  profile: IProfile;
  updateProfile: (profile: Partial<IProfile>) => void;
}

const validate = combineValidators({
  displayName: isRequired('displayName'),
});

const ProfileEditForm: React.FC<IProps> = ({ profile, updateProfile }) => {
  return (
    <FinalForm
      onSubmit={updateProfile}
      validate={validate}
      initialValues={profile!}
      render={({ handleSubmit, invalid, pristine, submitting }) => (
        <Form onSubmit={handleSubmit} error>
          <Field
            name="displayName"
            component={TextInput}
            placeholder="Dispaly Name"
            value={profile!.displayName}
          />
          <Field
            name="bio"
            component={TextAreaInput}
            placeholder="Bio"
            value={profile!.bio}
          />
          <Button
            loading={submitting}
            floated="right"
            disabled={invalid || pristine}
            positive
            content="Update Profile"
          />
        </Form>
      )}
    />
  );
};

export default ProfileEditForm;
