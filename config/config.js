import Twit from "twit";
import dotenv from "dotenv";

dotenv.config();

// auth methods
const auth = () => {
  let secret = {
    //twitter api key
    consumer_key: process.env.API_KEY,
    //twitter secret key
    consumer_secret: process.env.SECRET_KEY,
    //twitter access token
    access_token: process.env.ACCESS_TOKEN,
    //twitter access token secret
    access_token_secret: process.env.ACCESS_TOKEN_SECRET
  };

  var client = new Twit(secret);
  return client;
};

export { auth };
