import express from "express";
import mongoose from "mongoose";
import "dotenv/config";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";
import cors from "cors";
import admin from "firebase-admin";
import serviceAccountKey from "./blog-app-da5d9-firebase-adminsdk-grm7u-c8b64fd3eb.json" assert { type: "json" };
import { getAuth } from "firebase-admin/auth";
import aws from "aws-sdk";

//schema
import User from "./schema/user.js";
import Blog from "./schema/Blog.js";

const server = express();

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountKey),
});

let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password

//console.log(emailRegex.test('amstig100@gmail.c')) rege test funciton return boolean

server.use(express.json());
server.use(cors());

mongoose.connect(process.env.DB_LOCATION, {
  autoIndex: true,
});

// setting up s3 bucket
const s3 = new aws.S3({
  region: "ap-south-1",
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const generateUploadURL = async () => {
  const date = new Date();
  const imageName = `${nanoid()}-${date.getTime()}.jpeg`;

  return await s3.getSignedUrlPromise("putObject", {
    Bucket: "blog-app-fullstack",
    Key: imageName,
    Expires: 1000,
    ContentType: "image/jpeg",
  });
};

const verifyJWT = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) {
    return res.status(401).json({ error: "No Access Token" });
  }

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Access token invalid" });
    }
    req.user = user.id;
    next();
  });
};

const formatDatatoSend = (user) => {
  const acess_token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY);

  return {
    acess_token,
    profile_img: user.personal_info.profile_img,
    username: user.personal_info.username,
    fullname: user.personal_info.fullname,
  };
};

const generateUsername = async (email) => {
  let username = email.split("@")[0];

  let isUsernameNotUnique = await User.exists({
    "personal_info.username": username,
  }).then((result) => result);

  //console.log(isUsernameNotUnique)

  isUsernameNotUnique ? (username += nanoid().substring(0, 5)) : "";

  return username;
};

// upload image url route
server.get("/get-upload-url", (req, res) => {
  generateUploadURL()
    .then((url) => res.status(200).json({ uploadURL: url }))
    .catch((err) => {
      console.log(err.message);
      return res.status(500).json({ error: err.message });
    });
});

server.post("/signup", (req, res) => {
  let { fullname, email, password } = req.body;

  //validating the data from frontend
  if (fullname.length < 3) {
    return res
      .status(403)
      .json({ error: "Full name must be atleast 3 letter long" });
  }
  if (!email.length) {
    return res.status(403).json({ error: "Enter Email" });
  }
  if (!emailRegex.test(email)) {
    return res.status(403).json({ error: "Email is invalid" });
  }
  if (!passwordRegex.test(password)) {
    return res.status(403).json({
      error:
        "Password should be 6 to 20 charecter long with a numberic, 1 lowercase and 1 uppercase letter",
    });
  }

  bcrypt.hash(password, 10, async (err, hashed_password) => {
    let username = await generateUsername(email);

    let user = new User({
      personal_info: { fullname, email, password: hashed_password, username },
    });
    console.log(user);

    user
      .save()
      .then((u) => {
        return res.status(200).json(formatDatatoSend(u));
      })
      .catch((err) => {
        if (err.code == 11000) {
          return res.status(500).json({ error: "email aleady exist" });
        }

        return res.status(500).json({ error: err.message });
      });
  });
});

server.post("/signin", (req, res) => {
  let { email, password } = req.body;

  User.findOne({ "personal_info.email": email })
    .then((user) => {
      if (!user) {
        return res.status(403).json({ error: "Email not found" });
      }

      if (!user.google_auth) {
        bcrypt.compare(password, user.personal_info.password, (err, result) => {
          if (err) {
            return res
              .status(403)
              .json({ error: "Error occured while login please try again" });
          }

          if (!result) {
            return res.status(403).json({ error: "incorrect credential" });
          } else {
            return res.status(200).json(formatDatatoSend(user));
          }
        });
      } else {
        return res
          .status(403)
          .json({ error: "accout already exist with google" });
      }
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({ error: err.message });
    });
});

server.post("/google-auth", async (req, res) => {
  let { access_token } = req.body;

  getAuth()
    .verifyIdToken(access_token)
    .then(async (decodedUser) => {
      let { email, name, picture } = decodedUser;

      picture = picture.replace("s96-c", "s384-c"); //its for get high resulution image
      console.log(picture);

      let user = await User.findOne({ "personal_info.email": email })
        .select(
          "personal_info.fullname personal_info.username personal_info.profile_img google_auth"
        )
        .then((u) => {
          return u || null;
        })
        .catch((err) => {
          return res.status(500).json({ error: err.message });
        });

      if (user) {
        // login user if alredy exist
        if (!user.google_auth) {
          return res.status(403).json({
            error: "google account aleardy exist login with mail and password",
          });
        }
      } else {
        // singn up with google
        let username = await generateUsername(email);

        user = new User({
          personal_info: {
            fullname: name,
            email,
            profile_img: picture,
            username,
          },
          google_auth: true,
        });

        await user
          .save()
          .then((u) => {
            user = u;
          })
          .catch((err) => {
            return res.status(500).json({ error: err.message });
          });
      }

      return res.status(200).json(formatDatatoSend(user));
    })
    .catch((err) => {
      return res
        .status(500)
        .json({ error: "faild to authenticate with google account" });
    });
});

server.post("/create-blog", verifyJWT, (req, res) => {
  let authorId = req.user;

  let { title, des, banner, tags, content, draft } = req.body;

  if (!title.length) {
    return res
      .status(403)
      .json({ error: "you must provide a title to publish the blog" });
  }

  if (!des.length || des.length > 200) {
    return res
      .status(403)
      .json({ error: "you must provide blog description under 200 charecter" });
  }

  if (!banner.length) {
    return res
      .status(403)
      .json({ error: "You must provide a blog banner to publish" });
  }

  if (!content.blocks.length) {
    return res
      .status(403)
      .json({ error: "there must be a some blog content to publis the blog" });
  }

  if (!tags.length || tags.length > 10) {
    return res
      .status(403)
      .json({ error: "provide tag inorder to publish maximum 10 tags" });
  }

  tags = tags.map((tag) => tag.toLowerCase());

  let blog_id =
    title
      .replace(/[^a-zA-z0-9]/g, " ")
      .replace(/\s+/g, "-")
      .trim() + nanoid();

  let blog = new Blog({
    title,
    des,
    banner,
    content,
    tags,
    author: authorId,
    blog_id,
    draft: Boolean(draft),
  });

  blog.save().then((blog) => {
    let incrementVal = draft ? 0 : 1;

    User.findOneAndUpdate(
      { _id: authorId },
      {
        $inc: { "account_info.total_posts": incrementVal },
        $push: { blogs: blog._id },
      }
    )
      .then((user) => {
        return res.status(200).json({ id: blog.blog_id });
      })
      .catch((err) => {
        return res
          .status(500)
          .json({ error: "Failed to update total post number" });
      });
  })
  .catch(err => {
    return res.status(500).json({error: err.message})
  })


});

server.listen(process.env.PORT, () => {
  console.log("listening on port ->" + process.env.PORT);
});
