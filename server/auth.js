import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, dbAvailable } from './lib/db.js';
import { config } from './config.js';

export function signUser(user){return jwt.sign({sub:user.id,email:user.email,name:user.name},config.jwtSecret,{expiresIn:'7d'})}
export function authMiddleware(req,res,next){
  const token=(req.headers.authorization||'').replace(/^Bearer\s+/,'');
  if(!token)return res.status(401).json({error:'Authentication required'});
  try{req.user=jwt.verify(token,config.jwtSecret);next()}catch{return res.status(401).json({error:'Invalid token'})}
}
export async function register(email,password,name=''){
  if(!(await dbAvailable()))throw new Error('Database required for accounts');
  const hash=await bcrypt.hash(password,12);
  const r=await query(`insert into users(email,password_hash,name) values($1,$2,$3) returning id,email,name`,[email.toLowerCase(),hash,name]);
  return r.rows[0];
}
export async function login(email,password){
  if(!(await dbAvailable()))throw new Error('Database required for accounts');
  const r=await query(`select id,email,name,password_hash from users where email=$1`,[email.toLowerCase()]);
  const u=r.rows[0];if(!u||!(await bcrypt.compare(password,u.password_hash)))throw new Error('Invalid credentials');
  return {id:u.id,email:u.email,name:u.name};
}
