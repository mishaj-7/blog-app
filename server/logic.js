import crypto from 'crypto'
import {nanoid} from 'nanoid'

// export const  jwtString = crypto.randomBytes(64).toString('hex');
// console.log(jwtString);

const date = new Date();
const imageName = `${nanoid()}-${date.getTime()}.jpeg`;
console.log(imageName)