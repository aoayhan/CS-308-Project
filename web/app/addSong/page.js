"use client";
import React, { useState } from 'react';
import './addSong.css';

function AddSong() {
  const [songInput, setSongInput] = useState('');
  const [artistInput, setArtistInput] = useState('');
  const [albumInput, setAlbumInput] = useState('');
  const [publishedYearInput, setPublishedYearInput] = useState('');

  const handleAddSong = async (e) => {
    e.preventDefault();

    // Add song logic 

    console.log('Song Title:', songInput);
    console.log('Artist:', artistInput);
    console.log('Album Name:', albumInput);
    console.log('Published Year:', publishedYearInput);
  };

  return (
    <div className='form-cont'>
      <h2 className='form-title'>Add Song</h2>
      <form className='form' onSubmit={handleAddSong}>
        <ul className='form-list'>
          <li className='elements'>
            <input
              type="text"
              placeholder="Song Title"
              value={songInput}
              onChange={(e) => setSongInput(e.target.value)}
              className='songInput'
              required
            />
          </li>
          <li className='elements'>
            <input
              type="text"
              placeholder="Artist"
              value={artistInput}
              onChange={(e) => setArtistInput(e.target.value)}
              className='songInput'
              required
            />
          </li>
          <li className='elements'>
            <input
              type="text"
              placeholder="Album Name"
              value={albumInput}
              onChange={(e) => setAlbumInput(e.target.value)}
              className='songInput'
              required
            />
          </li>
          <li className='elements'>
            <input
              type="text"
              placeholder="Published Year"
              value={publishedYearInput}
              onChange={(e) => setPublishedYearInput(e.target.value)}
              className='songInput'
              required
            />
          </li>
          <li className='elements' id='button-add-song'>
            <button type="submit" className='songSubmitButton'>Submit</button>
          </li>
        </ul>
      </form>
    </div>
  );
}

export default AddSong;
