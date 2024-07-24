import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD8HEQt_GgALSwUXJEB9FzcYcScSabuHfM",
  authDomain: "blog-app-da5d9.firebaseapp.com",
  projectId: "blog-app-da5d9",
  storageBucket: "blog-app-da5d9.appspot.com",
  messagingSenderId: "770751807582",
  appId: "1:770751807582:web:fdaf4126c9b37b99e074cf",
};

const app = initializeApp(firebaseConfig);

// google auth

const provider = new GoogleAuthProvider();

const auth = getAuth();

export const authwithGoogle = async () => {
  let user = null;

  await signInWithPopup(auth, provider)
    .then((res) => {
      user = res.user;
      //console.log(user.accessToken);
    })
    .catch((err) => {
      console.log(err);
    });

  return user;
};
