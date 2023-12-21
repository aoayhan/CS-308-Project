"use client";
import React, { useState } from 'react';
import './signUp.css';

function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = async (e) => {
    e.preventDefault();

    // Sign-up logic 

    console.log('Email:', email);
    console.log('Password:', password);
  };

  return (
    <div className='form-cont'>
      <h2 className='form-title'>Sign Up</h2>
      <form className='form' onSubmit={handleSignup}>
        <ul className='form-list'>
          <li className='elements'>
            <input
              type="text"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </li>
          <li className='elements'>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </li>
          <li className='elements' id='button-sign-up'>
            <button type="submit">Submit</button>
          </li>
        </ul>
        <li className='elements'>
          <a href='/'>Already have an account? Log in</a>
        </li>
      </form>
    </div>
  );
}

export default Signup;