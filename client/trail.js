const contextValue = {
  userAuth: {
    access_token: "some_token",
    profile_img: "some_image_url",
    other_data: "some_other_data",
  },
  anotherField: "another_value",
};
 
let  {userAuth, userAuth:{access_token}} = contextValue;



console.log(userAuth, anotherField);