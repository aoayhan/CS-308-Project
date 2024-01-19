import React from 'react'



import './details.css'

const Details = () => {
  return (
    <div className="details-details">
      <div className="details-details1">
        <div className="details-container">
          <span className="details-text sectionTitle">
            <span>Details</span>
            <br></br>
          </span>
          <h2 className="details-details-heading heading2">
          With our search page, you can easily find the latest music releases, explore different genres, and create personalized playlists.
          </h2>
          <span className="details-details-sub-heading">
          Unleash Your Musical Journey
          </span>
        </div>
        <img
          alt="image"
          src="https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5MTMyMXwwfDF8cmFuZG9tfHx8fHx8fHx8MTcwMDY4MzMzOXw&ixlib=rb-4.0.3&q=80&w=400"
          className="details-details-image"
        />
      </div>
    </div>
  )
}



export default Details
