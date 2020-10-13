import React from 'react';
import FacebookLogin from 'react-facebook-login/dist/facebook-login-render-props';
import { Button, Icon } from 'semantic-ui-react';

interface IProps {
  fbCallback: (response: any) => void;
}

const SocialLogin: React.FC<IProps> = ({ fbCallback }) => {
  return (
    <FacebookLogin
      appId="279477189767383"
      fields="name,email,picture"
      callback={fbCallback}
      render={(renderProps: any) => (
        <Button
          onClick={renderProps.onClick}
          type="button"
          fluid
          color="facebook"
        >
          <Icon name="facebook" />
          Login with facebook
        </Button>
      )}
    />
  );
};

export default SocialLogin;
