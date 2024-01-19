"use client"
import React, { useState } from 'react';
import './login.css';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from "@/components/ui/button"



function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const [isAlertVisibleU, setIsAlertVisibleU] = useState(false);
  function ButtonDestructive({ onClick }) {
    return <Button type="button" variant="destructive" onClick={onClick}>Close</Button>;
  }
  const handleDestructiveButtonClick = () => {
    // Additional destructive action logic
    console.log("Destructive button clicked");
    // Close the alert
    handleAlertClose();
  };
  const handleValidationU = (e) => {
    let input = e.target.value;
    let regex = /^[a-zA-Z0-9_]+$/;
    if (regex.test(input)) {
      setUsername(input);
    } else {
      const updatedValue = input.slice(0, -1);
      setUsername(updatedValue);
      setIsAlertVisibleU(true);
    }
  };

  const handleValidationP = (e) => {
    let input = e.target.value;
    let regex = /^(?:(?!\s)[^\s'"])+$/;
    if (regex.test(input)) {
      setPassword(input);
    } else {
      const updatedValue = input.slice(0, -1);
      setPassword(updatedValue);
      setIsAlertVisible(true);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    // login logic

    console.log('Username:', username);
    console.log('Password:', password);
  };

  const handleAlertClose = () => {
    setIsAlertVisible(false);
    setIsAlertVisibleU(false);
  };

  return (
    <div className="form-cont">
      <h2 className="form-title">Login</h2>
      <form className="form" onSubmit={handleLogin}>
        <ul className="form-list">
          <li className="elements">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={handleValidationU}
              required
            />
          </li>
          <li className="elements">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={handleValidationP}
              required
            />
          </li>
          <li className="elements" id="button-log-in">
            <button type="submit" >Log In</button>
          </li>
        </ul>
        <li className="elements">
          <a className="sign-up-text" href="signUp">If you have not signed yet? Sign in</a>
        </li>
      </form>

      {/* Custom Alert */}
      {isAlertVisible && (
        <Alert onClose={handleAlertClose}>
          <AlertTitle>Error in password!</AlertTitle>
          <AlertDescription>Please enter a valid Character.<br/>
                              * Password can't contain space or quote Characters.
          </AlertDescription>
          <ButtonDestructive onClick={handleDestructiveButtonClick} />
        </Alert>
        
      )}
      {isAlertVisibleU && (
        <Alert onClose={handleAlertClose}>
          <AlertTitle>Error in Username!</AlertTitle>
          <AlertDescription>Please enter a valid Character.<br/>
                              * Username can't contain space or quote Characters.
          </AlertDescription>
          <ButtonDestructive onClick={handleDestructiveButtonClick} />
        </Alert>
        
      )}
    </div>
  );
}

export default LoginPage;
