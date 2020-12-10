import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import queryString from 'query-string';
import { Button, Header, Icon, Segment } from 'semantic-ui-react';
import agent from '../../app/api/agent';
import { toast } from 'react-toastify';

const RegisterSuccess: React.FC<RouteComponentProps> = ({ location }) => {
  const { email } = queryString.parse(location.search);

  const handleConfirmEmailResend = () => {
    agent.User.resendVerifyEmailConfirm(email as string)
      .then(() => {
        toast.success('Verification email resent - please check your email');
      })
      .catch((err) => {
        console.log(err);
      });
  };

  return (
    <Segment>
      <Header icon>
        <Icon name="check" />
        Successfully registered!
      </Header>

      <Segment.Inline>
        <div className="center">
          <p>
            Please check your email address (including the junk folder) for the
            verification email
          </p>

          {email && (
            <>
              <p>
                Didn't receive the email? Please click the button below to
                resend
              </p>
              <Button
                onClick={handleConfirmEmailResend}
                primary
                content="Resend email"
                size="huge"
              />
            </>
          )}
        </div>
      </Segment.Inline>
    </Segment>
  );
};

export default RegisterSuccess;
