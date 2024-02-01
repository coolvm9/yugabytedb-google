import "./App.css";
import axios from "axios";
import React, { useContext, useState } from "react";
import HouseSVG from "./assets/house.svg";

function App() {
  const [query, setQuery] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const trimmedQuery = query?.trim();
      const response = await axios.get(
        `/api/recommendations?searchText=${btoa(trimmedQuery)}`
      );
      setRecommendations(response?.data);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    }
    setIsLoading(false);
  };
  return (
    <div>
      <header className="header">
        <div className="brand-logo-container">
          <span className="brand-logo">
            <img src={HouseSVG} width={30}></img>
          </span>
          YugaLodgings
        </div>
      </header>

      <div className="lodgings-search-container">
        <div className="search-container">
          <h1 className="search-heading">Discover Lodgings</h1>
          <h2 className="search-subheading">Adventure is one search away</h2>
          <form onSubmit={handleSubmit}>
            <textarea
              type="text"
              placeholder="Search lodgings..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="search-button-container">
              <button type="submit">Search</button>
              {isLoading && <div className="spinner"></div>}
            </div>
          </form>
        </div>
        <ul>
          {recommendations?.map((listing, index) => (
            <li key={index}>
              <div className="listing-header">
                <div className="title">{listing.name}</div>
                <div className="price">{listing.price}</div>
              </div>
              <div className="overview">{listing.description}</div>
              <div className="similarity">
                Search Similarity Score:{" "}
                {listing.similarity && typeof listing.similarity === "number"
                  ? listing.similarity.toFixed(3)
                  : 0}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
