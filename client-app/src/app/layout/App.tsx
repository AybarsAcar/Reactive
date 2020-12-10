import React, { useContext, useEffect } from 'react';
import { Container } from 'semantic-ui-react';
import 'semantic-ui-css/semantic.min.css';
import Navbar from '../../features/nav/Navbar';
import ActivityDashboard from '../../features/activities/dashboard/ActivityDashboard';
import { observer } from 'mobx-react-lite';
import {
  Route,
  RouteComponentProps,
  Switch,
  withRouter,
} from 'react-router-dom';
import HomePage from '../../features/home/HomePage';
import ActivityForm from '../../features/activities/form/ActivityForm';
import ActivityDetail from '../../features/activities/details/ActivityDetail';
import NotFound from './NotFound';
import { ToastContainer } from 'react-toastify';
import { RootStoreContext } from '../stores/rootStore';
import LoadingComponent from './LoadingComponent';
import ModalContainer from '../common/modals/ModalContainer';
import ProfilePage from '../../features/profiles/ProfilePage';
import PrivateRoute from './PrivateRoute';
import RegisterSuccess from '../../features/user/RegisterSuccess';
import VerifyEmail from '../../features/user/VerifyEmail';

const App: React.FC<RouteComponentProps> = ({ location }) => {
  const rootStore = useContext(RootStoreContext);
  const { appLoaded, setAppLoaded, token } = rootStore.commonStore;
  const { getUser } = rootStore.userStore;

  // check to see if there is token
  useEffect(() => {
    if (token && !appLoaded) {
      getUser().finally(() => setAppLoaded());
    } else {
      setAppLoaded();
    }
  }, [getUser, setAppLoaded, token, appLoaded]);

  if (!appLoaded) {
    return <LoadingComponent content="Loading app . . ." />;
  }

  return (
    <>
      <ModalContainer />
      <ToastContainer position="bottom-right" />
      <Route exact path="/" component={HomePage} />
      <Route
        path={'/(.+)'}
        render={() => (
          <>
            <Navbar />
            <Container style={{ marginTop: '7em' }}>
              <Switch>
                <PrivateRoute
                  exact
                  path="/activities"
                  component={ActivityDashboard}
                />
                <PrivateRoute
                  exact
                  path="/activities/:id"
                  component={ActivityDetail}
                />

                <PrivateRoute
                  key={location.key}
                  exact
                  path={['/create-activity', '/manage/:id']}
                  component={ActivityForm}
                />

                <PrivateRoute
                  path="/profile/:username"
                  component={ProfilePage}
                />

                <Route path="/user/verifyEmail" component={VerifyEmail} />

                <Route
                  path="/user/registerSuccess"
                  component={RegisterSuccess}
                />

                {/* NOT FOUND PAGE */}
                <Route component={NotFound} />
              </Switch>
            </Container>
          </>
        )}
      />
    </>
  );
};

export default withRouter(observer(App));
