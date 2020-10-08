import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/* 
utility that allows all the pages to scroll to top as a new page loads
*/
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default ScrollToTop;
