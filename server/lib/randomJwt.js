import crypto from 'crypto'

export const  jwtString = crypto.randomBytes(64).toString('hex');
