import { Route, Routes } from "react-router-dom";
import NavBar from "./components/navbar.component";
import UserAuthForm from "./Pages/userAuthForm.page";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<NavBar />}>
        <Route path="signin" element={<UserAuthForm type='sign-in' />} />
        <Route path="signup" element={<UserAuthForm type='sign-up' />} />
      </Route>
    </Routes>
  );
};

export default App;
